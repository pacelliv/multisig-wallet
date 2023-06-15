const { task } = require("hardhat/config")
const { chainsConfig } = require("../helper-hardhat-config")

task("approve-and-deposit-tokens", "Deposit ERC20 tokens in the wallet")
    .addParam("contract", "Address of the token contract")
    .addParam("amount", "Amoun of tokens to deposit")
    .setAction(async ({ contract, amount }, { ethers }) => {
        const chainId = network.config.chainId
        const waitConfirmations = chainsConfig[chainId]["blockConfirmations"]
        const multiSigWallet = await ethers.getContract("MultiSigWallet")
        const token = await ethers.getContractAt("Token", contract)
        const symbol = await token.symbol()

        console.log("\n", "\t", `📲 Approving multisig wallet as spender for ${amount} ${symbol}`)

        // approve wallet as spender
        const approveTxResponse = await token.approve(
            multiSigWallet.address,
            ethers.utils.parseEther(amount)
        )

        console.log(
            "\t",
            `⏳ Waiting for ${waitConfirmations} block confirmations for approval transaction, please wait...`
        )

        await approveTxResponse.wait(waitConfirmations)

        console.log("\t", `📤 Depositing tokens`)

        // deposit NFT
        const depositNftTxResponse = await multiSigWallet.depositErc20(
            token.address,
            ethers.utils.parseEther(amount)
        )

        console.log(
            "\t",
            `⏳ Waiting for ${waitConfirmations} block confirmations for deposit transaction, please wait...`
        )

        await depositNftTxResponse.wait(waitConfirmations)

        console.log("\t", "✅ NFT deposited")
        console.log(
            "\n",
            "\t",
            `To verify the transfer of ownership of the tokens, run in your terminal:`
        )
        console.log(
            "\t",
            `yarn hardhat account-token-balance --account ${multiSigWallet.address} --contract ${contract} --network ${network.name}`,
            "\n"
        )
    })
