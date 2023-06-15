const { task } = require("hardhat/config")

task("get-transactions", "Fetch the list of submitted transactions").setAction(
    async (_, { ethers }) => {
        const multiSigWallet = await ethers.getContract("MultiSigWallet")

        console.log("\n", "\t", `📲 Reading list of transactions`)

        const transactions = await multiSigWallet.getTransactions()

        console.log("\t", "✅ Transactions found")
        console.log("\t", `🧮 Amount of submitted transactions: ${transactions.length}`)
        console.log("\t", "🗃 Transactions:")
        console.log("\t", transactions, "\n")
    }
)
