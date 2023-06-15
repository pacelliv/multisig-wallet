const { developmentChains } = require("../../helper-hardhat-config")
const { ethers, deployments, network, getNamedAccounts } = require("hardhat")
const { assert } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNft Unit Tests", async () => {
          let basicNft, deployer
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["basicnft"])
              basicNft = await ethers.getContract("BasicNft")
          })

          describe("mintNft", () => {
              it("mints an nft", async () => {
                  await new Promise(async (resolve, reject) => {
                      basicNft.once("DogMinted", async (...event) => {
                          try {
                              const tokenId = event[1].toString()
                              const ownerOf = await basicNft.ownerOf(tokenId)

                              assert.equal(ownerOf, deployer)
                              assert.equal(tokenId, "0")
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject()
                          }
                      })

                      // mints NFT
                      await basicNft.mintNft("0")
                  })
              })
          })
      })
