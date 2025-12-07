// SPDX-License-Identifier: BSD-2-Clause
pragma solidity ^0.8.0;

contract RockPaperScissors {
    address public owner;
    uint public gamesCount = 0;
    mapping(uint => Game) public games;
    // INSERT_YOUR_CODE
    uint8 public constant ROCK = 1;
    uint8 public constant PAPER = 2;
    uint8 public constant SCISSORS = 3;

    struct Game {
        address payable creator;
        address payable participant;
        uint bet;
        bool hasStarted;
        address winner;
        mapping(address => uint) moves;
    }

    event GameCreated(address creator, uint gameNumber, uint bet);
    event GameStarted(address[] players, uint gameNumber);
    event GameComplete(address winner, uint gameNumber);
    event GameMove(address player, uint gameNumber, uint moveNumber);

    constructor() {
        owner = msg.sender;
    }

    /*
     * Use this endpoint to create a game.
     * It is a payable endpoint meaning the creator of the game will send ether directly to it.
     * The ether sent to the contract should be used as the bet for the game.
     * @param {address} participant - The address of the participant allowed to join the game.
     */
    function createGame(address payable participant) public payable {
        //check if the bet amount is greater than zero in wei
        require(msg.value > 0, "Bet amount must be greater than zero");
        require(participant != address(0), "Participant must be invited");

        // Generate the game number (using a simple increment pattern)
        uint gameNumber = gamesCount;
        gamesCount += 1;

        // Store game information
        Game storage newGame = games[gameNumber];
        newGame.creator = payable(msg.sender);
        newGame.participant = participant;
        newGame.bet = msg.value;
        newGame.hasStarted = false;
        newGame.winner = address(0);

        emit GameCreated(msg.sender, gameNumber, msg.value);
    }

    /*
     * Use this endpoint to join a game.
     * It is a payable endpoint meaning the joining participant will send ether directly to it.
     * The ether sent to the contract should be used as the bet for the game.
     * Any additional ether that exceeds the original bet of the creator should be refunded.
     * @param {uint} gameNumber - Corresponds to the gameNumber provided by the GameCreated event
     */
    function joinGame(uint gameNumber) public payable {
        Game storage game = games[gameNumber];
        require(game.hasStarted == false, "Game has already started");

        // In this specific version, we mandate that participant was already set in createGame
        // because createGame now requires participant != address(0).
        require(
            game.participant == msg.sender,
            "You are not the invited participant"
        );

        // Now perform the bet check...
        require(
            msg.value >= game.bet,
            "Bet amount must be greater than the original bet"
        );
        uint extra = msg.value - game.bet;
        if (extra > 0) {
            (bool sent, ) = payable(msg.sender).call{value: extra}("");
            require(sent, "Refund failed");
        }

        game.participant = payable(msg.sender);
        game.hasStarted = true;
        address[] memory players = new address[](2);
        players[0] = game.creator;
        players[1] = game.participant;
        emit GameStarted(players, gameNumber);
    }

    /*
     * Use this endpoint to make a move during a game
     * @param {uint} gameNumber - Corresponds to the gameNumber provided by the GameCreated event
     * @param {uint} moveNumber - The move for this player (1, 2, or 3 for rock, paper, scissors respectively)
     */
    function makeMove(uint gameNumber, uint moveNumber) public {
        Game storage game = games[gameNumber];
        require(game.hasStarted == true, "Game has not started");
        require(
            game.participant == msg.sender || game.creator == msg.sender,
            "You are not a player in this game"
        );
        require(moveNumber >= 1 && moveNumber <= 3, "Invalid move number");
        //check if the player has already made a move
        require(game.moves[msg.sender] == 0, "You have already made a move");
        // Call the winner determination logic
        // 1. Record the move FIRST
        game.moves[msg.sender] = moveNumber;
        emit GameMove(msg.sender, gameNumber, moveNumber);

        // 2. Check if other player has moved
        address otherPlayer = (msg.sender == game.creator)
            ? game.participant
            : game.creator;
        if (game.moves[otherPlayer] == 0) {
            return; // Wait for other player
        }

        // 3. Determine winner and payout
        _payout(game, gameNumber);
    }

    function _determineWinner(
        address creator,
        address participant,
        mapping(address => uint) storage moves
    ) internal view returns (address) {
        uint move1 = moves[creator];
        uint move2 = moves[participant];

        if (move1 == move2) {
            return address(0);
        } else if (
            (move1 == ROCK && move2 == SCISSORS) ||
            (move1 == PAPER && move2 == ROCK) ||
            (move1 == SCISSORS && move2 == PAPER)
        ) {
            return creator;
        } else {
            return participant;
        }
    }
    

    function _payout(Game storage game, uint gameNumber) internal {
        uint move1 = game.moves[game.creator];
        uint move2 = game.moves[game.participant];
        game.winner = _determineWinner(
            game.creator,
            game.participant,
            game.moves
        );

        if (move1 != move2) {
            // Not a draw -- winner gets both bets
            emit GameComplete(game.winner, gameNumber);
            uint payout = game.bet * 2;
            (bool success, ) = payable(game.winner).call{value: payout}("");
            require(success, "Payout failed");
        } else {
            // Draw -- refund both original bets
            emit GameComplete(address(0), gameNumber);
            (bool sent1, ) = payable(game.creator).call{value: game.bet}("");
            (bool sent2, ) = payable(game.participant).call{value: game.bet}("");
            require(sent1 && sent2, "Refund failed");
        }
    }

    /**
     * @dev Withdraws all ether from the contract to the owner's address.
     * Can only be called by the owner.
     */
    function withdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");
        (bool sent, ) = payable(owner).call{value: address(this).balance}("");
        require(sent, "Withdraw failed");
    }
}
