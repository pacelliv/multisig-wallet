const { task } = require("hardhat/config")

task("approve-transaction", "Gives the required approval for a transaction")
    .addParam("id", "Id of the transaction to give approval")
    .setAction(async ({ id: txId }, { ethers }) => {
        const multiSigWallet = await ethers.getContract("MultiSigWallet")
        const required = (await multiSigWallet.required()).toString()
        const approvalCount = (await multiSigWallet.getApprovalCount(txId)).toString()

        console.log(
            "\t",
            `🧮 Approval count for transaction ${txId}: ${approvalCount}/${required}`,
            "\n"
        )

        if (approvalCount != "2") {
            console.log(
                "\t",
                "This transaction does not meet the required number of approvals",
                "\n"
            )
        } else {
            console.log("\t", `Transaction ${txId} can be executed, run in your terminal:`)
            console.log(
                "\t",
                `yarn hardhat execute-transaction --id ${txId} --network ${network.name}`,
                "\n"
            )
        }
    })
