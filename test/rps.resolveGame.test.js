const RockPaperScissors = artifacts.require('RockPaperScissors');
const Choice = artifacts.require('RockPaperScissorsGameRules').Choice;
const helper = require('./helper');

contract('RockPaperScissors - resolve the game', (accounts) => {
    const player1 = accounts[0];
    const player2 = accounts[1];
    // player 1 choose rock and encoded it with secret
    const player1Choice = Choice.Rock;
    const secretChoice = helper.encode(player1Choice, helper.SECRET);
    // player 2 should win
    const player2Choice = Choice.Paper;
    const gameId = 0;

    let rps;
    before(async () => {
        rps = await RockPaperScissors.deployed();
        await rps.startNewGame(secretChoice, { from: player1, value: helper.ENTRY_FEE });
    });

    it('game id must be valid', async () => {
        invalidGameId = gameId + 1;
        await helper.assert.throws(() => rps.resolve(invalidGameId, helper.SECRET, { from: player1 }));
    });

    it('only player who started the game can call resolve', async () => {
        await helper.assert.throws(() => rps.resolve(gameId, helper.SECRET, { from: player2 }));
    });

    it('player 2 has to be found for a game to be resolved', async () => {
        await helper.assert.throws(() => rps.resolve(gameId, helper.SECRET, { from: player1 }));
    });

    it('player 1 must provide the secret to decode his initial choice and end the game', async () => {
        // make a choice for player 2 (Rock)
        await rps.play(gameId, player2Choice, { from: player2, value: helper.ENTRY_FEE });

        let response;
        await helper.assert.doesNotThrow(async () => {
            response = await rps.resolve(gameId, helper.SECRET, { from: player1 });
        });

        const game = await rps.games(gameId);

        assert(game.resolved, 'game must be market as resolved');
        assert.equal(player1Choice, game.player1RevealedChoice, 'initial and revealed choice must match');
        // we are expecting player 2 to win
        assert.equal(player2, game.winner);

        assert.equal(1, response.logs.length, 'expected one "GameEnded" event emmited');
        assert.equal('GameEnded', response.logs[0].event);
        assert.equal(gameId, response.logs[0].args[0], 'event arg does not match gameId');
    });

    it('the game winner can call withdraw to claim their rewards', async () => {
        const initialBalance = await web3.eth.getBalance(player2);

        await rps.withdraw({ from: player2 });

        const newBalance = await web3.eth.getBalance(player2);

        assert(newBalance - initialBalance > helper.ENTRY_FEE, 'player 2 should have his balance increased');
    });

    it('player 1 cannot call resolve on already resolved game', async () => {
        await helper.assert.throws(() => rps.resolve(gameId, helper.SECRET, { from: player1 }));
    });

    it('player 2 cannot call play on already resolved game', async () => {
        await helper.assert.throws(() => rps.play(gameId, Choice.Rock, { from: player2 }));
    });

    it('players get back half of their stake for a draw', async () => {
        const sameChoice = Choice.Scissors;
        const secretChoice = helper.encode(sameChoice, helper.SECRET);
        const player1InitialBalance = await rps.getBalance(player1);
        const palyer2InitialBalance = await rps.getBalance(player2);

        // play a new draw game to the end
        await rps.startNewGame(secretChoice, { from: player1, value: helper.ENTRY_FEE });
        const newGameId = (await rps.getActiveGameIds())[0];
        await rps.play(newGameId, sameChoice, { from: player2, value: helper.ENTRY_FEE });
        await rps.resolve(newGameId, helper.SECRET, { from: player1 });

        const game = await rps.games(newGameId);
        // there is no winner for a draw
        assert.equal(0, game.winner);

        const halfStake = web3.utils.toBN(helper.ENTRY_FEE).div(web3.utils.toBN(2)).toString(10);
        const player1Balance = await rps.getBalance(player1);
        const player2Balance = await rps.getBalance(player2);

        assert.equal(
            halfStake,
            player1Balance - player1InitialBalance,
            'player 1 did not receive half of his stake back'
        );
        assert.equal(
            halfStake,
            player2Balance - palyer2InitialBalance,
            'player 1 did not receive half of his stake back'
        );
    });

    it('new game started after a draw gets adiidiontal half of the pot from the draw game', async () => {
        await rps.startNewGame(secretChoice, { from: player1, value: helper.ENTRY_FEE });
        const newGameId = (await rps.getActiveGameIds())[0];
        const previosGameId = newGameId.sub(web3.utils.toBN(1));

        const newGame = await rps.games(newGameId);
        const previousGame = await rps.games(previosGameId);

        const expectedNewGamePot = previousGame.pot.div(web3.utils.toBN(2)).add(web3.utils.toBN(helper.ENTRY_FEE));

        assert(
            expectedNewGamePot.toString(10),
            newGame.pot.toString(10),
            'expected new game pot to have additional half of the pot from previous draw game'
        );
    });

    it('player 1 looses if his initial choice was invalid', async () => {
        // there is no value of 3 in Choice enum
        const invalidChoice = 3;
        const secretChoice = helper.encode(invalidChoice, helper.SECRET);
        const newGameResponse = await rps.startNewGame(secretChoice, { from: player1, value: helper.ENTRY_FEE });
        const newGameId = newGameResponse.logs[0].args[0];
        await rps.play(newGameId, Choice.Rock, { from: player2, value: helper.ENTRY_FEE });

        const player2InitialBalance = await rps.getBalance(player2);
        await rps.resolve(newGameId, helper.SECRET, { from: player1 });
        const player2NewBalance = await rps.getBalance(player2);

        const game = await rps.games(newGameId);
        assert.equal(player2, game.winner);
        assert.equal(player2NewBalance - player2InitialBalance, game.pot);
    });
});
