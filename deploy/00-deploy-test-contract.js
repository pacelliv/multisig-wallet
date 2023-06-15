const { developmentChains, chainsConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
require("dotenv").config()

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = await getChainId()
    const waitConfirmations = chainsConfig[chainId]["blockConfirmations"]

    log("----------------------------------------------------")
    log(`Deploying contract and waiting for ${waitConfirmations} block confirmations...`)

    const testContract = await deploy("TestContract", {
        from: deployer,
        log: true,
        waitConfirmations,
    })

    if (!developmentChains.includes(network.name) && process.env.SEPOLIA_RPC_URL) {
        await verify(testContract.address, [])
    }
}

module.exports.tags = ["all", "testcontract"]
