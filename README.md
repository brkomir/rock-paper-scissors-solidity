# Rock-Paper-Scissors 

This is a ***Solidity*** project created with ***Truffle*** that addresses the coding challenge from [this doc](https://docs.google.com/document/d/1z3CSi9vHsKo3Ap9qdeJYasANyTYz00RFD9Yw2Go4HHU/edit).
It implements a simple rock-paper-scissors game.

### Requirements
You will need to have **truffle** and **node.js (v16.14.2)** installed:
```
npm -i g truffle
```

### Running Tests
To run the javascript tests for this contract it is preferred that you use **ganache** as the target, which is installed along with truffle by the previous command.
To start **ganache** in the terminal run:
```
ganache
```
To run all of the tests in the project, in the second terminal run:
```
truffle test
```

### Gameplay Walkthrough

The game is played in a reasonably simple and straightforward way.

The first player is starting a new game by calling the `startNewGame` function on the contract and providing the fee for entering a game (stake). 
This function takes the player's choice (rock, paper, or scissors) as an argument and expects this argument is sha256 encoded, 
meaning the user's choice is not publicly visible (***secret choice***). This creates a new game on the contract with a unique Id.

The second player who wishes to join a game can call a function `getActiveGameIds` to see all currently open games. 
If the game has a free slot for second a player, he can then call the `play` function with a game Id and his choice of rock, paper,
 or scissors and pay his entry fee (stake) as well.

After the second player makes his move, the first player is required to call the `resolve` function and provide his ***secret*** value as an argument
 to reveal his initial choice. Then the game outcome is decided. The player who wins gets all of the pot from that game. If a game ends in a draw, 
 half of the game pot will be used to additionally fund the next new game, and the second half will be evenly allocated to both players.

Rewards from resolved games are kept on the contract until the player decides to withdraw. 
To collect their rewards, players can call the `withdraw` function and claim their ETH.

### Time Considerations

The game can't remain open for an undefined amount of time. 
In a case when the second player for a game was not found within 48 hours since the game was started, the came is considered to be **expired**. 
In that case, the player who created the game can call `resolve` to unlock their stake from the game. 

If however the second player is present and the 48 hours have passed, the first player has to reveal his ***secret*** by calling the `resolve` method 
within 24 hours from that point, otherwise, he will lose his stake in favor of the second player. This is done in order to force the first player to reveal
 his ***secret choice***, even if he can see from the second player's committed choice, which is not hidden or secret, that he lost the game. 
 The second player can then call the `resolveExpiredGame` function to resolve the game in his favor.

### Game Events

There are four types of events that can be emitted from this contract. Each of them can provide better playability of the game by allowing the users
 to be notified as soon as something changes on the contract side. Here is the list of events:
`NewGame(gameId, createdBy)` - emitted when a new game is created
`SecondPlayerFound(gameId)` - emitted emit when a second player enters a game
`GameExpired(gameId)` - emitted when a game is marked as expired
`GameEnded(gameId)` - emitted when players have confronted their choices and game ends regularly

### Secret Choice Encoding/Decoding

In order to avoid making errors while encoding the choice before sending it to the `startNewGame` function, the first player can call the utility 
function `decodeSecretChoice` to check will the contract decodes his secret value as a valid choice (rock, paper, or scissors) or not. 
The contract will use `keccak256(abi.encodePacked(choice, secret))' to figure out what was the value of the first player's choice.