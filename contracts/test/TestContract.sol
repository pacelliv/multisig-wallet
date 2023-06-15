// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract TestContract {
    uint256 private n;

    function add(uint256 m) external {
        n += m;
    }

    function getCalldata(uint256 m) external pure returns (bytes memory data) {
        data = abi.encodeWithSignature("add(uint256)", m);
    }

    function getNumber() external view returns (uint256) {
        return n;
    }
}
