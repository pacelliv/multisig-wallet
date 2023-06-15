## Multisig Wallet
==============

### 🌟🌟 Live Demo: https://felina-multisig-wallet-ui.vercel.app/

### Usage
-----
### Install requirements with yarn

```
git clone https://github.com/pacelliv/multisig-wallet
cd multisig-wallet
```

Define the environment variables:

```
MUMBAI_RPC_URL=
GOERLI_RPC_URL=
SEPOLIA_RPC_URL=
PRIVATE_KEY=
ETHERSCAN_API_KEY=
POLYGONSCAN_API_KEY=
COINMARKETCAP_API_KEY=
REPORT_GAS=
```

Run `yarn` to install all the dependencies:
```
yarn
```

## Test Locally

### Compile

Compile the project, mocks and inherited contract with:
```
yarn hardhat compile
```

### Deploy

Deploy the project, mocks and inherited contract with:
```
yarn hardhat deploy
```

### Test

Extensive and comprehensive unit tests against the contracts of this project has been provided. Run:
```
yarn hardhat test
```

### Coverage

This project has a 100% of coverage over the functions of the contracts.

```
yarn hardhat coverage
```

## Run the tasks

Check the `tasks` folder to see an extensive list of built tasks to interact with the wallet. You can also run `yarn hardhat --help` or `yarn hardhat help <TASK>` to get information about a task.

Spin up your local blockchain:
```
yarn hardhat node
```

Run a task:
```
yarn hardhat <TASK> --network localhost
// or
yarn hardhat <TASK> <PARAM1, PARAM2...> --network localhost 
```

## Verify on Etherscan

If you deploy your contracts to a testnet or mainnet, you can verify them if you get an [API Key](https://etherscan.io/login?cmd=last) from Etherscan and set it as an environemnt variable with the name `ETHERSCAN_API_KEY`. You can pop it into your `.env` file as seen in the `.env.example`.

However, you also can manually verify with:

```
yarn hardhat verify <DEPLOYED_CONTRACT_ADDRESS> --constructor-args
```

In it's current state, if you have your api key set, it will auto verify contract deployed on Sepolia.