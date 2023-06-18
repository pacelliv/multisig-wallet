// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title Factory
 * @author Eugenio Pacelli Flores Voitier
 * @notice This is a sample contract of a factory registry.
 */

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */

contract Factory {
    mapping(address => bool) private isInstantiation;
    mapping(address => address[]) private instantiations;

    event ContractInstantiation(address indexed creator, address indexed instantiation);

    /**
     * @dev Checks if `_instantiation` is a deployed `MultiSigWallet`.
     * @param _instantiation Address of a `MultiSigWallet` to query.
     * @return A boolean that indicates if `_instantiation` is a wallet.
     */
    function checkInstantiation(address _instantiation) public view returns (bool) {
        return isInstantiation[_instantiation];
    }

    /**
     * @dev Gets que list of created `MultiSigWallet` by `_creator`.
     * @param _creator Address of the account to query.
     * @return An array with the addresses of the instances created by `_creator`.
     */
    function getInstantiations(address _creator) public view returns (address[] memory) {
        return instantiations[_creator];
    }

    /**
     * @dev Get the amount of instances created by a creator.
     * @param _creator Address of the account to query.
     * @return The amount of instances.
     */
    function getInstantiationCount(address _creator) public view returns (uint256) {
        return instantiations[_creator].length;
    }

    /**
     * @dev Registers a new instance in the factory registry.
     * @param _instantiation Address of the recently deployed `MultiSigWallet`.
     */
    function _register(address _instantiation) internal {
        isInstantiation[_instantiation] = true;
        instantiations[msg.sender].push(_instantiation);
        emit ContractInstantiation(msg.sender, _instantiation);
    }
}
