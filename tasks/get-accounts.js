const { task } = require("hardhat/config")

task("get-accounts", "Fetch the list of accounts provided by Hardhat").setAction(
    async (_, { ethers }) => {
        const accounts = await ethers.getSigners()

        console.log("\n", "\t", "📋 List of accounts:")

        accounts.forEach((account, i) =>
            console.log(
                "\t",
                `Account ${i}: ${account.address}`,
                `${i === accounts.length - 1 ? "\n" : ""}`
            )
        )
    }
)
