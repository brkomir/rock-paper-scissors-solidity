const RockPaperScissors = artifacts.require('RockPaperScissors');
const Choice = artifacts.require('RockPaperScissorsGameRules').Choice;
const helper = require('./helper').default;

// TODO: assert not playabe if game is resolved
contract('RockPaperScissors - second player moves', (accounts) => {
    const player1 = accounts[0];
    const player2 = accounts[1];
    const gameId = 0;
    const player2Choice = Choice.Scissors;
    const secretChoice = helper.encode(Choice.Rock, helper.SECRET);

    let rps;
    before(async () => {
        rps = await RockPaperScissors.deployed();
        await rps.startNewGame(secretChoice, { from: player1, value: helper.ENTRY_FEE });
    });

    it('player 2 cannot enter an active game with amount less than entry fee', async () => {
        await helper.assert.throws(() =>
            rps.play(gameId, player2Choice, { from: player2, value: web3.utils.toWei('0.099', 'ether') })
        );
    });

    it('player 2 cannot enter an active game with amount greater than entry fee', async () => {
        await helper.assert.throws(() =>
            rps.play(gameId, player2Choice, { from: player2, value: web3.utils.toWei('0.101', 'ether') })
        );
    });

    it('player 2 cannot enter a game with invalid id', async () => {
        await helper.assert.throws(() =>
            rps.play(gameId + 1, player2Choice, { from: player2, value: helper.ENTRY_FEE })
        );
    });

    it('player 2 cannot enter a game with invalid choice', async () => {
        // 3 does not exists in Choice enum
        await helper.assert.throws(() => rps.play(gameId, 3, { from: player2, value: helper.ENTRY_FEE }));
    });

    it('player 2 can enter an active game with amount exact as entry fee and valid choice', async () => {
        let response;
        await helper.assert.doesNotThrow(async () => {
            response = await rps.play(gameId, player2Choice, { from: player2, value: helper.ENTRY_FEE });
        });

        const game = await rps.games(gameId);
        assert.equal(player2, game.player2);
        assert.equal(player2Choice, game.player2Choice);
        assert.equal(helper.ENTRY_FEE * 2, game.pot.toString(10), 'entry fee from player 2 has to be in the pot');

        assert.equal(1, response.logs.length, 'expected one "SecondPlayerFound" event to be emmited');
        assert.equal('SecondPlayerFound', response.logs[0].event);
    });

    it('player 2 cannot resubmit his choice', async () => {
        await helper.assert.throws(() => rps.play(gameId, Choice.Paper, { from: player2, value: helper.ENTRY_FEE }));

        const game = await rps.games(gameId);
        assert.equal(player2, game.player2);
        assert.equal(player2Choice, game.player2Choice);
    });

    it('player 3 cannot overtake the game from player 2', async () => {
        const player3 = accounts[2];
        await helper.assert.throws(() => rps.play(gameId, Choice.Paper, { from: player3, value: helper.ENTRY_FEE }));

        const game = await rps.games(gameId);
        assert.equal(player2, game.player2);
        assert.equal(player2Choice, game.player2Choice);
    });
});
