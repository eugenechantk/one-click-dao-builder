import { SmartContract } from "@thirdweb-dev/sdk/dist/declarations/src/evm/contracts/smart-contract";
import { BigNumber, providers, Transaction } from "ethers";
import { useEffect, useState } from "react";
import { abi } from "../constraints/abi";
import { getAppControllers } from "../controllers";
import { IBalanceData } from "../controllers/wallet";
import { ethers } from "ethers";
import { local, setLocal } from "../helpers/local";
import { SplitBalance } from "./SplitContractBalance";
import { formatEther } from "ethers/lib/utils";

export interface IHolderBalanceInfo {
  balance: BigNumber;
  power: BigNumber;
  share: { tokenAddress: string | undefined; value: BigNumber }[];
}

export const TokenDistribute = () => {
  const [clubTokenAddress, setClubTokenAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState([] as IBalanceData[]);
  const [holderBalance, setHolderBalance] = useState(
    {} as { [k: string]: IHolderBalanceInfo }
  );
  const [tokenSupply, setTokenSupply] = useState(0);
  const [splitAddress, setSplitAddress] = useState("");
  // Multiplying factor used to calculate claimPower and member's share on the tokens in the club wallet
  const mulFactor = BigNumber.from("1000000");
  const [loading, setLoading] = useState(false);
  // let nounceOffset = 0;

  useEffect(() => {
    const fetchAddress = async () =>
      await getAppControllers()
        .thirdweb.getClubTokenAddress()
        .then((address) => {
          const formattedAddress = address.replace(/['"]+/g, "");
          setClubTokenAddress(formattedAddress);
        });
    fetchAddress();
    getWalletBalance();
    if (localStorage.getItem("split_contract_address")) {
      setSplitAddress(
        String(localStorage.getItem("split_contract_address")).replace(
          /['"]+/g,
          ""
        )
      );
    }
  }, []);

  const getWalletBalance = async () => {
    const balance = await getAppControllers().wallet.getAllBalance();
    setWalletBalance(balance);
  };

  const getAllHolder = async () => {
    let _holderBalance: { [k: string]: IHolderBalanceInfo } = {};

    const contract = await getAppControllers().thirdweb.sdk.getContract(
      clubTokenAddress
    );
    // Fetch all the events related to this club token contract
    const events = await contract.events.getAllEvents();
    // Return only transfer events
    const transferEvent = events.filter((event) => {
      return event.eventName === "Transfer";
    });
    // Reverse the transfer events, because the events are ordered by latest to earliest
    transferEvent.reverse();

    // Function to populate the holderBalance dict
    transferEvent.forEach((event) => {
      // Add the addresses if they are not already in the holder-balance dictionary
      if (!(event.data.from in _holderBalance)) {
        _holderBalance[event.data.from] = {
          balance: BigNumber.from(0),
          power: BigNumber.from(0),
          share: [],
        };
      }
      if (!(event.data.to in _holderBalance)) {
        _holderBalance[event.data.to] = {
          balance: BigNumber.from(0),
          power: BigNumber.from(0),
          share: [],
        };
      }
      // Update the value of each balance
      _holderBalance[event.data.from].balance = _holderBalance[
        event.data.from
      ].balance.sub(event.data.value);
      _holderBalance[event.data.to].balance = _holderBalance[
        event.data.to
      ].balance.add(event.data.value);
    });
    // remove the balance of the root address
    delete _holderBalance["0x0000000000000000000000000000000000000000"];
    return _holderBalance;
  };

  const getClaimPower = async (_holderBalance: {
    [k: string]: IHolderBalanceInfo;
  }) => {
    const contract = await getAppControllers().thirdweb.sdk.getContract(
      clubTokenAddress
    );
    const totalSupply = await contract.erc20.totalSupply();
    Object.entries(_holderBalance).forEach(([address, value]) => {
      const { balance } = value;
      // In order to return a BigNumber when balance/totalSupply, I have to multiply the balance by a factor such thatn balance >> totalSupply
      // When calculating the member's share on each token, I will divide the share by the multiplying factor
      _holderBalance[address].power = balance
        .mul(mulFactor)
        .div(totalSupply.value);
    });
    return _holderBalance;
  };

  const getTokenShareBalance = (_holderBalance: {
    [k: string]: IHolderBalanceInfo;
  }) => {
    Object.entries(_holderBalance).forEach(([address, value]) => {
      const power = _holderBalance[address].power;
      let _distribution: {
        tokenAddress: string | undefined;
        value: BigNumber;
      }[] = [];
      walletBalance.forEach((token) => {
        const share = BigNumber.from(token.balance).mul(power).div(mulFactor);
        _distribution.push({ tokenAddress: token.token_address, value: share });
        _holderBalance[address].share = _distribution;
      });
    });
    return _holderBalance;
  };

  const claimToken = async () => {
    setLoading(true);
    // Need to store the result of each async function as its own variable and cascade down the flow because useState is async, and the state cannot be accessed immediately for the next function
    const _holderBalance = await getAllHolder();
    const _claimPowerBalance = await getClaimPower(_holderBalance);
    const _distibutionBalance = getTokenShareBalance(_claimPowerBalance);
    console.log(_distibutionBalance);
    setHolderBalance(_distibutionBalance);
    setLoading(false);
  };

  const deploySplitContract = async () => {
    // get balance of all club token holders
    const _holder:{[k: string]: IHolderBalanceInfo} = await getAllHolder();
    // use the balance of all club token holders to determine each holder's power
    const _holderBalance:{[k: string]: IHolderBalanceInfo} = await getClaimPower(_holder);
    let _recipient: { address: string; sharesBps: number }[] = [];
    // console.log(_holderBalance);

    // For each holder of the token, populate the address and share percent in the format of the split contract
    Object.entries(_holderBalance).forEach(([address, value]) => {
      const { power } = value;
      let options: { address: string; sharesBps: number } = {
        address: "",
        sharesBps: 0,
      };
      options.address = address;
      options.sharesBps =
        power.div(mulFactor.div(BigNumber.from("10000"))).toNumber();
      _recipient.push(options);
    });

    // Check if the total share is 100% (or 10000); if not, distribute remaining fund to the club token address
    const totalShare = _recipient.reduce((accumulator, recipient) => {
      return (accumulator += recipient.sharesBps);
    }, 0);
    if (totalShare !== 10000) {
      _recipient.push({
        address: getAppControllers().wallet.getAddress(),
        sharesBps: 10000 - totalShare,
      });
    }

    // Deploy the split contract with that share structure in _recipient
    const contractName = await await getAppControllers()
      .thirdweb.sdk.getContract(clubTokenAddress)
      .then((contract) => {
        return contract.erc20.get().then((metadata) => {
          return metadata.name;
        });
      });
    const splitContractAddress =
      await getAppControllers().thirdweb.sdk.deployer.deploySplit({
        name: `${contractName} Split`,
        recipients: _recipient,
      });
      console.log(
        "✅ Successfully deployed split contract, address:",
        splitContractAddress
      );
    setLocal("split_contract_address", splitContractAddress);
    setSplitAddress(splitContractAddress);

    // burn club tokens
    
  };

  // function to burn all club tokens from token holders
  const burnAllTokens = async () => {
    const clubTokenContract = await getAppControllers().thirdweb.sdk.getContract(clubTokenAddress);
    const _holderBalance = await getAllHolder();
    Object.keys(_holderBalance).forEach(async (holder) => {
      const _balance = formatEther(_holderBalance[holder].balance.toString())
      await clubTokenContract.erc20.burnFrom(holder, _balance).then(result => console.log(result));
    })
  }
  const send_token = async (
    to_address: string,
    send_token_amount?: string,
    contract_address?: string,
    _gasForDistribute?: number
  ) => {
    let wallet = getAppControllers().wallet.getWallet();
    let send_abi = abi;
    let send_account = wallet.getAddress();
    // Base ethereum transfer gas of 21000 + contract execution gas (usually total up to 27xxx)
    const _gasLimit = ethers.utils.hexlify(50000);

    const currentGasPrice = await wallet.provider.getGasPrice();
    let gas_price = ethers.utils.hexlify(parseInt(currentGasPrice.toString()));

    if (contract_address) {
      // general token send
      let contract = new ethers.Contract(contract_address, send_abi, wallet);

      // How many tokens?
      let numberOfTokens = BigNumber.from(send_token_amount);
      // Send the tokens
      try {
        await contract
          .transfer(to_address, numberOfTokens)
          .then(async (transferResult: any) => {
            // wait until the block is mined
            await transferResult.wait()
            // make sure the nounceOffset increases for each transaction
            // nounceOffset++;
            console.dir(transferResult);
            alert("sent token");
          });
      } catch (err) {
        console.log(err);
        alert(`failed to send token ${contract_address}`);
      }
    } // ether send
    else {
      const _ethLeft = await wallet.provider.getBalance(wallet.address);
      const _finalValue = _ethLeft
        .sub(BigNumber.from(gas_price).mul(BigNumber.from(_gasLimit)))
        .sub(BigNumber.from(gas_price).mul(BigNumber.from(_gasForDistribute)));
      // make sure it does not return the same nounce even when transactions are called too close to each other
      // const _nounce = await wallet.provider.getTransactionCount(send_account).then((nounce) => nounce + nounceOffset++)
      const tx = {
        from: send_account,
        to: to_address,
        value: _finalValue,
        nonce: wallet.provider.getTransactionCount(send_account, 'latest'),
        gasLimit: _gasLimit,
        gasPrice: gas_price,
      };
      try {
        await wallet.sendTransaction(tx).then(async (transaction) => {
          // wait until the block is mined
          // await transaction.wait()
          console.dir(transaction);
          alert("Send ETH finished!");
        });
      } catch (error) {
        console.log(error);
        alert("failed to send ETH!!");
      }
    }
  };

  const sendAllToSplit = async () => {
    if (!splitAddress) {
      return;
    }
    const _walletBalance = await getAppControllers().wallet.getAllBalance();
    const _gasForDistribute = _walletBalance.length * 250000;
    // const _gasForDistribute = 4 * 250000; // for testing only
    for (let token of _walletBalance) {
      await send_token(
        splitAddress,
        String(token.balance),
        String(token.token_address),
        _gasForDistribute
      );
    }
  };

  const distributeSplit = async () => {
    const splitBalance = await getAppControllers().wallet.getAllBalance(
      splitAddress
    );
    const splitContract = await getAppControllers().thirdweb.sdk.getSplit(
      splitAddress
    );
    console.log(splitContract.getAddress());
    for (let token of splitBalance) {
      if (token.token_address) {
        try {
          await splitContract
          .distributeToken(String(token.token_address))
          .then((result) => {
            console.log(result);
          });
        } catch (err) {
          console.log(err);
        }
      } else {
        try {
          await splitContract.distribute().then((result) => {
            console.log(result);
          });
        } catch (err) {
          console.log(err)
        }
      }
    }
  };

  return (
    <>
      <p>Token Distribute</p>
      <button onClick={() => claimToken()} disabled={loading}>
        See claim power
      </button>
      <br></br>
      <button onClick={() => burnAllTokens()}>Burn all club tokens</button>
      <br></br>
      <button onClick={() => deploySplitContract()}>
        Deploy Split contract
      </button>
      <p>Split Contract Address: {splitAddress}</p>
      <br></br>
      <button onClick={() => sendAllToSplit()}>
        Send all balance to split contract
      </button>
      <br></br>
      <br></br>
      <SplitBalance address={splitAddress} />
      <br></br>
      <button onClick={() => distributeSplit()}>Distribute fund</button>
    </>
  );
};
