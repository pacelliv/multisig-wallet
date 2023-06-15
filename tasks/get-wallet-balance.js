const { task } = require("hardhat/config")

task("get-wallet-balance", "Reads the balance of the wallet").setAction(async (_, { ethers }) => {
    const multiSigWallet = await ethers.getContract("MultiSigWallet")

    console.log("\n", "\t", `🔍 Reading wallet balance...`)

    const walletBalance = await multiSigWallet.balance()

    console.log("\t", `🏧 Wallet balance: ${ethers.utils.formatEther(walletBalance)} ETH`, "\n")
})
