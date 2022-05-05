const RockPaperScissors = artifacts.require('RockPaperScissors');
const Choice = artifacts.require('RockPaperScissorsGameRules').Choice;
const helper = require('./helper');

contract('RockPaperScissors - end-to-end', (accounts) => {
    const player1 = accounts[0];
    const player2 = accounts[1];
    const player3 = accounts[2];

    let rps;
    before(async () => {
        rps = await RockPaperScissors.deployed();
    });

    // 1. there will be 3 games played in total
    // 2. starting stake is 0.2 ETH
    // 3. player 1 vs player 2 = draw (game pot = 0.4 ETH; player 1 = 0.1 ETH; player 2 = 0.1 ETH)
    // 4. player 1 vs player 3 = draw (game pot = 0.4 ETH; player 1 = 0.1 ETH; player 3 = 0.1 ETH)
    // 5. stake changes to 0.4 ETH
    // 6. player 2 vs player 3 = player 2 wins (game pot = 1.2 ETH; player 2 = 1.2 ETH; player 3 = 0 ETH)
    // end balances: player 1 = 0.2 ETH; player 2 = 1.3 ETH; player 3 = 0.1 ETH
    it('3 games played with changing entry fee between games', async () => {
        const secretChoice = helper.encode(Choice.Rock, helper.SECRET);
        await rps.changeEntryFee(web3.utils.toWei('0.2', 'ether'), { from: player1 });
        let entryFee = await rps.entryFee();

        // game 0 - draw
        await rps.startNewGame(secretChoice, { from: player1, value: entryFee });
        await rps.play(0, Choice.Rock, { from: player2, value: entryFee });

        // game 1 - draw
        await rps.startNewGame(secretChoice, { from: player1, value: entryFee });
        await rps.play(1, Choice.Rock, { from: player3, value: entryFee });

        // resolve game 0 and 1
        await rps.resolve(0, helper.SECRET, { from: player1 });
        await rps.resolve(1, helper.SECRET, { from: player1 });

        // update the entry fee
        await rps.changeEntryFee(web3.utils.toWei('0.4', 'ether'), { from: player1 });
        entryFee = await rps.entryFee();

        // game 2 - player 2 wins
        await rps.startNewGame(secretChoice, { from: player2, value: entryFee });
        await rps.play(2, Choice.Scissors, { from: player3, value: entryFee });
        await rps.resolve(2, helper.SECRET, { from: player2 });

        const player1Balance = await rps.getBalance(player1);
        const player2Balance = await rps.getBalance(player2);
        const player3Balance = await rps.getBalance(player3);

        assert.equal(
            web3.utils.toWei('0.2', 'ether'),
            player1Balance.toString(10),
            'player 1 balance should be 0.2 ETH'
        );
        assert.equal(
            web3.utils.toWei('1.3', 'ether'),
            player2Balance.toString(10),
            'player 2 balance should be 1.3 ETH'
        );
        assert.equal(
            web3.utils.toWei('0.1', 'ether'),
            player3Balance.toString(10),
            'player 3 balance should be 0.1 ETH'
        );

        const player2EthBalance = await web3.eth.getBalance(player2);
        await rps.withdraw({ from: player2 });
        const newPlayer2EthBalance = await web3.eth.getBalance(player2);
        const balanceDiff = newPlayer2EthBalance - player2EthBalance;

        assert(
            balanceDiff > web3.utils.toWei('1.29', 'ether'),
            'expected player 2 balance to increase by at least 1.29 ETH after withdraw'
        );
    });
});
