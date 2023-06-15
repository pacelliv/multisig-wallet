const { ethers } = require("hardhat")
const {
    walletAbiFrontendFile,
    walletContractAddressesFrontendFile,
    erc20AbiFrontendFile,
    nftAbiFrontendFile,
} = require("../helper-hardhat-config")
const fs = require("fs")

module.exports = async ({ getChainId }) => {
    let multiSigWallet, chainId
    const UPDATE_FRONTEND = false

    if (UPDATE_FRONTEND) {
        console.log("Updating frontend files...")
        chainId = await getChainId()
        multiSigWallet = await ethers.getContract("MultiSigWallet")
        token = await ethers.getContract("Token")
        basicNft = await ethers.getContract("BasicNft")
        await updateErc20AbiFrontendFile()
        await updateNftAbiFrontendFile()
        await updateAbiFrontendFile()
        await updateContractAddressesFrontendFile()
        console.log("Frontend files updated")
    }

    async function updateErc20AbiFrontendFile() {
        fs.writeFileSync(
            erc20AbiFrontendFile,
            token.interface.format(ethers.utils.FormatTypes.json)
        )
    }

    async function updateNftAbiFrontendFile() {
        fs.writeFileSync(
            nftAbiFrontendFile,
            basicNft.interface.format(ethers.utils.FormatTypes.json)
        )
    }

    async function updateAbiFrontendFile() {
        fs.writeFileSync(
            walletAbiFrontendFile,
            multiSigWallet.interface.format(ethers.utils.FormatTypes.json)
        )
    }

    async function updateContractAddressesFrontendFile() {
        const currentContractAddresses = JSON.parse(
            fs.readFileSync(walletContractAddressesFrontendFile, {
                encoding: "utf8",
            })
        )

        if (chainId in currentContractAddresses) {
            if (!currentContractAddresses[chainId].includes(multiSigWallet.address)) {
                currentContractAddresses[chainId].push(multiSigWallet.address)
            }
        } else {
            currentContractAddresses[chainId] = [multiSigWallet.address]
        }

        fs.writeFileSync(
            walletContractAddressesFrontendFile,
            JSON.stringify(currentContractAddresses)
        )
    }
}

module.exports.tags = ["all", "frontend"]
