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

    // const trueUsd = await deploy("Token", {
    //     from: deployer,
    //     log: true,
    //     args: ["TrueUSD", "TUSD", "1000000000"],
    //     waitConfirmations,
    // })

    // const shibaInu = await deploy("Token", {
    //     from: deployer,
    //     log: true,
    //     args: ["Shiba Inu", "SHIB", "1000000000"],
    //     waitConfirmations,
    // })

    // const link = await deploy("Token", {
    //     from: deployer,
    //     log: true,
    //     args: ["Chainlink", "LINK", "1000000000"],
    //     waitConfirmations,
    // })

    const uniswap = await deploy("Token", {
        from: deployer,
        log: true,
        args: ["Uniswap", "UNI", "1000000000"],
        waitConfirmations,
    })

    // const aave = await deploy("Token", {
    //     from: deployer,
    //     log: true,
    //     args: ["Aave", "AAVE", "1000000000"],
    //     waitConfirmations,
    // })

    const oneInch = await deploy("Token", {
        from: deployer,
        log: true,
        args: ["1inch", "1INCH", "1000000000"],
        waitConfirmations,
    })

    // const dai = await deploy("Token", {
    //     from: deployer,
    //     log: true,
    //     args: ["Dai", "DAI", "1000000000"],
    //     waitConfirmations,
    // })

    const curveDao = await deploy("Token", {
        from: deployer,
        log: true,
        args: ["Curve Dao", "CRV", "1000000000"],
        waitConfirmations,
    })

    if (!developmentChains.includes(network.name) && process.env.SEPOLIA_RPC_URL) {
        await verify(uniswap.address, ["Uniswap", "UNI", "1000000000"])
    }
}

module.exports.tags = ["all", "token"]
