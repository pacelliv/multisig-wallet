const { network, getNamedAccounts, ethers, deployments } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("MultiSigWalletFactory Unit Tests", () => {
          let deployer, multiSigWalletFactory

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["multisigfactory"])
              multiSigWalletFactory = await ethers.getContract("MultiSigWalletFactory")
          })

          describe("Creates a new wallet and updates the factory registry", () => {
              let creator, multiSigWalletAddress
              beforeEach(async () => {
                  const [owner1, owner2, owner3] = await ethers.getSigners()
                  const required = 3
                  const createWalletTxResponse = await multiSigWalletFactory.createWallet(
                      [owner1.address, owner2.address, owner3.address],
                      required
                  )

                  const createWalletTxReceipt = await createWalletTxResponse.wait(1)
                  creator = createWalletTxReceipt.events[0].args[0]
                  multiSigWalletAddress = createWalletTxReceipt.events[0].args[1]
              })

              it("Creates a new instance of the wallet", async () => {
                  const addressZero = ethers.constants.AddressZero
                  assert.equal(deployer, creator)
                  assert.notEqual(multiSigWalletAddress, addressZero)
              })

              it("Updates isInstantiation", async () => {
                  const isWallet = await multiSigWalletFactory.checkInstantiation(
                      multiSigWalletAddress
                  )
                  assert(isWallet)
              })

              it("Updates instantiations", async () => {
                  const instantiations = await multiSigWalletFactory.getInstantiations(creator)
                  assert(instantiations[0] === multiSigWalletAddress)
              })

              it("Updates instantiations length", async () => {
                  const instantiationsCount = await multiSigWalletFactory.getInstantiationCount(
                      creator
                  )
                  assert(instantiationsCount > 0)
              })
          })
      })
