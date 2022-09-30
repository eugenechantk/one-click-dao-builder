const ethers = require("ethers");

const mnemonic = "camp viable army easy document betray lens empower report leaf twenty achieve"
const walletMnemonic = ethers.Wallet.fromMnemonic(mnemonic);

console.log(walletMnemonic.privateKey);