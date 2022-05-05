const RockPaperScissors = artifacts.require('RockPaperScissors');
const Choice = artifacts.require('RockPaperScissorsGameRules').Choice;
const helper = require('./helper');

contract('RockPaperScissors - decode secret choice', () => {
    let rps;
    before(async () => {
        rps = await RockPaperScissors.deployed();
    });

    it('rock is a valid choice', async () => {
        const choice = Choice.Rock;
        const secretChoice = helper.encode(choice, helper.SECRET);

        const result = await rps.decodeSecretChoice(secretChoice, helper.SECRET);

        assert(result.isValid);
        assert.equal(choice, result.choice);
    });

    it('paper is a valid choice', async () => {
        const choice = Choice.Paper;
        const secretChoice = helper.encode(choice, helper.SECRET);

        const result = await rps.decodeSecretChoice(secretChoice, helper.SECRET);

        assert(result.isValid);
        assert.equal(choice, result.choice);
    });

    it('scissors is a valid choice', async () => {
        const choice = Choice.Scissors;
        const secretChoice = helper.encode(choice, helper.SECRET);

        const result = await rps.decodeSecretChoice(secretChoice, helper.SECRET);

        assert(result.isValid);
        assert.equal(choice, result.choice);
    });

    it('anything else is not a valid choice', async () => {
        const choice = Choice.Scissors + 1;
        const secretChoice = helper.encode(choice, helper.SECRET);

        const result = await rps.decodeSecretChoice(secretChoice, helper.SECRET);

        assert(!result.isValid);
    });
});
