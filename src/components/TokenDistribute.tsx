import { SmartContract } from "@thirdweb-dev/sdk/dist/declarations/src/evm/contracts/smart-contract";
import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import { abi } from "../constraints/abi";
import { getAppControllers } from "../controllers";
import { IBalanceData } from "../controllers/wallet";
import { ethers } from "ethers";
import { local, setLocal } from "../helpers/local";
import { SplitBalance } from "./SplitContractBalance";

export interface IHolderBalanceInfo {
  balance: BigNumber;
  power: BigNumber;
  share: { tokenAddress: string | undefined; value: BigNumber }[];
}

export const TokenDistribute = () => {
  const [clubTokenAddress, setClubTokenAddress] = useState("");
  const [contract, setContract] = useState({} as SmartContract);
  const [walletBalance, setWalletBalance] = useState([] as IBalanceData[]);
  const [holderBalance, setHolderBalance] = useState(
    {} as { [k: string]: IHolderBalanceInfo }
  );
  const [tokenSupply, setTokenSupply] = useState(0);
  const [splitAddress, setSplitAddress] = useState("");
  // Multiplying factor used to calculate claimPower and member's share on the tokens in the club wallet
  const mulFactor = BigNumber.from("1000000");
  const [loading, setLoading] = useState(false);

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
    if (localStorage.getItem("split_contract_address")){
      setSplitAddress(String(localStorage.getItem("split_contract_address")).replace(/['"]+/g, ""));
    }
  }, []);

  useEffect(() => {
    const fetchContract = async () => {
      await getAppControllers()
        .thirdweb.sdk.getContract(clubTokenAddress)
        .then((contract) => {
          setContract(contract);
        });
    };
    fetchContract();
  }, [clubTokenAddress]);

  const getWalletBalance = async () => {
    const balance = await getAppControllers().wallet.getAllBalance();
    setWalletBalance(balance);
  };

  const getAllHolder = async () => {
    let _holderBalance: { [k: string]: IHolderBalanceInfo } = {};

    // Fetch all the events related to this club token contract
    const events = await contract.events.getAllEvents();
    // Return only transfer events
    const transferEvent = events.filter((event) => {
      return event.eventName === "Transfer";
    });
    // Reverse the transfer events, because the events are ordered by latest to earliest
    transferEvent.reverse();
    console.log(transferEvent);

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
    setHolderBalance(_distibutionBalance);
    setLoading(false);
  };

  const deploySplitContract = async () => {
    const _holderBalance = holderBalance;
    let _recipient: { address: string; sharesBps: number }[] = [];

    // For each holder of the token, populate the address and share percent in the format of the split contract
    Object.entries(_holderBalance).forEach(([address, value]) => {
      const { power } = value;
      let options: { address: string; sharesBps: number } = {
        address: "",
        sharesBps: 0,
      };
      options.address = address;
      options.sharesBps =
        power.div(mulFactor.div(BigNumber.from("100"))).toNumber() * 100;
      _recipient.push(options);
    });

    // Check if the total share is 100% (or 10000); if not, distribute remaining fund to the club token address
    const totalShare = _recipient.reduce((accumulator, recipient) => {
      return (accumulator += recipient.sharesBps);
    }, 0);
    if (totalShare !== 10000) {
      _recipient.push({
        address: clubTokenAddress,
        sharesBps: 10000 - totalShare,
      });
    }

    // Deploy the split contract with that share structure in _recipient
    const contractName = await (await contract.erc20.get()).name;
    const splitContractAddress =
      await getAppControllers().thirdweb.sdk.deployer.deploySplit({
        name: `${contractName} Split`,
        recipients: _recipient,
      });
    
    setLocal("split_contract_address", splitContractAddress);
    setSplitAddress(splitContractAddress);
  };

  const send_token = (
    send_token_amount: string,
    to_address: string,
    contract_address?: string,
  ) => {
    let wallet = getAppControllers().wallet.getWallet()
    let send_abi = abi;
    let send_account = wallet.getAddress();
  
    wallet.provider.getGasPrice().then((currentGasPrice) => {
      let gas_price = ethers.utils.hexlify(parseInt(currentGasPrice.toString()))
      console.log(`gas_price: ${gas_price}`)
  
      if (contract_address) {
        // general token send
        let contract = new ethers.Contract(
          contract_address,
          send_abi,
          wallet
        )
  
        // How many tokens?
        let numberOfTokens = BigNumber.from(send_token_amount)
        console.log(`numberOfTokens: ${numberOfTokens}`)
  
        // Send tokens
        contract.transfer(to_address, numberOfTokens).then((transferResult: any) => {
          console.dir(transferResult)
          alert("sent token")
        })
      } // ether send
      else {
        //const finalValue = BigNumber.from(send_token_amount).sub(BigNumber.from(gas_price).mul(BigNumber.from("100000")));
        const tx = {
          from: send_account,
          to: to_address,
          value: BigNumber.from(send_token_amount),
          nonce: wallet.provider.getTransactionCount(
            send_account,
            "latest"
          ),
          gasLimit: ethers.utils.hexlify(100000), // 100000
          gasPrice: gas_price,
        }
        console.dir(tx)
        try {
          wallet.sendTransaction(tx).then((transaction) => {
            console.dir(transaction)
            alert("Send finished!")
          })
        } catch (error) {
          alert("failed to send!!")
        }
      }
    })
  }

  const sendAllToSplit = () => {
    if (!splitAddress) {
      return
    }
    walletBalance.forEach((token) => {
      send_token(String(token.balance), splitAddress, String(token.token_address));
    })
  }

  const distributeSplit = async () => {
    const splitBalance = await getAppControllers().wallet.getAllBalance(splitAddress);
    const splitContract = await getAppControllers().thirdweb.sdk.getSplit(splitAddress);
    splitBalance.forEach((token) => {
      if (token.token_address) {
        splitContract.distributeToken(String(token.token_address));
      } else {
        splitContract.distribute();
      }
    });
  }

  return (
    <>
      <p>Token Distribute</p>
      <button onClick={() => claimToken()} disabled={loading}>
        See claim power
      </button>
      <br></br>
      <button onClick={() => deploySplitContract()}>
        Deploy Split contract
      </button>
      <p>Split Contract Address: {splitAddress}</p>
      <br></br>
      <button onClick={() => sendAllToSplit()}>Send all balance to split contract</button>
      <br></br>
      <br></br>
      <SplitBalance address={splitAddress}/>
      <br></br>
      <button onClick={() => distributeSplit()}>Distribute fund</button>
    </>
  );
};
