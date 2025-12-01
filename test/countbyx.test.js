const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CountByX", function () {
  let multiplesContract;

  beforeEach(async function () {
    const Multiples = await ethers.getContractFactory("Multiples");
    multiplesContract = await Multiples.deploy();
    await multiplesContract.waitForDeployment();
  });

  it("Should return the first 3 multiples of 5", async function () {
    const result = await multiplesContract.multiples(5, 3);
    // Verify length
    expect(result.length).to.equal(3);
    // Verify values: [5, 10, 15]
    expect(result[0]).to.equal(5n);
    expect(result[1]).to.equal(10n);
    expect(result[2]).to.equal(15n);
  });

  it("Should return the first 1 multiple of 2", async function () {
    const result = await multiplesContract.multiples(2, 1);
    expect(result.length).to.equal(1);
    expect(result[0]).to.equal(2n);
  });

  it("Should work with larger numbers", async function () {
    const result = await multiplesContract.multiples(100, 2);
    expect(result[0]).to.equal(100n);
    expect(result[1]).to.equal(200n);
  });
});
