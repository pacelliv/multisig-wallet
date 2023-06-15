const { task } = require("hardhat/config")
const { chainsConfig } = require("../helper-hardhat-config")

task("mint-nft", "Mints a NFT")
    .setDescription("Breeds to mint: 'pug', 'shiba-inu' or 'st-bernard'")
    .addParam("breed", "Breed of the NFT to mint")
    .setAction(async ({ breed }, { ethers }) => {
        const chainId = network.config.chainId
        const waitConfirmations = chainsConfig[chainId]["blockConfirmations"]
        const basicNft = await ethers.getContract("BasicNft")
        const nftName = await basicNft.name()

        console.log("\n", "\t", `📲 Minting ${breed} from ${nftName}...`)

        let index

        switch (breed) {
            case "pug":
                index = 0
                break
            case "shiba-inu":
                index = 1
                break
            case "st-bernard":
                index = 2
                break
            default:
                console.log("Non existent breed")
        }

        const mintNftTxResponse = await basicNft.mintNft(index)

        console.log("\t", `⏳ Waiting for ${waitConfirmations} block confirmations, please wait...`)

        const mintNftTxReceipt = await mintNftTxResponse.wait(waitConfirmations)

        console.log("\t", "✅ NFT minted")
        console.log("\t", `⚒  Minter: ${mintNftTxReceipt.from}`)
        console.log("\t", `📑 NFT address: ${mintNftTxReceipt.to}`)
        console.log("\t", `🐶 NFT collection: ${nftName}`)
        console.log("\t", `🐶 NFT name: ${breed}`)
        console.log("\t", `🆔 Token ID: ${mintNftTxReceipt.events[1].args[1]}`, "\n")
    })
