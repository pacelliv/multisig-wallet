const { task } = require("hardhat/config")

task("get-calldata", "Gets the encoded data from TestContract")
    .addParam("m", "Input parameter to encode")
    .setAction(async ({ m }, { ethers }) => {
        const testContract = await ethers.getContract("TestContract")

        console.log("\n", "\t", "📟 Encoding data...")

        const encodedData = await testContract.getCalldata(m)

        console.log("\t", `✅ Encoded data: ${encodedData}`, "\n")
    })
