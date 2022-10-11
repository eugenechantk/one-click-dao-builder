import { useContract, useTokenDrop } from "@thirdweb-dev/react";
import { SmartContract } from "@thirdweb-dev/sdk/dist/declarations/src/evm/contracts/smart-contract";
import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import { getAppControllers } from "../controllers";
import { IBalanceData } from "../controllers/wallet";

export const TokenDistribute = () => {
  const [clubTokenAddress, setClubTokenAddress] = useState("");
  const [contract, setContract] = useState({} as SmartContract);
  const [walletBalance, setWalletBalance] = useState([] as IBalanceData[]);
  const [holderBalance, setHolderBalance] = useState({} as {[k: string]: {balance: BigNumber, power: BigNumber}});
  const [tokenSupply, setTokenSupply] = useState(0);

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

  const getAllHolder = async () => {
    let _holderBalance: {[k: string]: {balance: BigNumber, power: BigNumber}} = {};

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

  const getWalletBalance = async () => {
    const balance = await getAppControllers().wallet.getAllBalance()
    setWalletBalance(balance);
  }

  const getClaimPower = async () => {
    const totalSupply = await contract.erc20.totalSupply();
    console.log(totalSupply);
  }

  return (
    <>
      <p>Token Distribute</p>
      <button onClick={() => getAllHolder()}>Get all token holders</button>
      <button onClick={() => getClaimPower()}>See claim power</button>
    </>
  );
};
