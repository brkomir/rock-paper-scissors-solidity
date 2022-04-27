// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./RockPaperScissorsGame.sol";
import "./GameVault.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract RockPaperScissors is RockPaperScissorsGameRules, GameVault {
    struct Game {
        uint256 id;
        address player1;
        bytes32 player1SecretChoice;
        Choice player1RevealedChoice;
        address player2;
        Choice player2Choice;
        uint256 pot;
        uint256 startTime;
        bool resolved;
        bool expired;
        address winner;
    }

    event NewGame(uint256 gameId, address createdBy);
    event SecondPlayerFound(uint256 gameId);
    event GameExpired(uint256 gameId);
    event GameEnded(uint256 gameId);

    modifier requireEntryFee() {
        require(
            msg.value == entryFee,
            string(
                abi.encodePacked(
                    "Entry fee must be equal to ",
                    Strings.toString(entryFee),
                    " Wei"
                )
            )
        );
        _;
    }

    modifier validGameId(uint256 _gameId) {
        require(
            games.length > _gameId,
            string(
                abi.encodePacked(
                    "Could not find a game with id: ",
                    Strings.toString(_gameId)
                )
            )
        );
        _;
    }

    address public owner;
    uint256 public entryFee;
    Game[] public games;
    uint256[] activeGameIds;
    // this field is public for purpose to incetivise players to start a new game
    // in case when undistributedFunds > 0
    uint256 public undistributedFunds;
    mapping(address => Game[]) playerGames;

    constructor(uint256 _entryFee) {
        entryFee = _entryFee;
        owner = msg.sender;
    }

    function changeEntryFee(uint256 _newFee) external {
        require(
            msg.sender == owner,
            "Only the contract owner can chage the entry fee"
        );

        entryFee = _newFee;
    }

    // 1. when starting a new game user must provide his secret choice as sha256 encoded value of
    //  the choice he wants to make (Rock, Paper, Scissors) and a secret value
    // 2. this secret value is later going to be used to decode this secert choice and resolve the game
    // 3. (WARNING) THE SAME SECRET SHOULD NOT BE REUSED MULTIPLE TIMES FOR DIFFERENT GAMES
    //  since this can allow malitious user to correctly predict the player's choice based on
    //  secert choices made in previous games this user has played
    function startNewGame(bytes32 _secretChoice)
        external
        payable
        requireEntryFee
    {
        Game memory newGame;
        newGame.id = games.length;
        newGame.player1 = msg.sender;
        newGame.player1SecretChoice = _secretChoice;
        newGame.pot = entryFee;
        newGame.startTime = block.timestamp;

        // if previos game ended in draw add half of its pot to the pot
        if (undistributedFunds > 0) {
            newGame.pot += undistributedFunds;
            undistributedFunds = 0;
        }

        games.push(newGame);
        playerGames[msg.sender].push(newGame);
        activeGameIds.push(newGame.id);

        emit NewGame(newGame.id, msg.sender);
    }

    // player 2 calls this function to enter a game with provided _gameId
    function play(uint256 _gameId, Choice _choice)
        external
        payable
        requireEntryFee
        validGameId(_gameId)
    {
        Game storage game = games[_gameId];

        require(!game.resolved, "Game has alraady been resolved");
        require(
            !timePreiodExpired(48 hours, game.startTime),
            "The game has expired. 48 hours have passed since the game was started"
        );
        require(
            game.player2 == address(0),
            "The game already has two players participating"
        );

        game.player2 = msg.sender;
        game.player2Choice = _choice;
        game.pot += msg.value;

        emit SecondPlayerFound(game.id);
    }

    // this function is ment to be called by the player 1 (who created the game)
    // in order to reveal his initial choice and decide the game outcome (resolve)
    function resolve(uint256 _gameId, bytes32 _secret)
        external
        validGameId(_gameId)
    {
        Game storage game = games[_gameId];

        require(!game.resolved, "Game has alraady been resolved");
        require(
            game.player1 == msg.sender,
            "Only the player who started the game can call this function"
        );

        // 48 hours is the time for player 2 to be found
        if (timePreiodExpired(48 hours, game.startTime)) {
            handleGameExpirationInFavourOf(game, game.player1);

            return;
        }

        require(
            game.player2 != address(0),
            "Game cannot be resolved yet sicnce the second player was not found and the game has not expired"
        );

        // all conditions for resolving the game have been fulfilled
        resolveGame(game, _secret);

        emit GameEnded(game.id);
    }

    // player 2 can call this function in case when player 1 doesn't reveal his
    // secret choice and the 72 hours have passed in total form when the game was started
    function resolveExpiredGame(uint256 _gameId) external validGameId(_gameId) {
        Game storage game = games[_gameId];

        require(
            game.player2 == msg.sender,
            "Only registered player 2 can call this function"
        );

        // 48 hours is the time for player 2 to be found
        // 24 hours if the time ather that for player 1 to reveal his choice
        require(
            timePreiodExpired(48 hours + 24 hours, game.startTime),
            "Game is still waiting for player 1 to reveal his choice"
        );

        handleGameExpirationInFavourOf(game, game.player2);
    }

    function myGames() external view returns (Game[] memory) {
        return playerGames[msg.sender];
    }

    function getActiveGameIds() external view returns (uint256[] memory) {
        return activeGameIds;
    }

    function removeFromActiveGames(uint256 _gameId) private {
        for (uint256 i = 0; i < activeGameIds.length; i++) {
            if (_gameId != activeGameIds[i]) {
                continue;
            }

            activeGameIds[i] = activeGameIds[activeGameIds.length - 1];
            activeGameIds.pop();
            break;
        }
    }

    function resolveGame(Game storage _game, bytes32 _player1Secret) private {
        _game.resolved = true;
        removeFromActiveGames(_game.id);

        (Choice choice, bool isValid) = decodeSecretChoice(
            _game.player1SecretChoice,
            _player1Secret
        );
        if (isValid) {
            _game.player1RevealedChoice = choice;
        } else {
            // when player 1 makes an invalid choice and the game hasn't expired
            // he is then puhisned by loosing the game forcefully, his choice is set
            // to the loosing one in order to reduce code complexity for handling this case
            _game.player1RevealedChoice = wins[_game.player2Choice];
        }

        Outcome outcome = confront(
            _game.player1RevealedChoice,
            _game.player2Choice
        );
        handleOutcome(_game, outcome);
    }

    function handleOutcome(Game storage _game, Outcome _outcome) private {
        if (_outcome == Outcome.Player1Wins) {
            _game.winner = _game.player1;
            balances[_game.player1] += _game.pot;
        } else if (_outcome == Outcome.Player2Wins) {
            _game.winner = _game.player2;
            balances[_game.player2] += _game.pot;
        } else {
            // when a game ends with draw, half of the user's stake
            // is retured, other half is added to the next new game
            undistributedFunds += _game.pot / 2;
            balances[_game.player1] += _game.pot / 4;
            balances[_game.player2] += _game.pot / 4;
        }
    }

    function handleGameExpirationInFavourOf(
        Game storage _game,
        address _beneficiaryPlayer
    ) private {
        _game.expired = true;
        _game.resolved = true;
        balances[_beneficiaryPlayer] += _game.pot;
        removeFromActiveGames(_game.id);
        emit GameExpired(_game.id);
    }

    function timePreiodExpired(uint256 _period, uint256 _gameStartTime)
        private
        view
        returns (bool)
    {
        return _gameStartTime + _period <= block.timestamp;
    }

    fallback() external {}
}
