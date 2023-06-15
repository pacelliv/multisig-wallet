const { developmentChains } = require("../../helper-hardhat-config")
const { ethers, deployments, network } = require("hardhat")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("MultiSigWallet Unit Tests", () => {
          let testContract, multiSigWallet, token
          beforeEach(async () => {
              await deployments.fixture(["all"])
              testContract = await ethers.getContract("TestContract")
              multiSigWallet = await ethers.getContract("MultiSigWallet")
              token = await ethers.getContract("Token")
              basicNft = await ethers.getContract("BasicNft")
          })

          describe("constructor", () => {
              it("set the owners correctly", async () => {
                  const accounts = await ethers.getSigners()
                  const owners = await multiSigWallet.getOwners()
                  owners.forEach(async (owner, i) => {
                      assert(accounts[i] === owner)
                  })
              })
              it("set required number of approvals correctly", async () => {
                  const required = await multiSigWallet.required()
                  assert.equal(required.toString(), "2")
              })
              it("should revert if the number of approvals is greater than the length of the owners array", async () => {
                  const multiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet")
                  const [owner0, owner1, owner2] = await ethers.getSigners()
                  const owners = [owner0.address, owner1.address, owner2.address]
                  await expect(
                      multiSigWalletFactory.deploy(owners, 4)
                  ).to.be.revertedWithCustomError(
                      multiSigWallet,
                      "MultiSigWallet__InvalidNumberOfConfirmations"
                  )
              })
              it("should revert if the number of approvals is equal to zero", async () => {
                  const multiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet")
                  const [owner0, owner1, owner2] = await ethers.getSigners()
                  const owners = [owner0.address, owner1.address, owner2.address]
                  await expect(
                      multiSigWalletFactory.deploy(owners, 0)
                  ).to.be.revertedWithCustomError(
                      multiSigWallet,
                      "MultiSigWallet__InvalidNumberOfConfirmations"
                  )
              })
              it("should revert if there is a duplicate owner", async () => {
                  const multiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet")
                  const [owner0, owner1] = await ethers.getSigners()
                  const owners = [owner0.address, owner1.address, owner1.address]
                  await expect(multiSigWalletFactory.deploy(owners, 2))
                      .to.be.revertedWithCustomError(
                          multiSigWallet,
                          "MultiSigWallet__DuplicateOwner"
                      )
                      .withArgs(owner1.address)
              })
              it("should revert if the address zero is among the owners", async () => {
                  const multiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet")
                  const [owner0, owner1] = await ethers.getSigners()
                  const addressZero = ethers.constants.AddressZero
                  const owners = [owner0.address, owner1.address, addressZero]
                  await expect(multiSigWalletFactory.deploy(owners, 2))
                      .to.be.revertedWithCustomError(multiSigWallet, "MultiSigWallet__InvalidOwner")
                      .withArgs(addressZero)
              })
              it("should revert if the array of owners is empty", async () => {
                  const multiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet")
                  await expect(multiSigWalletFactory.deploy([], 2)).to.be.revertedWithCustomError(
                      multiSigWallet,
                      "MultiSigWallet__OwnersRequired"
                  )
              })
          })

          describe("receive", () => {
              it("should emit an event on receiving ETH", async () => {
                  const [signer] = await ethers.getSigners()
                  const value = ethers.utils.parseEther("1")
                  await expect(
                      signer.sendTransaction({
                          to: multiSigWallet.address,
                          value,
                          gasLimit: 30000,
                      })
                  )
                      .to.emit(multiSigWallet, "Deposit")
                      .withArgs(signer.address, ethers.utils.parseEther("1"))

                  const walletBalance = await multiSigWallet.balance()
                  assert.equal(walletBalance.toString(), value.toString())
              })
          })

          describe("depositNft", () => {
              beforeEach(async () => {
                  const mintNftTxResponse = await basicNft.mintNft("0")
                  await mintNftTxResponse.wait(1)
              })
              it("reverts if the wallet is not approved as spender for the nft", async () => {
                  // assert the transaction reverts
                  await expect(
                      multiSigWallet.depositNft(basicNft.address, "0")
                  ).to.be.revertedWithCustomError(multiSigWallet, "MultiSigWallet__NftNotApproved")

                  // assert the owner remains the same
                  const nftOwner = await basicNft.ownerOf("0")
                  const [deployer] = await ethers.getSigners()
                  assert.equal(nftOwner, deployer.address)
              })
              it("allow the deposit of nft after receiving approval", async () => {
                  const initialNftOwner = await basicNft.ownerOf("0")
                  const [deployer] = await ethers.getSigners()

                  // assert nft owner before deposit
                  assert.equal(initialNftOwner, deployer.address)

                  // approve wallet as spender
                  const approveTxResponse = await basicNft.approve(multiSigWallet.address, "0")
                  await approveTxResponse.wait(1)

                  // deposit nft
                  await expect(multiSigWallet.depositNft(basicNft.address, "0"))
                      .to.emit(multiSigWallet, "NftDeposit")
                      .withArgs(deployer.address, basicNft.address, "0")

                  // assert new nft owner
                  const endingNftOwner = await basicNft.ownerOf("0")
                  assert.equal(endingNftOwner, multiSigWallet.address)
              })
          })

          describe("depositErc20", () => {
              it("receives erc20 tokens", async () => {
                  const allowance = ethers.utils.parseEther("10")
                  const approvalTxResponse = await token.approve(multiSigWallet.address, allowance)
                  await approvalTxResponse.wait(1)
                  const depositErc20TxResponse = await multiSigWallet.depositErc20(
                      token.address,
                      allowance
                  )
                  await depositErc20TxResponse.wait(1)
                  const walletTokenBalance = await multiSigWallet.tokenBalance(token.address)
                  assert.equal(walletTokenBalance.toString(), allowance.toString())
              })
          })

          describe("submit", () => {
              let accounts, owner1, to, value, data, attacker
              beforeEach(async () => {
                  accounts = await ethers.getSigners()
                  owner1 = accounts[1]
                  to = accounts[3].address
                  value = ethers.utils.parseEther("1")
                  data = ethers.utils.toUtf8Bytes("") // an empty string in bytes is "0x"
                  attacker = accounts[10]
              })
              it("should emit an event on submitting a transaction", async () => {
                  const owner1Connected = multiSigWallet.connect(owner1)
                  await expect(owner1Connected.submit(to, value, data))
                      .to.emit(owner1Connected, "Submit")
                      .withArgs(owner1.address, "0", to, value, data)
              })
              it("should revert if not an owner tries to submit a transaction", async () => {
                  const attackerConnected = multiSigWallet.connect(attacker)
                  await expect(
                      attackerConnected.submit(to, value, data)
                  ).to.be.revertedWithCustomError(attackerConnected, "MultiSigWallet__OnlyOwner")
              })
              it("should store a transaction in the transactions array", async () => {
                  const owner1Connected = multiSigWallet.connect(owner1)
                  const transactionResponse = await owner1Connected.submit(to, value, data)
                  await transactionResponse.wait(1)
                  const transactions = await owner1Connected.getTransactions()
                  assert.equal(transactions.length, 1)
                  assert.equal(transactions[0].to, to)
                  assert.equal(transactions[0].amount.toString(), value)
                  assert.equal(transactions[0].data, "0x")
                  assert(!transactions[0].executed)
              })
              it("should revert if the recipient is the zero address", async () => {
                  const owner1Connected = multiSigWallet.connect(owner1)
                  const addressZero = ethers.constants.AddressZero
                  await expect(owner1Connected.submit(addressZero, value, data))
                      .to.be.revertedWithCustomError(
                          owner1Connected,
                          "MultiSigWallet__InvalidRecipient"
                      )
                      .withArgs(addressZero)
              })
          })

          describe("approve", () => {
              let accounts, owner1, to, value, data, attacker
              beforeEach(async () => {
                  accounts = await ethers.getSigners()
                  owner1 = accounts[1]
                  to = accounts[3].address
                  value = ethers.utils.parseEther("1")
                  data = ethers.utils.toUtf8Bytes("") // an empty string in bytes is "0x"
                  attacker = accounts[10]
                  const [owner0] = await ethers.getSigners()
                  const owner0Connected = multiSigWallet.connect(owner0)
                  const transactionResponse = await owner0Connected.submit(to, value, data)
                  await transactionResponse.wait(1)
              })
              it("allows an owner to approve a transaction and emit an event", async () => {
                  const owner1Connected = multiSigWallet.connect(owner1)
                  await expect(owner1Connected.approve(0))
                      .to.emit(owner1Connected, "Approve")
                      .withArgs(owner1.address, 0)

                  const isApproved = owner1Connected.isApproved(0, owner1.address)
                  assert(isApproved)
              })
              it("should revert re-approving a transaction", async () => {
                  const owner1Connected = multiSigWallet.connect(owner1)
                  const approvalTx = await owner1Connected.approve(0)
                  await approvalTx.wait(1)
                  await expect(owner1Connected.approve(0)).to.be.revertedWithCustomError(
                      owner1Connected,
                      "MultiSigWallet__AlreadyApproved"
                  )
              })
              it("should revert approving a non-existent transaction", async () => {
                  const owner1Connected = multiSigWallet.connect(owner1)
                  await expect(owner1Connected.approve(10)).to.be.revertedWithCustomError(
                      owner1Connected,
                      "MultiSigWallet__NonExistentTransaction"
                  )
              })
              it("should revert if not an owner tries to approve a transaction", async () => {
                  const attackerConnected = multiSigWallet.connect(attacker)
                  await expect(attackerConnected.approve(0)).to.be.revertedWithCustomError(
                      attackerConnected,
                      "MultiSigWallet__OnlyOwner"
                  )
              })
          })

          describe("revoke", () => {
              let accounts, owner1, to, value, data
              beforeEach(async () => {
                  accounts = await ethers.getSigners()
                  owner1 = accounts[1]
                  to = accounts[3].address
                  value = ethers.utils.parseEther("1")
                  data = ethers.utils.toUtf8Bytes("") // an empty string in bytes is "0x"
                  const [owner0] = await ethers.getSigners()
                  const owner0Connected = multiSigWallet.connect(owner0)
                  const submitTransactionResponse = await owner0Connected.submit(to, value, data)
                  await submitTransactionResponse.wait(1)
              })
              it("should revert if an owner tries to revoke a non approved transaction", async () => {
                  const owner1Connected = multiSigWallet.connect(owner1)
                  await expect(owner1Connected.revoke(0)).to.be.revertedWithCustomError(
                      owner1Connected,
                      "MultiSigWallet__NotApproved"
                  )
              })
              it("should revoke an approval and emit an event", async () => {
                  const owner1Connected = multiSigWallet.connect(owner1)
                  const approvalTransactionResponse = await owner1Connected.approve(0)
                  await approvalTransactionResponse.wait(1)
                  await expect(owner1Connected.revoke(0))
                      .to.emit(owner1Connected, "Revoke")
                      .withArgs(owner1.address, 0)

                  const isRevoked = owner1Connected.isApproved(0, owner1.address)
                  assert(isRevoked)
              })
          })

          describe("execute", () => {
              beforeEach(async () => {
                  // first fund the wallet to handle a transaction
                  const accounts = await ethers.getSigners()
                  const signer = accounts[5]
                  const transactionResponse = await signer.sendTransaction({
                      to: multiSigWallet.address,
                      value: ethers.utils.parseEther("2"),
                      gasLimit: 30000,
                  })
                  await transactionResponse.wait(1)
              })
              it("should execute a transaction with enough approvals and emit an event", async () => {
                  // check the initial balance of the wallet
                  const initialWalletBalance = await ethers.provider.getBalance(
                      multiSigWallet.address
                  )

                  // connect the owners
                  const [owner0, owner1, owner2, owner3] = await ethers.getSigners()
                  const owner0Connected = multiSigWallet.connect(owner0)
                  const owner1Connected = multiSigWallet.connect(owner1)
                  const owner2Connected = multiSigWallet.connect(owner2)

                  // create transaction payload
                  const to = owner3.address
                  const value = ethers.utils.parseEther("1")
                  const data = ethers.utils.toUtf8Bytes("") // an empty string in bytes is "0x"

                  // submit a transaction
                  const submitTransactionResponse = await owner0Connected.submit(to, value, data)
                  await submitTransactionResponse.wait(1)

                  // approve transaction
                  const approve0TransactionResponse = await owner0Connected.approve(0)
                  await approve0TransactionResponse.wait(1)

                  // assert we cannot execute without the required number of approvals
                  await expect(owner2Connected.execute(0)).to.be.revertedWithCustomError(
                      owner2Connected,
                      "MultiSigWallet__InsufficientApprovals"
                  )

                  // approve transaction
                  const approve1TransactionResponse = await owner1Connected.approve(0)
                  await approve1TransactionResponse.wait(1)

                  // execute transaction
                  await expect(owner2Connected.execute(0))
                      .to.emit(owner2Connected, "Execute")
                      .withArgs(owner2.address, 0, to, data)

                  const transaction0 = await owner0Connected.getTransactions()
                  assert(transaction0[0].executed) // assert transaction `executed` status was updated

                  // assert wallet ending balance
                  const endingWalletBalance = await ethers.provider.getBalance(
                      multiSigWallet.address
                  )
                  assert.equal(
                      endingWalletBalance.toString(),
                      initialWalletBalance.sub(value).toString()
                  )

                  // assert we cannot double spend
                  await expect(owner2Connected.execute(0)).to.be.revertedWithCustomError(
                      owner2Connected,
                      "MultiSigWallet__AlreadyExecuted"
                  )
              })
              it("should call another contract", async () => {
                  // connect the owners
                  const [owner0, owner1, owner2] = await ethers.getSigners()
                  const owner0Connected = multiSigWallet.connect(owner0)
                  const owner1Connected = multiSigWallet.connect(owner1)
                  const owner2Connected = multiSigWallet.connect(owner2)

                  // create transaction payload
                  const calldata = await testContract.getCalldata(777)
                  const to = testContract.address
                  const value = 0
                  const data = calldata

                  // submit a transaction
                  const submitTransactionResponse = await owner0Connected.submit(to, value, data)
                  await submitTransactionResponse.wait(1)

                  // approve transaction
                  const approve0TransactionResponse = await owner0Connected.approve(0)
                  await approve0TransactionResponse.wait(1)
                  const approve1TransactionResponse = await owner1Connected.approve(0)
                  await approve1TransactionResponse.wait(1)

                  // execute transaction
                  await expect(owner2Connected.execute(0))
                      .to.emit(owner2Connected, "Execute")
                      .withArgs(owner2.address, 0, to, data)

                  const transaction0 = await owner0Connected.getTransactions()
                  assert(transaction0[0].executed) // assert transaction `executed` status was updated

                  // assert state variable was updated in `TestContract`
                  const number = await testContract.getNumber()
                  assert.equal(number.toString(), "777")
              })

              it("transfers ERC20", async () => {
                  const accounts = await ethers.getSigners()
                  const AMOUNT = ethers.utils.parseEther("50")

                  // approve contract
                  const approveTokenTxResponse = await token.approve(multiSigWallet.address, AMOUNT)
                  await approveTokenTxResponse.wait(1)

                  // deposit tokens in contract
                  const transferTokenTxResponse = await multiSigWallet.depositErc20(
                      token.address,
                      AMOUNT
                  )
                  await transferTokenTxResponse.wait(1)

                  // assert balance of tokens in the contract
                  const tokenBalance = await multiSigWallet.tokenBalance(token.address)
                  assert.equal(tokenBalance.toString(), AMOUNT)

                  // encode calldata
                  const abi = ["function transfer(address recipient, uint256 amount)"]
                  const iface = new ethers.utils.Interface(abi)
                  const data = iface.encodeFunctionData("transfer", [
                      String(accounts[10].address),
                      AMOUNT,
                  ])

                  // submit transaction
                  const submitTransactionResponse = await multiSigWallet.submit(
                      token.address,
                      0,
                      data
                  )
                  await submitTransactionResponse.wait(1)

                  // approve transaction
                  for (let i = 1; i < 3; i++) {
                      const owners = await ethers.getSigners()
                      const ownerConnected = multiSigWallet.connect(owners[i])
                      const approvalTransactionResponse = await ownerConnected.approve("0")
                      await approvalTransactionResponse.wait(1)
                  }

                  // assert tx approval count
                  const approvalCount = await multiSigWallet.getApprovalCount("0")
                  assert(approvalCount.toString() === "2")

                  // execute transaction
                  const executeTransactionResponse = await multiSigWallet.execute("0")
                  await executeTransactionResponse.wait(1)

                  // assert the tokens were transferred to account
                  const accountBalance = await token.balanceOf(accounts[10].address)
                  assert.equal(accountBalance.toString(), AMOUNT)
              })
          })

          describe("addOwner", () => {
              let accounts
              beforeEach(async () => {
                  accounts = await ethers.getSigners()
                  const abi = ["function addOwner(address _owner)"]
                  const iface = new ethers.utils.Interface(abi)
                  const data = iface.encodeFunctionData("addOwner", [String(accounts[10].address)])

                  // submit transaction
                  const submitTransactionResponse = await multiSigWallet.submit(
                      multiSigWallet.address,
                      0,
                      data
                  )
                  await submitTransactionResponse.wait(1)

                  // approve transaction
                  for (let i = 1; i < 3; i++) {
                      const owners = await ethers.getSigners()
                      const ownerConnected = multiSigWallet.connect(owners[i])
                      const approvalTransactionResponse = await ownerConnected.approve("0")
                      await approvalTransactionResponse.wait(1)
                  }
              })
              it("adds a new owner", async () => {
                  const executeTransactionResponse = await multiSigWallet.execute("0")
                  await executeTransactionResponse.wait(1)
                  const owners = await multiSigWallet.getOwners()
                  assert.equal(owners[6], String(accounts[10].address))
                  assert.equal(owners.length.toString(), "7")
              })
              it("reverts if the caller is not the contract", async () => {
                  attacker = accounts[10]
                  const attackerConnected = multiSigWallet.connect(attacker)
                  await expect(
                      attackerConnected.addOwner(accounts[11].address)
                  ).to.be.revertedWithCustomError(attackerConnected, "MultiSigWallet__OnlyWallet")
              })
              it("reverts if the proposed owner is already an owner", async () => {
                  const accounts = await ethers.getSigners()
                  const abi = ["function addOwner(address _owner)"]
                  const iface = new ethers.utils.Interface(abi)
                  const data = iface.encodeFunctionData("addOwner", [String(accounts[0].address)])

                  // submit transaction
                  const submitTransactionResponse = await multiSigWallet.submit(
                      multiSigWallet.address,
                      0,
                      data
                  )
                  await submitTransactionResponse.wait(1)

                  // approve transaction
                  for (let i = 1; i < 3; i++) {
                      const owners = await ethers.getSigners()
                      const ownerConnected = multiSigWallet.connect(owners[i])
                      const approvalTransactionResponse = await ownerConnected.approve("1")
                      await approvalTransactionResponse.wait(1)
                  }

                  // assert is reverts
                  await expect(multiSigWallet.execute("1"))
                      .to.be.revertedWithCustomError(multiSigWallet, "MultiSigWallet__AlreadyOwner")
                      .withArgs(accounts[0].address)
              })
              it("reverts if the array of owners reached its max", async () => {
                  const executeTransactionResponse = await multiSigWallet.execute("0")
                  await executeTransactionResponse.wait(1)

                  // encode calldata
                  const accounts = await ethers.getSigners()
                  const abi = ["function addOwner(address _owner)"]
                  const iface = new ethers.utils.Interface(abi)
                  const data = iface.encodeFunctionData("addOwner", [String(accounts[11].address)])

                  // submit transaction
                  const submitTransactionResponse = await multiSigWallet.submit(
                      multiSigWallet.address,
                      0,
                      data
                  )
                  await submitTransactionResponse.wait(1)

                  // approve transaction
                  for (let i = 1; i < 3; i++) {
                      const owners = await ethers.getSigners()
                      const ownerConnected = multiSigWallet.connect(owners[i])
                      const approvalTransactionResponse = await ownerConnected.approve("1")
                      await approvalTransactionResponse.wait(1)
                  }

                  // assert it reverts
                  await expect(multiSigWallet.execute("1")).to.be.revertedWithCustomError(
                      multiSigWallet,
                      "MultiSigWallet__MaximumNumberOfOwnersReached"
                  )
              })
          })

          describe("removeOwner", () => {
              it("removes an owner", async () => {
                  const abi = ["function removeOwner(uint256 _index)"]
                  const iface = new ethers.utils.Interface(abi)
                  const data = iface.encodeFunctionData("removeOwner", [0])

                  // submit transaction
                  const submitTransactionResponse = await multiSigWallet.submit(
                      multiSigWallet.address,
                      0,
                      data
                  )
                  await submitTransactionResponse.wait(1)

                  // approve transaction
                  for (let i = 1; i < 3; i++) {
                      const owners = await ethers.getSigners()
                      const ownerConnected = multiSigWallet.connect(owners[i])
                      const approvalTransactionResponse = await ownerConnected.approve("0")
                      await approvalTransactionResponse.wait(1)
                  }

                  // get owners before executing the transaction
                  const initialOwners = await multiSigWallet.getOwners()
                  const firstOwner = initialOwners[0]
                  const lastOwner = initialOwners[initialOwners.length - 1]

                  // execute transaction
                  const executeTransactionResponse = await multiSigWallet.execute("0")
                  await executeTransactionResponse.wait(1)

                  // assert the array of owners was modified
                  const endingOwners = await multiSigWallet.getOwners()
                  assert(endingOwners.length === 5)
                  assert(endingOwners[0] === lastOwner)
                  // "-1" means the element doesn't exist in the array
                  assert(endingOwners.indexOf(firstOwner) === -1)
              })
          })
      })
