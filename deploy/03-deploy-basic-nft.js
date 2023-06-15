const { developmentChains, chainsConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { network } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = await getChainId()
    const waitConfirmations = chainsConfig[chainId]["blockConfirmations"]

    log("----------------------------------------------------")

    const args = [
        [
            "https://ipfs.io/ipfs/QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
            "https://ipfs.io/ipfs/QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
            "https://ipfs.io/ipfs/QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
        ],
    ]

    const basicNft = await deploy("BasicNft", {
        from: deployer,
        args,
        log: true,
        waitConfirmations: waitConfirmations,
    })

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(basicNft.address, args)
    }
    log("----------------------------------------------------")
}

module.exports.tags = ["all", "basicnft"]
