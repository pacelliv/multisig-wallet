const { developmentChains, chainsConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { ethers, network, getNamedAccounts } = require("hardhat")
require("dotenv").config()

module.exports = async ({ deployments, getChainId }) => {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments
    const chainId = await getChainId()
    const waitConfirmations = chainsConfig[chainId]["blockConfirmations"]
    const accounts = await ethers.getSigners()

    let owners
    if (chainId === "31337") {
        owners = [
            accounts[0].address,
            accounts[1].address,
            accounts[2].address,
            accounts[3].address,
            accounts[4].address,
            accounts[5].address,
        ]
    } else {
        // declare your list of owner for tesnet
        owners = ["", "", ""]
    }

    const args = [owners, 2]

    log("----------------------------------------------------")
    log(`Deploying contract and waiting for ${waitConfirmations} block confirmations...`)

    const multiSigWallet = await deploy("MultiSigWallet", {
        from: deployer,
        log: true,
        args,
        waitConfirmations,
    })

    if (!developmentChains.includes(network.name) && process.env.SEPOLIA_RPC_URL) {
        await verify(multiSigWallet.address, args)
    }
}

module.exports.tags = ["all", "multisig"]
