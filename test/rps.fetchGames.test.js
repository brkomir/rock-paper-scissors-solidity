const RockPaperScissors = artifacts.require('RockPaperScissors');
const Choice = artifacts.require('RockPaperScissorsGameRules').Choice;
const helper = require('./helper');

contract('RockPaperScissors - fetch games', (accounts) => {
    const player1 = accounts[0];
    const player2 = accounts[1];
    const player3 = accounts[2];
    const secretChoice = helper.encode(Choice.Rock, helper.SECRET);

    let rps;
    before(async () => {
        rps = await RockPaperScissors.deployed();
    });

    it('new contract has no active games', async () => {
        const gamesCount = (await rps.getActiveGameIds()).length;

        assert.equal(0, gamesCount, 'there should be no active games');
    });

    it('player should be able to fetch all games he created', async () => {
        // create 2 games as player 1
        await rps.startNewGame(secretChoice, { from: player1, value: helper.ENTRY_FEE });
        await rps.startNewGame(secretChoice, { from: player1, value: helper.ENTRY_FEE });
        // create 1 game as player 2
        await rps.startNewGame(secretChoice, { from: player2, value: helper.ENTRY_FEE });
        // create 1 game as player 3
        await rps.startNewGame(secretChoice, { from: player3, value: helper.ENTRY_FEE });

        const player1Games = await rps.myGames({ from: player1 });
        const player2Games = await rps.myGames({ from: player2 });
        const player3Games = await rps.myGames({ from: player3 });

        assert.equal(2, player1Games.length);
        assert.equal(1, player2Games.length);
        assert.equal(1, player3Games.length);
    });

    it('player should be able to fetch all active game Ids', async () => {
        const activeGameIds = await rps.getActiveGameIds();

        // play second and third game until the end
        await rps.play(activeGameIds[1], Choice.Paper, { from: player2, value: helper.ENTRY_FEE });
        await rps.resolve(activeGameIds[1], helper.SECRET, { from: player1 });
        await rps.play(activeGameIds[2], Choice.Paper, { from: player3, value: helper.ENTRY_FEE });
        await rps.resolve(activeGameIds[2], helper.SECRET, { from: player2 });

        const newActiveGameIds = await rps.getActiveGameIds();

        assert.equal(2, newActiveGameIds.length);
        // since we have resolved gameId = 1, we expect to get 0 and 2 as active game Ids
        assert.equal(
            activeGameIds[0].toString(10),
            newActiveGameIds[0].toString(10),
            `expected ${activeGameIds[0].toString(10)} but got ${newActiveGameIds[0].toString(10)}`
        );
        assert.equal(
            activeGameIds[3].toString(10),
            newActiveGameIds[1].toString(10),
            `expected ${activeGameIds[0].toString(10)} but got ${newActiveGameIds[0].toString(10)}`
        );
    });
});
