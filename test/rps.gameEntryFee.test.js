const RockPaperScissors = artifacts.require('RockPaperScissors');
const helper = require('./helper').default;

contract('RockPaperScissors - game entry fee', (accounts) => {
    let rps;
    before(async () => {
        rps = await RockPaperScissors.deployed();
    });

    it('contract should have game entry fee and owner set', async () => {
        const entryFee = await rps.entryFee();
        const owner = await rps.owner();

        assert.equal(helper.ENTRY_FEE.toString(), entryFee.toString(10));
        assert.equal(accounts[0], owner);
    });

    it('only the contract owner can change the entry fee', async () => {
        const newEntryFee = web3.utils.toWei('1', 'ether');

        // someone else tries to chage the entry fee
        await helper.assert.throws(() => rps.changeEntryFee(newEntryFee, { from: accounts[1] }));

        // owner can change the entry fee
        await rps.changeEntryFee(newEntryFee, { from: accounts[0] });

        const actualEntryFee = await rps.entryFee();

        assert.equal(newEntryFee.toString(10), actualEntryFee.toString(10));
    });

    it('is not possible to send ether directly to the contract', async () => {
        await helper.assert.throws(() =>
            web3.eth.sendTransaction({
                from: accounts[1],
                to: rps.address,
                value: '1000000000000000000',
            })
        );
    });
});
