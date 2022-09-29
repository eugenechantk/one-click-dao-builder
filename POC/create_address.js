const Web3 = require("web3");

let web3 = undefined;

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
}

const account = web3.eth.accounts.create();

console.log(`address: ${account.address}`);
console.log(`privateKey: ${account.privateKey}`);

// Output
// address: 0x6bA2BEEf3f9ffE92E90500321ebc6bE582Fce6E7
// privateKey: 0x6586f10642192b850d71dfbbe9652cc1b31997d9155e10b51b080eb8d3365f01