const { task } = require("hardhat/config")

task("get-number", "Reads the value of n from TestContract.sol").setAction(
    async (_, { ethers }) => {
        const testContract = await ethers.getContract("TestContract")

        console.log("\n", "\t", "🔍 Reading value...")

        const n = await testContract.getNumber()

        console.log("\t", `✅ Value of n: ${n.toString()}`, "\n")
    }
)
