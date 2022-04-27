const RockPaperScissors = artifacts.require('RockPaperScissors');
const Choice = artifacts.require('RockPaperScissorsGameRules').Choice;
const helper = require('./helper').default;

contract('RockPaperScissors - new game', (accounts) => {
    const player1 = accounts[0];
    const player2 = accounts[1];
    const secretChoice = helper.encode(Choice.Rock, helper.SECRET);

    let rps;
    before(async () => {
        rps = await RockPaperScissors.deployed();
    });

    it('player cannot start a new game with value provided less than entry fee', async () => {
        await helper.assert.throws(() =>
            rps.startNewGame(secretChoice, {
                from: player1,
                value: web3.utils.toWei('0.099', 'ether'),
            })
        );
    });

    it('player cannot start a new game with value provided more than entry fee', async () => {
        await helper.assert.throws(() =>
            rps.startNewGame(secretChoice, {
                from: player1,
                value: web3.utils.toWei('0.101', 'ether'),
            })
        );
    });

    it('player can start a new game with value provided equal to entry fee', async () => {
        let response;
        await helper.assert.doesNotThrow(async () => {
            response = await rps.startNewGame(secretChoice, { from: player1, value: helper.ENTRY_FEE });
        });

        assert.equal(1, response.logs.length, 'expected one "NewGame" event to be emmited');
        assert.equal('NewGame', response.logs[0].event);
        assert.equal(0, response.logs[0].args[0], 'event arg[0] must equal gameId');
        assert.equal(player1, response.logs[0].args[1], 'event arg[1] must equal game owner');
    });

    it('new game is created with correct parameters', async () => {
        const response = await rps.startNewGame(secretChoice, { from: player2, value: helper.ENTRY_FEE });
        // get Id from emmited event
        let newGameId = response.logs[0].args[0];
        const blockNumber = (await web3.eth.getTransaction(response.tx)).blockNumber;
        const timestamp = (await web3.eth.getBlock(blockNumber)).timestamp;

        const game = await rps.games(newGameId);

        assert.equal(newGameId, game.id.toString(10), 'game id does not match');
        assert.equal(player2, game.player1), 'player 1 should be set to user who created the game';
        assert.equal(0, game.player2, 'player 2 must not be set on a new game');
        assert.equal(secretChoice, game.player1SecretChoice, 'secret choice does not match');
        assert.equal(helper.ENTRY_FEE, game.pot.toString(10), 'incorrect game pot value');
        assert.equal(timestamp, game.startTime, 'timestamp does not match');
        assert.equal(0, game.winner, 'new game does not have a winner');
    });
});
