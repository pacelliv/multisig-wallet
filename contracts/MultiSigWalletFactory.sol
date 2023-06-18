// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Factory} from "./Factory.sol";
import {MultiSigWallet} from "./MultiSigWallet.sol";

/**
 * @title MultiSigWalletFactory
 * @author Eugenio Pacelli Flores Voitier
 * @notice This is a sample factory contract to deploy
 * multiple instances of `MultiSigWallet`.
 */

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */

contract MultiSigWalletFactory is Factory {
    /**
     * @dev Deploys a new `MultiSigWallet`.
     * @param _owners Array with the list of owners for the new instance.
     * @param _required Number of minimum approvals required to execute transactions.
     * @return The address of the new instance.
     */
    function createWallet(address[] memory _owners, uint256 _required) external returns (address) {
        MultiSigWallet multiSigWallet = new MultiSigWallet(_owners, _required);
        _register(address(multiSigWallet));
        return address(multiSigWallet);
    }
}
