const chainsConfig = {
    5: {
        blockConfirmations: 6,
    },

    31337: {
        blockConfirmations: 1,
    },

    80001: {
        blockConfirmations: 6,
    },

    11155111: {
        blockConfirmations: 6,
    },
}

const developmentChains = ["hardhat", "localhost"]
const walletAbiFrontendFile = "../multisig-wallet-frontend/src/constants/walletAbi.json"
const walletContractAddressesFrontendFile =
    "../multisig-wallet-frontend/src/constants/walletContractAddresses.json"
const erc20AbiFrontendFile = "../multisig-wallet-frontend/src/constants/erc20Abi.json"
const nftAbiFrontendFile = "../multisig-wallet-frontend/src/constants/nftAbi.json"

module.exports = {
    chainsConfig,
    developmentChains,
    walletAbiFrontendFile,
    walletContractAddressesFrontendFile,
    erc20AbiFrontendFile,
    nftAbiFrontendFile,
}
