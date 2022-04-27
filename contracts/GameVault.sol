// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract GameVault {
    // player's rewards are kept here until withdrawn
    mapping(address => uint256) balances;  

    // this function is used to withraw funds players
    // have accumulated as rewards from winning games
    function withdraw() external {
        uint256 amount = balances[msg.sender];

        if (amount > 0) {
            balances[msg.sender] = 0;
            payable(msg.sender).transfer(amount);
        }
    }

    function getBalance(address _player) external view returns (uint256) {
        return balances[_player];
    }
}