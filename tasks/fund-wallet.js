const { task } = require("hardhat/config")
const { chainsConfig } = require("../helper-hardhat-config")

task("fund-wallet", "Funds the wallet with Ether")
    .addParam("amount", "Amount of Ether to fund the wallet with")
    .setAction(async ({ amount }, { ethers }) => {
        const chainId = network.config.chainId
        const waitConfirmations = chainsConfig[chainId]["blockConfirmations"]
        const multiSigWallet = await ethers.getContract("MultiSigWallet")
        const value = ethers.utils.parseEther(amount)
        const [signer] = await ethers.getSigners()

        console.log("\n", "\t", `📲 Funding wallet with ${amount} ETH`)

        const txResponse = await signer.sendTransaction({
            to: multiSigWallet.address,
            value,
            gasLimit: 25000,
        })

        console.log("\t", `⏳ Waiting for ${waitConfirmations} block confirmations, please wait...`)

        await txResponse.wait(waitConfirmations)

        console.log("\t", "✅ Wallet funded")

        const walletBalance = await multiSigWallet.balance()

        console.log(
            "\t",
            `🏧 New wallet balance: ${ethers.utils.formatEther(walletBalance)} ETH`,
            "\n"
        )
    })
