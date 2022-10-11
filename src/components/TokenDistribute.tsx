import { SmartContract } from "@thirdweb-dev/sdk/dist/declarations/src/evm/contracts/smart-contract";
import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import { getAppControllers } from "../controllers";
import { IBalanceData } from "../controllers/wallet";

export interface IHolderBalanceInfo {
  balance: BigNumber;
  power: BigNumber;
  share?: {tokenAddress:string | undefined, value: BigNumber}[];
}

export const TokenDistribute = () => {
  const [clubTokenAddress, setClubTokenAddress] = useState("");
  const [contract, setContract] = useState({} as SmartContract);
  const [walletBalance, setWalletBalance] = useState([] as IBalanceData[]);
  const [holderBalance, setHolderBalance] = useState({} as {[k: string]: IHolderBalanceInfo});
  const [tokenSupply, setTokenSupply] = useState(0);
  // Multiplying factor used to calculate claimPower and member's share on the tokens in the club wallet
  const mulFactor = BigNumber.from("1000000");

  useEffect(() => {
    const fetchAddress = async () => await getAppControllers().thirdweb.getClubTokenAddress().then((address) => {
      const formattedAddress = address.replace(/['"]+/g, "");
      setClubTokenAddress(formattedAddress);
    });
    fetchAddress();
    getWalletBalance();
  }, [])

  useEffect(() => {
    const fetchContract = async () => {
      await getAppControllers().thirdweb.sdk.getContract(clubTokenAddress).then(contract => {
        setContract(contract);
      })
    }
    fetchContract();
  }, [clubTokenAddress]);

  const getWalletBalance = async () => {
    const balance = await getAppControllers().wallet.getAllBalance()
    setWalletBalance(balance);
  }

  const getAllHolder = async () => {
    let _holderBalance: {[k: string]: IHolderBalanceInfo} = {};

    // Fetch all the events related to this club token contract
    const events = await contract.events.getAllEvents();
    // Return only transfer events
    const transferEvent = events.filter((event) => {
      return event.eventName === "Transfer";
    })
    // Reverse the transfer events, because the events are ordered by latest to earliest
    transferEvent.reverse();
    console.log(transferEvent);
    
    // Function to populate the holderBalance dict
    transferEvent.forEach((event) => {
      // Add the addresses if they are not already in the holder-balance dictionary
      if (!(event.data.from in _holderBalance)){
        _holderBalance[event.data.from] = {balance: BigNumber.from(0), power:BigNumber.from(0)};
      }
      if (!(event.data.to in _holderBalance)){
        _holderBalance[event.data.to] = {balance: BigNumber.from(0), power:BigNumber.from(0)};
      }
      // Update the value of each balance
      _holderBalance[event.data.from].balance = _holderBalance[event.data.from].balance.sub(event.data.value);
      _holderBalance[event.data.to].balance = _holderBalance[event.data.to].balance.add(event.data.value);
    })
    // remove the balance of the root address
    delete _holderBalance["0x0000000000000000000000000000000000000000"];
    setHolderBalance(_holderBalance);
  }

  const getClaimPower = async () => {
    const totalSupply = await contract.erc20.totalSupply();
    let _holderBalance = holderBalance;
    Object.entries(_holderBalance).forEach(([address, value]) => {
      const {balance} = value;
      // In order to return a BigNumber when balance/totalSupply, I have to multiply the balance by a factor such thatn balance >> totalSupply
      // When calculating the member's share on each token, I will divide the share by the multiplying factor
      _holderBalance[address].power = balance.mul(mulFactor).div(totalSupply.value);
    })
    setHolderBalance(_holderBalance);
  }

  const distributeToken = async (address: string) => {
    const power = holderBalance[address].power;
    let _distribution:{tokenAddress: string | undefined, value: BigNumber}[] = [];
    walletBalance.forEach((token) => {
      const share = BigNumber.from(token.balance).mul(power).div(mulFactor);
      _distribution.push({tokenAddress:token.token_address, value:share});
    })
    return _distribution;
  }

  const claimToken = async () => {
    await getAllHolder();
    await getClaimPower();
    let _holderBalance = holderBalance;
    Object.entries(_holderBalance).forEach(async ([address, value]) => {
      const distribution = await distributeToken(address);
      _holderBalance[address].share = distribution;
    })
    setHolderBalance(_holderBalance);
  }

  return (
    <>
      <p>Token Distribute</p>
      <button onClick={() => getAllHolder()}>Get all token holders</button>
      <button onClick={() => claimToken()}>See claim power</button>
    </>
  );
};
