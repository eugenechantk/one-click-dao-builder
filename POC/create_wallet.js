const Web3 = require("web3");

let web3 = undefined;

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
}

const w = web3.eth.accounts.wallet.create(1);

// Object.entries(w.accounts).forEach((entry) => {
//   console.log(entry[0]);
// });