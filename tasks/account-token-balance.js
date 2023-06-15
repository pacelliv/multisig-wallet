const { task } = require("hardhat/config")

task(
    "account-token-balance",
    "Queries the balanceOf method of the Token contract to read the balance of tokens of the wallet"
)
    .addParam("account", "Address of the account to query")
    .addParam("contract", "Address of the contract to query")
    .setAction(async ({ account, contract }, { ethers }) => {
        const tokenContract = await ethers.getContractAt("Token", contract)
        const tokenSymbol = await tokenContract.symbol()

        console.log("\n", "\t", `🔍 Reading wallet ${tokenSymbol} balance...`)

        const tokenBalance = await tokenContract.balanceOf(account)

        console.log(
            "\t",
            `🏧 Account balance: ${ethers.utils.formatEther(tokenBalance)} ${tokenSymbol}`,
            "\n"
        )
    })
