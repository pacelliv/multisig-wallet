const { network, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("MultiSigWalletFactory Staging Tests", () => {
          let deployer, multiSigWalletFactory
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              multiSigWalletFactory = await ethers.getContract("MultiSigWalletFactory", deployer)
          })

          describe("createWallet", () => {
              it("Creates a new instance of the multisig wallet", async () => {
                  console.log("\n", "\t", "Setting up test")
                  await new Promise(async (resolve, reject) => {
                      multiSigWalletFactory.once(
                          "ContractInstantiation",
                          async (creator, instantiation) => {
                              console.log("\t", "New multisig wallet created!")
                              console.log("\t", `Instance created by: ${creator}`)
                              console.log("\t", `Instance address: ${instantiation}`)
                              console.log("\t", "Running assertions")
                              try {
                                  const addressZero = ethers.constants.AddressZero
                                  const isWallet = await multiSigWalletFactory.checkInstantiation(
                                      instantiation
                                  )
                                  const wallets = await multiSigWalletFactory.getInstantiations(
                                      creator
                                  )
                                  const walletCount =
                                      await multiSigWalletFactory.getInstantiationCount(creator)

                                  assert(walletCount.toNumber() > 0)
                                  assert(wallets[wallets.length - 1] === instantiation)
                                  assert(instantiation != addressZero)
                                  assert(isWallet)

                                  console.log("\t", "Test completed", "\n")
                                  resolve()
                              } catch (error) {
                                  const e = error.message
                                  console.log(e)
                                  reject()
                              }
                          }
                      )

                      const owners = [
                          "0xCc8188e984b4C392091043CAa73D227Ef5e0d0a7",
                          "0xa4D65B468642BA258238a2d5175e8d9807eebc84",
                          "0xFDAB5054fC2a8534705517A1c26C550540A49B4a",
                      ]
                      const required = "2"

                      console.log("\t", "Creating new instance of the multisig wallet")

                      const createWalletTxResponse = await multiSigWalletFactory.createWallet(
                          owners,
                          required
                      )

                      console.log("\t", "Waiting for block confirmations")

                      await createWalletTxResponse.wait(3)
                  })
              })
          })
      })
