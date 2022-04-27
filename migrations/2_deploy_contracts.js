const rps = artifacts.require('RockPaperScissors');
const web3 = require('web3');

module.exports = function(deployer) {
    const entryFee = web3.utils.toWei('0.1', 'ether');
    deployer.deploy(rps, entryFee);
};
