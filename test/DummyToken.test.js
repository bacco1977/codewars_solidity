const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DummyToken", function () {
  let dummyToken;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    const DummyToken = await ethers.getContractFactory("DummyToken");
    dummyToken = await DummyToken.deploy();
    // In ethers v6, deployment is awaited directly on the contract factory call if using newer syntax,
    // but standard Hardhat usage often involves .deploy() then .deployed() (v5) or waitForDeployment() (v6).
    // We'll use a pattern compatible with modern Hardhat/Ethers v6.
    await dummyToken.waitForDeployment(); 
  });

  it("Should multiply two positive numbers correctly", async function () {
    // Solidy 'int' returns a BigInt or BigNumber in JS
    const result = await dummyToken.multiply(5, 10);
    expect(result).to.equal(50n); // Using BigInt literal for v6
  });

  it("Should multiply positive and negative numbers correctly", async function () {
    const result = await dummyToken.multiply(5, -10);
    expect(result).to.equal(-50n);
  });

  it("Should multiply by zero correctly", async function () {
    const result = await dummyToken.multiply(5, 0);
    expect(result).to.equal(0n);
  });
  
  it("Should handle larger numbers", async function () {
    const result = await dummyToken.multiply(1000, 2000);
    expect(result).to.equal(2000000n);
  });
});

