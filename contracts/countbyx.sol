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
     
  function countBy(int x, int n) public pure returns (int[] memory) {
    int[] memory z = new int[](uint(n));
    for (int i = 0; i < n; i++) {
      z[uint(i)] = x * (i + 1);
    }     
    return z;
  }
}
