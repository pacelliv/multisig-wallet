// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {OwnerManager} from "./OwnerManager.sol";

/**
 * @title MultiSigWallet.
 * @author Eugenio Pacelli Flores Voitier.
 * @notice This is a sample contract to create a basic multisig wallet.
 * @dev This multisig wallet can: (a) make simple ETH transactions,
 * (b) make contract calls, (c) handle ETH balance, (d) handle ERC20 tokens
 * and (f) handle NFTs.
 */

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */
contract MultiSigWallet is ReentrancyGuard, OwnerManager {
    struct Transaction {
        address to;
        uint256 amount;
        bytes data;
        bool executed;
    }

    Transaction[] private transactions;
    mapping(uint256 => mapping(address => bool)) private isApproved;

    event Deposit(address indexed sender, uint256 amount);
    event NftDeposit(address indexed sender, address indexed nft, uint256 indexed tokenId);
    event Erc20Deposit(address indexed sender, address indexed token, uint256 amount);
    event Submit(
        address indexed owner,
        uint256 txId,
        address indexed to,
        uint256 amount,
        bytes data
    );
    event Approve(address indexed owner, uint256 txId);
    event Revoke(address indexed owner, uint256 txId);
    event Execute(address indexed owner, uint256 txId, address indexed to, bytes data);

    error MultiSigWallet__OnlyOwner();
    error MultiSigWallet__InvalidRecipient(address recipient);
    error MultiSigWallet__NonExistentTransaction();
    error MultiSigWallet__AlreadyApproved();
    error MultiSigWallet__AlreadyExecuted();
    error MultiSigWallet__NotApproved();
    error MultiSigWallet__TransactionFailed();
    error MultiSigWallet__InsufficientApprovals();
    error MultiSigWallet__InsufficientAllowance(uint256 allowance, uint256 amount);
    error MultiSigWallet__NftNotApproved();

    /**
     * @dev Checks if `msg.sender` is a current owner of the wallet.
     * Throws if the caller isn't an owner.
     */
    modifier onlyOwner() {
        if (!isOwner[msg.sender]) revert MultiSigWallet__OnlyOwner();
        _;
    }

    /**
     * @dev Checks if the transaction `_txId` exists.
     * Throws if `_txId` is greater than the lenght of the `transactions` array.
     * @param _txId Unique identifier of the transaction.
     */
    modifier txExists(uint256 _txId) {
        if (_txId > transactions.length) revert MultiSigWallet__NonExistentTransaction();
        _;
    }

    /**
     * @dev Checks if transaction `_txId` is already approved by
     * `msg.sender`. Throws if the transaction is already approved
     * by the owner.
     * @param _txId Unique identifier of the transaction.
     */
    modifier notApproved(uint256 _txId) {
        if (isApproved[_txId][msg.sender]) revert MultiSigWallet__AlreadyApproved();
        _;
    }

    /**
     * @dev Checks if the transaction `_txId` is already executed.
     * To prevent double spending throws if the transaction is already executed.
     * @param _txId Unique identifier of the transaction.
     */
    modifier notExecuted(uint256 _txId) {
        if (transactions[_txId].executed) revert MultiSigWallet__AlreadyExecuted();
        _;
    }

    constructor(address[] memory _owners, uint256 _required) OwnerManager(_owners, _required) {}

    fallback() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Moves NFT `_tokenId` from `msg.sender` into the wallet.
     * Throws if the wallet is not approved as a spender for the token.
     * @param _nft Address of the NFT to be deposited.
     * @param _tokenId Unique identifier of the token.
     */
    function depositNft(address _nft, uint256 _tokenId) external {
        IERC721 nft = IERC721(_nft);
        if (nft.getApproved(_tokenId) != address(this)) revert MultiSigWallet__NftNotApproved();
        nft.safeTransferFrom(msg.sender, address(this), _tokenId);
        emit NftDeposit(msg.sender, _nft, _tokenId);
    }

    /**
     * @dev Moves `_amount` of tokens from `msg.sender` into the wallet.
     * Throws if `_amount` is greater than the allowance of the wallet.
     * @param _token Address of the ERC20 token.
     * @param _amount Amount of tokens to deposit.
     */
    function depositErc20(address _token, uint256 _amount) external {
        IERC20 token = IERC20(_token);
        uint256 allowance = token.allowance(msg.sender, address(this));
        if (allowance < _amount) revert MultiSigWallet__InsufficientAllowance(allowance, _amount);
        token.transferFrom(msg.sender, address(this), _amount);
        emit Erc20Deposit(msg.sender, _token, _amount);
    }

    /**
     * @dev Creates a new `Transaction`. Throws if `_to` is the address zero.
     * @param _to Recipient of the transaction. Can be an EOA or a contract.
     * @param _amount Amount of ether to send with the transaction.
     * @param _data Encoded calldata. Required if the transaction is a contract call,
     * otherwise leave empty.
     */
    function submit(address _to, uint256 _amount, bytes calldata _data) external onlyOwner {
        if (_to == address(0)) revert MultiSigWallet__InvalidRecipient(_to);
        transactions.push(Transaction({to: _to, amount: _amount, data: _data, executed: false}));
        emit Submit(msg.sender, transactions.length - 1, _to, _amount, _data);
    }

    /**
     * @dev Gives approval to the transaction `_txId`.
     * @param _txId Unique identifier of the transaction.
     */
    function approve(
        uint256 _txId
    ) external onlyOwner txExists(_txId) notApproved(_txId) notExecuted(_txId) {
        isApproved[_txId][msg.sender] = true;
        emit Approve(msg.sender, _txId);
    }

    /**
     * @dev Revokes approval from transaction `_txId`.
     * Throws if the transaction has not been previously approved by `msg.sender`.
     * @param _txId Unique identifier of the transaction.
     */
    function revoke(uint256 _txId) external onlyOwner txExists(_txId) notExecuted(_txId) {
        if (!isApproved[_txId][msg.sender]) revert MultiSigWallet__NotApproved();
        isApproved[_txId][msg.sender] = false;
        emit Revoke(msg.sender, _txId);
    }

    /**
     * @dev Executes transaction `_txId`. Throws if the number of
     * approvals is not equal to `_required`.
     * @param _txId Unique identifier of the transaction.
     */
    function execute(
        uint256 _txId
    ) external onlyOwner txExists(_txId) notExecuted(_txId) nonReentrant {
        if (getApprovalCount(_txId) < getRequired()) revert MultiSigWallet__InsufficientApprovals();
        Transaction storage transaction = transactions[_txId];
        transaction.executed = true;

        (bool success, bytes memory data) = payable(transaction.to).call{value: transaction.amount}(
            transaction.data
        );

        if (!success) {
            if (data.length == 0) revert MultiSigWallet__TransactionFailed();
            assembly {
                revert(add(data, 32), mload(data))
            }
        }

        emit Execute(msg.sender, _txId, transaction.to, transaction.data);
    }

    /**
     * @dev Reads the list of submitted transactions.
     */
    function getTransactions() external view returns (Transaction[] memory) {
        return transactions;
    }

    /**
     * @dev Reads the balance of ether in the wallet.
     */
    function balance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Check if transaciton `_txId` have been approved by `_owner`.
     * @param _txId Unique identifier of a transaction.
     * @param _owner Address of the owner
     * Returns a boolean to indicate if the transaction was approved or not by `_owner`.
     */
    function checkApproval(uint256 _txId, address _owner) external view returns (bool) {
        return isApproved[_txId][_owner];
    }

    /**
     * @dev Reads the balance of `_token` in the wallet.
     * @param _token Address of the ERC20 token to query.
     */
    function tokenBalance(address _token) external view returns (uint256) {
        IERC20 token = IERC20(_token);
        return token.balanceOf(address(this));
    }

    /**
     * @dev Reads the token URI of a NFT. Throws if the owner of
     * `_tokenId` is the address zero.
     * @param _nft Address of the NFT contract to query.
     * @param _tokenId Unique idenfitifer of the token.
     */
    function getTokenURI(address _nft, uint256 _tokenId) external view returns (string memory) {
        IERC721Metadata nft = IERC721Metadata(_nft);
        return nft.tokenURI(_tokenId);
    }

    /**
     * @dev Before a NFT is transferred this function is called by the
     * NFT contract to verify the wallet is a valid recipient.
     * param operator Address of the account granted permission over the NFT. (unused)
     * param from Owner of the NFT. (unused)
     * param tokenId Unique identifier of the NFT. (unused)
     * param data Encoded data of the transaction. (unused)
     * Return `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`.
     */
    function onERC721Received(
        address /* operator */,
        address /* from */,
        uint256 /* tokenId*/,
        bytes calldata /* data */
    ) external pure returns (bytes4) {
        return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
    }

    /**
     * @dev Reads the number of approvals for transaction `_txId`.
     */
    function getApprovalCount(uint256 _txId) public view returns (uint256 count) {
        for (uint256 i; i < owners.length; i++) {
            if (isApproved[_txId][owners[i]]) {
                count += 1;
            }
        }
    }
}
