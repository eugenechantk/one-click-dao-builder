import { SmartContract } from "@thirdweb-dev/sdk/dist/declarations/src/evm/contracts/smart-contract";
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
    let holderBalance;
    const events = await contract.events.getAllEvents();
    const transferEvent = events.filter((event) => {
      return event.eventName === "Transfer";
    })
    transferEvent.reverse();
    transferEvent.forEach((event) => {
      
    })
  }

  return (
    <>
      <p>Token Distribute</p>
      <button onClick={() => getAllHolder()}>Get all token holders</button>
    </>
  );
};
