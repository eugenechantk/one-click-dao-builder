import { useEffect } from "react";
import { getAppConfig } from "../config";
import { getAppControllers } from "../controllers";

export const TokenDistribute = () => {
  useEffect(() => {
    console.log(getAppControllers().token?.tokenContract.erc20.claimConditions);
  });

  const getTokenHolders = async () => {
    const holders = await getAppControllers().token?.getAllMemberAddress()
    console.log(holders);
  }
  return (
    <>
      <p>Token Distribute</p>
      <button onClick={async () => getTokenHolders()}>Get all token holders</button>
    </>
  );
};
