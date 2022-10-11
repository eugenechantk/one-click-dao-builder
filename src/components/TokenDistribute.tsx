import { SmartContract } from "@thirdweb-dev/sdk/dist/declarations/src/evm/contracts/smart-contract";
import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import { getAppControllers } from "../controllers";

export const TokenDistribute = () => {
  const [clubTokenAddress, setClubTokenAddress] = useState("");
  const [contract, setContract] = useState({} as SmartContract);

  useEffect(() => {
    const fetchAddress = async () => await getAppControllers().thirdweb.getClubTokenAddress().then((address) => {
      const formattedAddress = address.replace(/['"]+/g, "");
      setClubTokenAddress(formattedAddress);
    });
    fetchAddress();
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
    let holderBalance: {[k: string]: BigNumber} = {};
    const events = await contract.events.getAllEvents();
    const transferEvent = events.filter((event) => {
      return event.eventName === "Transfer";
    })
    transferEvent.reverse();
    console.log(transferEvent);
    transferEvent.forEach((event) => {
      if (!(event.data.from in holderBalance)){
        holderBalance[event.data.from] = BigNumber.from(0);
      }
      if (!(event.data.to in holderBalance)){
        holderBalance[event.data.to] = BigNumber.from(0);
      }
      holderBalance[event.data.from] = holderBalance[event.data.from].sub(event.data.value);
      holderBalance[event.data.to] = holderBalance[event.data.to].add(event.data.value);
    })
    console.log(holderBalance);
  }

  return (
    <>
      <p>Token Distribute</p>
      <button onClick={() => getAllHolder()}>Get all token holders</button>
    </>
  );
};
