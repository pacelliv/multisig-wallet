const { network, ethers } = require("hardhat")
const { assert } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("MultiSigWallet Stating Tests", () => {
          let multiSigWallet
          beforeEach(async () => {
              multiSigWallet = await ethers.getContract("MultiSigWallet")
          })

          describe("Submit, approve and executes a transaction", () => {
              it("Can handle transactions", async () => {
                  const owners = await ethers.getSigners()
                  const amount = ethers.BigNumber.from(ethers.utils.parseEther("0.2"))

                  console.log(
                      "\n",
                      "\t",
                      `Funding wallet with ${ethers.utils.formatEther(amount.toString())} ETH`
                  )

                  const fundWalletTxResponse = await owners[0].sendTransaction({
                      to: multiSigWallet.address,
                      value: ethers.utils.parseEther("0.2"),
                      gasLimit: 25000,
                  })

                  await fundWalletTxResponse.wait(2)

                  console.log("\t", "Wallet funded")
                  console.log("\t", "Submitting transaction")

                  const submitTxResponse = await multiSigWallet.submit(
                      owners[1].address,
                      ethers.utils.parseEther("0.2"),
                      ethers.utils.toUtf8Bytes("")
                  )

                  const submitTxReceipt = await submitTxResponse.wait(2)
                  const txId = submitTxReceipt.events[0].args[1].toString()

                  console.log("\t", `Transaction with id ${txId} submitted`)

                  for (let i = 0; i < 2; i++) {
                      const ownerConnected = multiSigWallet.connect(owners[i])

                      console.log("\t", `Owner ${i} is approving transaction`)

                      const approveTxResponse = await ownerConnected.approve(txId)
                      await approveTxResponse.wait(2)
                  }

                  console.log("\t", "Checking approval count for transaction")

                  const required = await multiSigWallet.required()
                  const approvalCount = await multiSigWallet.getApprovalCount(txId)
                  assert.equal(approvalCount.toString(), "2")

                  console.log(
                      "\t",
                      `Transaction id ${txId} meets the required amount of approvals: ${approvalCount.toString()}/${required.toString()}`
                  )

                  console.log("\t", "Executing transaction")
                  console.log(
                      "\t",
                      `The wallet is transferring ${ethers.utils.formatEther(
                          amount.toString()
                      )} ETH to ${owners[1].address}`
                  )

                  const executeTxResponse = await multiSigWallet.execute(txId)
                  await executeTxResponse.wait(2)

                  const endingWalletBalance = await multiSigWallet.balance()
                  assert.equal(endingWalletBalance.toString(), "0")

                  console.log("\t", "Funds transferred", "\n")
              })
          })
      })
