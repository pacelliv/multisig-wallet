// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title OwnerManager.
 * @author Eugenio Pacelli Flores Voitier.
 * @notice This is sample contract that handle MultiSigWallet owners and the required
 * number of approvals for transactions.
 * @dev This multisig wallet can: (a) make simple ETH transactions,
 * (b) make contract calls, (c) handle ETH balance, (d) handle ERC20 tokens
 * and (f) handle NFTs.
 */

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */
contract OwnerManager {
    address[] internal owners;
    mapping(address => bool) internal isOwner;
    uint256 private immutable required;

    event NewOwner(address indexed owner);
    event OwnerRemoved(address indexed owner);

    error MultiSigWallet__AlreadyOwner(address owner);
    error MultiSigWallet__OnlyWallet();
    error MultiSigWallet__MaximumNumberOfOwnersReached();
    error MultiSigWallet__MinimumNumberOfOwnersReached();
    error MultiSigWallet__InvalidIndex(uint256 index);
    error MultiSigWallet__OwnersRequired();
    error MultiSigWallet__InvalidNumberOfConfirmations();
    error MultiSigWallet__InvalidOwner(address owner);
    error MultiSigWallet__DuplicateOwner(address duplicate);

    /**
     * @dev Checks if `msg.sender` is the address of the contract, throws otherwise.
     */
    modifier onlyWallet() {
        if (msg.sender != address(this)) revert MultiSigWallet__OnlyWallet();
        _;
    }

    /**
     * @dev Sets the values for {owners} and {required}. Throws if `_owners` is empty.
     * Throws if `_required` is equal to zero or greater than the lenght of `_owners`.
     * Throws if any of the `_owners` is the address zero. Throws if there is a duplicate
     * among `_owners`.
     */
    constructor(address[] memory _owners, uint256 _required) {
        if (_owners.length == 0) revert MultiSigWallet__OwnersRequired();
        if (_required <= 0 || _required > _owners.length)
            revert MultiSigWallet__InvalidNumberOfConfirmations();

        for (uint256 i; i < _owners.length; i++) {
            address owner = _owners[i];
            if (owner == address(0)) revert MultiSigWallet__InvalidOwner(owner);
            if (isOwner[owner]) revert MultiSigWallet__DuplicateOwner(owner);
            isOwner[owner] = true;
            owners.push(owner);
        }

        required = _required;
    }

    /**
     * @dev Grants ownership of the wallet to an account. Throws if `_owner`
     * is already in `owners`. Throws if `owners` is at its maximum.
     * @param _owner Address of the account to be granted ownership of the wallet.
     */
    function addOwner(address _owner) external onlyWallet {
        if (isOwner[_owner]) revert MultiSigWallet__AlreadyOwner(_owner);
        if (owners.length == 7) revert MultiSigWallet__MaximumNumberOfOwnersReached();
        owners.push(_owner);
        emit NewOwner(_owner);
    }

    /**
     * @dev Removes ownership powers from an account. Throws if `index` is
     * greater than the length of `owners`. Throws if `owners` is at its minimum.
     * @param _index Identifier of the account.
     */
    function removeOwner(uint256 _index) external onlyWallet {
        if (owners.length == 3) revert MultiSigWallet__MinimumNumberOfOwnersReached();
        if (_index >= owners.length) revert MultiSigWallet__InvalidIndex(_index);
        address owner = owners[_index];
        owners[_index] = owners[owners.length - 1];
        owners.pop();
        emit OwnerRemoved(owner);
    }

    /**
     * @dev Verifies the ownership of an account.
     * @param owner Address to query.
     * Return a boolean.
     */
    function verifyOwnership(address owner) external view returns (bool) {
        return isOwner[owner];
    } 

    /**
     * @dev Reads the list of owners.
     */
    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    /**
     * @dev Reads the number of signatures required to execute a transaction
     */
    function getRequired() public view returns (uint256) {
        return required;
    }
}