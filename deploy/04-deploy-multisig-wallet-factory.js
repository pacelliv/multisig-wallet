const { developmentChains, chainsConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { network, getNamedAccounts } = require("hardhat")
require("dotenv").config()

module.exports = async ({ deployments, getChainId }) => {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments
    const chainId = await getChainId()
    const waitConfirmations = chainsConfig[chainId]["blockConfirmations"]

    log("----------------------------------------------------")
    log(`Deploying contract and waiting for ${waitConfirmations} block confirmations...`)

    const multiSigWalletFactory = await deploy("MultiSigWalletFactory", {
        from: deployer,
        log: true,
        args: [],
        waitConfirmations,
    })

    if (!developmentChains.includes(network.name) && process.env.SEPOLIA_RPC_URL) {
        await verify(multiSigWalletFactory.address, [])
    }
}

module.exports.tags = ["all", "multisigfactory"]
