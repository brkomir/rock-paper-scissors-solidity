// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract RockPaperScissorsGameRules {
    enum Choice {
        Rock,
        Paper,
        Scissors
    }

    enum Outcome {
        Player1Wins,
        Player2Wins,
        Draw
    }

    mapping(Choice => Choice) wins;

    constructor() {
        wins[Choice.Rock] = Choice.Scissors;
        wins[Choice.Paper] = Choice.Rock;
        wins[Choice.Scissors] = Choice.Paper;
    }

    function confront(Choice _player1Choice, Choice _player2Choice)
        public
        view
        returns (Outcome)
    {
        if (_player1Choice == _player2Choice) {
            return Outcome.Draw;
        }

        if (wins[_player1Choice] == _player2Choice) {
            return Outcome.Player1Wins;
        }

        return Outcome.Player2Wins;
    }
    
    // this function is intended to be used both externally and internally
    // the extteral usage is meant for players to check the validity of their
    // encoded choice against the contracts decoding function, since invalid
    // encoding will lead them to loosing the game
    function decodeSecretChoice(bytes32 _secretChoice, bytes32 _secret)
        public
        pure
        returns (Choice choice, bool isValid)
    {
        isValid = true;

        if (
            keccak256(abi.encodePacked(Choice.Rock, _secret)) == _secretChoice
        ) {
            choice = Choice.Rock;
        } else if (
            keccak256(abi.encodePacked(Choice.Paper, _secret)) == _secretChoice
        ) {
            choice = Choice.Paper;
        } else if (
            keccak256(abi.encodePacked(Choice.Scissors, _secret)) ==
            _secretChoice
        ) {
            choice = Choice.Scissors;
        } else {
            isValid = false;
        }
    }
}
