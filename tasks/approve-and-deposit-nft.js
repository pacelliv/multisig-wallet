const { task } = require("hardhat/config")
const { chainsConfig } = require("../helper-hardhat-config")

task("approve-and-deposit-nft", "Deposits a NFT in the wallet")
    .addParam("id", "Token id of the nft to deposit")
    .setAction(async ({ id: tokenId }, { ethers }) => {
        const chainId = network.config.chainId
        const waitConfirmations = chainsConfig[chainId]["blockConfirmations"]
        const multiSigWallet = await ethers.getContract("MultiSigWallet")
        const basicNft = await ethers.getContract("BasicNft")
        const name = await basicNft.name()

        console.log(
            "\n",
            "\t",
            `📲 Approving multisig wallet contract as spender for ${name} with token id: ${tokenId}`
        )

        // approve wallet as spender
        const approveTxResponse = await basicNft.approve(multiSigWallet.address, tokenId)

        console.log(
            "\t",
            `⏳ Waiting for ${waitConfirmations} block confirmations for approval transaction, please wait...`
        )

        await approveTxResponse.wait(waitConfirmations)

        console.log("\t", `📤 Depositing NFT`)

        // deposit NFT
        const depositNftTxResponse = await multiSigWallet.depositNft(basicNft.address, tokenId)

        console.log(
            "\t",
            `⏳ Waiting for ${waitConfirmations} block confirmations for deposit transaction, please wait...`
        )

        await depositNftTxResponse.wait(waitConfirmations)

        console.log("\t", "✅ NFT deposited")
        console.log(
            "\n",
            "\t",
            `To verify the transfer of ownership of the token, run in your terminal:`
        )
        console.log(
            "\t",
            `yarn hardhat get-nft-owner --id ${tokenId} --network ${network.name}`,
            "\n"
        )
    })
