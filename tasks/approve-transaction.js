const { task } = require("hardhat/config")

task("approve-transaction", "Gives the required approval for a transaction")
    .addParam("id", "Id of the transaction to give approval")
    .setAction(async ({ id: txId }, { ethers }) => {
        const chainId = network.config.chainId
        const waitConfirmations = chainId === 31337 ? 1 : 3
        const multiSigWallet = await ethers.getContract("MultiSigWallet")
        const required = (await multiSigWallet.required()).toString()

        for (let i = 0; i < 2; i++) {
            const accounts = await ethers.getSigners()
            const multiSigWalletAccountConnected = multiSigWallet.connect(accounts[i])

            console.log("\n", "\t", `📲 Approving transaction`)

            const approveTransactionTxResponse = await multiSigWalletAccountConnected.approve(txId)

            console.log(
                "\t",
                `⏳ Waiting for ${waitConfirmations} block confirmations, please wait...`
            )

            await approveTransactionTxResponse.wait(waitConfirmations)

            console.log("\t", "✅ Transaction approved", "\n")
        }

        const approvalCount = await multiSigWallet.getApprovalCount(txId)

        console.log(
            "\t",
            `🧮 Approval count for transaction ${txId}: ${approvalCount.toString()}/${required}`,
            "\n"
        )

        console.log("\t", `Transaction ${txId} can be executed, run in your terminal:`)
        console.log(
            "\t",
            `yarn hardhat execute-transaction --id ${txId} --network ${network.name}`,
            "\n"
        )
    })
