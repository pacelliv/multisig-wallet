const { task } = require("hardhat/config")
const { chainsConfig } = require("../helper-hardhat-config")
require("dotenv").config()

task("execute-transaction", "Executes a transaction with the required number of approvals")
    .addParam("id", "Id of the transaction to execute")
    .setAction(async ({ id: txId }, { ethers }) => {
        const chainId = network.config.chainId
        const waitConfirmations = chainsConfig[chainId]["blockConfirmations"]
        const multiSigWallet = await ethers.getContract("MultiSigWallet")

        console.log("\n", "\t", `📲 Executing transaction ${txId}`)

        const executeTransactionTxResponse = await multiSigWallet.execute(txId)

        console.log("\t", `⏳ Waiting for ${waitConfirmations} block confirmations, please wait...`)

        await executeTransactionTxResponse.wait(waitConfirmations)

        console.log("\t", "✅ Transaction executed", "\n")
    })
