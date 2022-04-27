const SECRET = '0xd505712d33aaa4019e9ebbc23bfc3e3ec401a0ff6e18480cb30e2213d458a0dd';
const ENTRY_FEE = web3.utils.toWei('0.1', 'ether').toString();

const expect = {
    throws: async (asyncFunc) => {
        try {
            await asyncFunc();
            assert(false);
        } catch (err) {
            assert(err.toString().includes('revert'), 'expected transaction to revert');
        }
    },

    doesNotThrow: async (asyncFunc) => {
        try {
            await asyncFunc();
        } catch (err) {
            assert(false, 'expected transaction not to revert, Error: ' + err);
        }
    },
};

const encode = (choice, secret) => {
    return web3.utils.soliditySha3({ t: 'uint8', v: choice }, { t: 'uint256', v: web3.utils.toBN(secret) });
};

const evmIncreaseTime = async (seconds) => {
    await web3.currentProvider.send(
        {
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [seconds],
            id: new Date().getTime(),
        },
        (err, res) => {
            if (err) {
                console.log(err);
                throw err;
            }
        }
    );
};

exports.default = {
    SECRET,
    ENTRY_FEE,
    assert: expect,
    encode,
    evmIncreaseTime,
};
