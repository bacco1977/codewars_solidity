// SPDX-License-Identifier: BSD-2-Clause
pragma solidity ^0.8.0;

contract CountByX {
    /**
     * @dev Returns the first n multiples of x. 
     Example: multiples(5, 3) returns [5, 10, 15]. 
     Assume the function to be called internally by other contracts
     * @param x The number to multiply.
     * @param n The number of multiples to return.
     * @return An array of the first n multiples of x.
     */
  function countByX(uint x, uint n) public pure returns (uint[] memory) {
    uint[] memory result = new uint[](n);
    
    for (uint i = 0; i < n; i++) {
      result[i] = x * (i + 1);
    }
    
    return result;
  }
}

