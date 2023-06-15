const { task } = require("hardhat/config")

task("get-nft-owner", "Queries the owner of nft")
    .addParam("id", "Id of the token to query")
    .setAction(async ({ id: tokenId }, { ethers }) => {
        const nftContract = await ethers.getContract("BasicNft")
        const name = await nftContract.name()

        console.log("\n", "\t", `📲 Reading owner for ${name} with token id: ${tokenId}`)

        const owner = await nftContract.ownerOf(tokenId)

        console.log("\t", `🏧 Owner: ${owner}`, "\n")
    })
