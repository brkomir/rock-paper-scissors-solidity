const RockPaperScissors = artifacts.require('RockPaperScissors');
const RpsGame = artifacts.require('RockPaperScissorsGameRules');

contract('RockPaperScissors - gameplay', () => {
    let rps;
    before(async () => {
        rps = await RockPaperScissors.deployed();
    });

    it('rock vs scissors - wins', async () => {
        const result = await rps.confront(RpsGame.Choice.Rock, RpsGame.Choice.Scissors);

        assert.equal(RpsGame.Outcome.Player1Wins, result);
    });

    it('rock vs paper - looses', async () => {
        const result = await rps.confront(RpsGame.Choice.Rock, RpsGame.Choice.Paper);

        assert.equal(RpsGame.Outcome.Player2Wins, result);
    });

    it('rock vs rock - draw', async () => {
        const result = await rps.confront(RpsGame.Choice.Rock, RpsGame.Choice.Rock);

        assert.equal(RpsGame.Outcome.Draw, result);
    });

    it('paper vs rock - wins', async () => {
        const result = await rps.confront(RpsGame.Choice.Paper, RpsGame.Choice.Rock);

        assert.equal(RpsGame.Outcome.Player1Wins, result);
    });

    it('paper vs scissors - looses', async () => {
        const result = await rps.confront(RpsGame.Choice.Paper, RpsGame.Choice.Scissors);

        assert.equal(RpsGame.Outcome.Player2Wins, result);
    });

    it('paper vs paper - draw', async () => {
        const result = await rps.confront(RpsGame.Choice.Paper, RpsGame.Choice.Paper);

        assert.equal(RpsGame.Outcome.Draw, result);
    });

    it('scissors vs paper - wins', async () => {
        const result = await rps.confront(RpsGame.Choice.Scissors, RpsGame.Choice.Paper);

        assert.equal(RpsGame.Outcome.Player1Wins, result);
    });

    it('scissors vs rock - looses', async () => {
        const result = await rps.confront(RpsGame.Choice.Scissors, RpsGame.Choice.Rock);

        assert.equal(RpsGame.Outcome.Player2Wins, result);
    });

    it('scissors vs scissors - draw', async () => {
        const result = await rps.confront(RpsGame.Choice.Scissors, RpsGame.Choice.Scissors);

        assert.equal(RpsGame.Outcome.Draw, result);
    });
});
