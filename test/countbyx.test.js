const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CountByX contract", function () {
  let CountByX, countByX;

  before(async function () {
    CountByX = await ethers.getContractFactory("CountByX");
    countByX = await CountByX.deploy();
    await countByX.waitForDeployment();
  });

  it("Should return the first 3 multiples of 5", async function () {
    const result = await countByX.countBy(5, 3);
    expect(result.length).to.equal(3);
    expect(result[0]).to.equal(5);
    expect(result[1]).to.equal(10);
    expect(result[2]).to.equal(15);
  });

  it("Should return an empty array when n is 0", async function () {
    const result = await countByX.countBy(5, 0);
    expect(result.length).to.equal(0);
  });

  it("Should handle negative x values correctly", async function () {
    const result = await countByX.countBy(-4, 3);
    expect(result.length).to.equal(3);
    expect(result[0]).to.equal(-4);
    expect(result[1]).to.equal(-8);
    expect(result[2]).to.equal(-12);
  });

  it("Should return [0] when x is 0 and n is 1", async function () {
    const result = await countByX.countBy(0, 1);
    expect(result.length).to.equal(1);
    expect(result[0]).to.equal(0);
  });

  it("Should handle negative n as 0 (returns empty array)", async function () {
    // In Solidity, array of negative length will revert, so this should revert
    await expect(countByX.countBy(5, -2)).to.be.reverted;
  });

  it("Should handle large numbers", async function () {
    const largeX = 1000000000000n;
    const largeN = 2;
    const result = await countByX.countBy(largeX, largeN);
    expect(result.length).to.equal(2);
    expect(result[0]).to.equal(largeX);
    expect(result[1]).to.equal(largeX * 2n);
  });
});
