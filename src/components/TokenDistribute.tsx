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
      console.log(formattedAddress);
    });
    fetchAddress();
  }, [])

  useEffect(() => {
    const fetchContract = async () => {
      await getAppControllers().thirdweb.sdk.getContract(clubTokenAddress).then(contract => {
        setContract(contract);
        console.log(contract);
      })
    }
    fetchContract();
  }, [clubTokenAddress]);

  return (
    <>
      <p>Token Distribute</p>
      <button>Get all token holders</button>
    </>
  );
};
