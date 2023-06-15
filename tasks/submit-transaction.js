const { task } = require("hardhat/config")

task("submit-transaction").setAction(async (_, { ethers }) => {
    const chainId = network.config.chainId
    const multiSigWallet = await ethers.getContract("MultiSigWallet")
    //const token = await ethers.getContractAt("Token")
    const basicNft = await ethers.getContract("BasicNft")
    const owners = await ethers.getSigners()

    // prepare tx inputs accordingly
    const to = owners[0].address // recipient of the transaction
    const amount = ethers.utils.parseEther("0.6") // amount to transfer
    const iface = new ethers.utils.Interface([
        "function transferFrom(address from, address to, uint256 tokenId)",
    ])

    // const encodedData = iface.encodeFunctionData("transferFrom", [
    //     multiSigWallet.address,
    //     account.address,
    //     "0",
    // ])

    console.log("\n", "\t", `📲 Submitting transaction`)

    // if there's no data just pass an empty string: `ethers.utils.toUtf8Bytes("")`
    await multiSigWallet.submit(to, amount, ethers.utils.toUtf8Bytes(""))

    console.log("\t", `🔍 Waiting for 'Submit' event to be fired, please wait...`)

    await new Promise((resolve, reject) => {
        setTimeout(
            () => reject("Timeout: 'Submit' event did not fired"),
            chainId === 31337 ? 12000 : 36000
        )

        multiSigWallet.once("Submit", (...event) => {
            // const transactionDescription = iface.parseTransaction({ data: event[4] })
            console.log("\t", `📣 Transaction submitted`)
            console.log("\t", `🆔 txId: ${event[1]}`)
            console.log("\t", `✈️ to: ${event[2]}`)
            console.log("\t", `📋 calldata: ${event[4]}`)
            // console.log("\t", `🧬 Function name: ${transactionDescription.name}`, "\n")
            resolve()
        })
    })
})
