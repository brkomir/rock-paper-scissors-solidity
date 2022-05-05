const RockPaperScissors = artifacts.require('RockPaperScissors');
const Choice = artifacts.require('RockPaperScissorsGameRules').Choice;
const helper = require('./helper');

contract('RockPaperScissors - expired game', (accounts) => {
    const player1 = accounts[0];
    const player2 = accounts[1];
    const secretChoice = helper.encode(Choice.Rock, helper.SECRET);
    const secondsIn48Hours = 48 * 60 * 60;
    const gameId = 0;

    let rps;
    before(async () => {
        rps = await RockPaperScissors.deployed();
    });

    it('player 2 cannot enter the game 48 hours after the game was started', async () => {
        await rps.startNewGame(secretChoice, { from: player1, value: helper.ENTRY_FEE });

        await helper.evmIncreaseTime(secondsIn48Hours);

        await helper.assert.throws(async () =>
            rps.play(gameId, Choice.Rock, { from: player2, value: helper.ENTRY_FEE })
        );
    });

    it('player 1 can resolve the game if the second player is not found within 48h', async () => {
        let response;
        await helper.assert.doesNotThrow(async () => {
            response = await rps.resolve(gameId, helper.SECRET, { from: player1 });
        });

        const game = await rps.games(gameId);
        const player1Balance = await rps.getBalance(player1);

        assert(game.expired, 'game should be marked as expired');
        assert(game.resolved, 'game should be marked as resolved');
        assert.equal(0, game.winner, 'game should have no winner');
        assert.equal(game.pot.toString(10), player1Balance.toString(10), 'stake should be returned to player 1');

        assert.equal(1, response.logs.length, 'expected one "GameExpired" event emmited');
        assert.equal('GameExpired', response.logs[0].event);
        assert.equal(gameId, response.logs[0].args[0], 'event arg does not match gameId');
    });

    it('player 2 cannot call resolveExpiredGame before 72 hours have passed since the game was started', async () => {
        await helper.assert.throws(() => rps.resolveExpiredGame(gameId, { from: player2 }));
    });

    it('player 1 cannot call resolve after 72 hours have passed since game was started', async () => {
        await rps.startNewGame(secretChoice, { from: player1, value: helper.ENTRY_FEE });
        const newGameId = (await rps.getActiveGameIds())[0];

        await rps.play(newGameId, Choice.Rock, { from: player2, value: helper.ENTRY_FEE });

        // this will forward the time for 72 hours
        // and we cam consider this game expired
        await helper.evmIncreaseTime(secondsIn48Hours);
        const secondsIn24Hours = 24 * 60 * 60;
        await helper.evmIncreaseTime(secondsIn24Hours);

        await helper.assert.throws(() => rps.resolve(gameId, helper.SECRET, { from: player1 }));
    });

    it('player 2 can resolveExpiredGame after 72 hours have passed since the game was started', async () => {
        const newGameId = (await rps.getActiveGameIds())[0];
        let response;
        await helper.assert.doesNotThrow(async () => {
            response = await rps.resolveExpiredGame(newGameId, { from: player2 });
        });

        const game = await rps.games(newGameId);
        const player2Balance = await rps.getBalance(player2);

        assert(game.expired, 'game should expire within 72h if player 1 does not reveal choice');
        assert(game.resolved, 'game should be marked as resolved');
        assert.equal(0, game.winner, 'game should have no winner');
        assert.equal(game.pot.toString(10), player2Balance.toString(10), 'player 2 should receive pot');

        assert.equal(1, response.logs.length, 'expected one "GameExpired" event emmited');
        assert.equal('GameExpired', response.logs[0].event);
        assert.equal(newGameId.toString(10), response.logs[0].args[0].toString(10), 'event arg does not match gameId');
    });
});
