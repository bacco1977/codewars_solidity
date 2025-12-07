const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RockPaperScissors", function () {
  let rps;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    const RPS = await ethers.getContractFactory("RockPaperScissors");
    [owner, addr1, addr2] = await ethers.getSigners();
    rps = await RPS.deploy();
    await rps.waitForDeployment();
  });

  it("Should revert if join bet is too low", async function () {
    // 1. Create game with 1 ETH bet, inviting addr2 specifically
    const betAmount = ethers.parseEther("1.0");
    await rps.connect(addr1).createGame(addr2.address, { value: betAmount });

    // 2. Try to join with LESS ether (0.5 ETH)
    const lowBet = ethers.parseEther("0.5");
    
    // This MUST revert
    await expect(
      rps.connect(addr2).joinGame(0, { value: lowBet })
    ).to.be.revertedWith("Bet amount must be greater than the original bet");
  });

    it("should detect a winner", async function() {
      // Arrange: addr1 creates a game inviting addr2 to play with a bet of 1000 wei
      const betAmount = 1000n;
      await rps.connect(addr1).createGame(addr2.address, { value: betAmount });

      // Act: addr2 joins the game with the same bet
      await rps.connect(addr2).joinGame(0, { value: betAmount });

      // addr1 (creator) makes move: rock (1)
      await rps.connect(addr1).makeMove(0, 1);

      // addr2 (participant) makes move: paper (2)
      const tx = await rps.connect(addr2).makeMove(0, 2);

      // Find GameComplete event and check winner
      const receipt = await tx.wait();
      const gameCompleteEvent = receipt.logs
        .map(log => {
          try {
            return rps.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(e => e && e.name === "GameComplete");

      expect(gameCompleteEvent).to.not.be.undefined;
      expect(gameCompleteEvent.args.winner).to.equal(addr2.address, `Expected the winner to be ${addr2.address} (paper covers rock)`);
    });

// INSERT_YOUR_CODE
  it("should have correct balances for a winner", async function() {
    // Arrange: set a bet amount and start balances
    const betAmount = 1000n;
    // Use addr1 as creator and addr2 as participant
    const creator = addr1;
    const participant = addr2;

    // Get start balances (before game)
    const creatorStart = await ethers.provider.getBalance(creator.address);
    const participantStart = await ethers.provider.getBalance(participant.address);

    // 1. Creator creates a game inviting participant
    const createTx = await rps.connect(creator).createGame(participant.address, { value: betAmount });
    // 2. Participant joins game sending the exact same bet
    const joinTx = await rps.connect(participant).joinGame(0, { value: betAmount });

    // 3. Both make their move, with participant as winner (rock vs paper)
    const move1 = await rps.connect(creator).makeMove(0, 1); // creator: rock
    const move2Tx = await rps.connect(participant).makeMove(0, 2); // participant: paper wins

    // 4. Wait for all transactions to mine (esp join for refund effects)
    await createTx.wait();
    await joinTx.wait();
    await move1.wait();
    const move2Rcpt = await move2Tx.wait();

    // 5. Get balances after the game settled
    // There are gas costs so we check the delta, not absolute equality
    const creatorEnd = await ethers.provider.getBalance(creator.address);
    const participantEnd = await ethers.provider.getBalance(participant.address);

    // Calculate expected deltas.
    // Creator lost their 1000 wei (did not win), minus gas costs.
    // Participant receives both bets (2000 wei), minus their original spend, plus their win, minus gas.
    // So participantEnd should be roughly (participantStart - betAmount [join] - gasJoin - gasMoves + 2000n [prize])
    // Instead, simplest is: participantEnd - participantStart ≈ betAmount (maybe a bit less, due to gas)
    // Similarly, creatorEnd - creatorStart ≈ -betAmount (plus gas costs)

    // For tight tests, we check the *difference* matches exactly the total pot minus gas costs.
    // Allow up to 0.01 ETH for gas costs (since gas can be high on local devnets)
    const gasBuffer = ethers.parseEther("0.01"); 
    
    // Participant spent ~1000 (join fee) + gas (join tx) + gas (move tx).
    // Participant won 2000.
    // Net change should be +1000 - gas.
    const participantDiff = participantEnd - participantStart;
    
    // We expect positive gain of roughly 1000n, but minus gas.
    // So 1000n - gasCost ≈ participantDiff
    // Meaning participantDiff should be "close to" 1000n, but strictly LESS than 1000n due to gas.
    // Since closeTo is symmetric, we use a wide buffer.
    expect(participantDiff).to.be.closeTo(1000n, gasBuffer);

    const creatorDiff = creatorEnd - creatorStart;
    // Creator spent 1000 (create fee) + gas (create tx) + gas (move tx).
    // Creator won 0.
    // Net change should be -1000 - gas.
    expect(creatorDiff).to.be.closeTo(-1000n, gasBuffer);

    // Check the on-chain winner address for completeness
    // (parsing event is already done in the previous test, but here for completeness)
    const game = await rps.games(0);
    expect(game.winner).to.equal(participant.address);
  });

// INSERT_YOUR_CODE
  it("should have correct balances for a tie", async function () {
    // Deploy fresh contract per test (handled in beforeEach)
    // We'll reuse creator, participant, and betAmount
    const betAmount = 1000n;
    const creator = addr1;
    const participant = addr2;

    // Step 1: Each player's starting balance
    const creatorStart = await ethers.provider.getBalance(creator.address);
    const participantStart = await ethers.provider.getBalance(participant.address);

    // Step 2: Create, join, then both submit the same move ("rock" = 1)
    const createTx = await rps.connect(creator).createGame(participant.address, { value: betAmount });
    const joinTx = await rps.connect(participant).joinGame(0, { value: betAmount });

    // Wait for game to be set up
    await createTx.wait();
    await joinTx.wait();

    const move1 = await rps.connect(creator).makeMove(0, 1);      // creator: rock
    const move2Tx = await rps.connect(participant).makeMove(0, 1); // participant: rock (tie)

    await move1.wait();
    await move2Tx.wait();

    // Post-game balances
    const creatorEnd = await ethers.provider.getBalance(creator.address);
    const participantEnd = await ethers.provider.getBalance(participant.address);

    // In a tie, both should receive their original bet back (minus gas costs)
    // So (end - start) should be negative, but only by the gas spent on transactions

    // How much gas buffer? 0.01 ETH should be plenty
    const gasBuffer = ethers.parseEther("0.01");

    const creatorDiff = creatorEnd - creatorStart;
    const participantDiff = participantEnd - participantStart;

    // Since bets are returned, expect both to have 0 net change (minus gas costs)
    expect(creatorDiff).to.be.closeTo(0n, gasBuffer);
    expect(participantDiff).to.be.closeTo(0n, gasBuffer);

        // Verify winner address (should be zero for tie)
    const game = await rps.games(0);
    // Since it's a tie, winner should be address(0).
    expect(game.winner).to.equal(ethers.ZeroAddress);
  });
});
