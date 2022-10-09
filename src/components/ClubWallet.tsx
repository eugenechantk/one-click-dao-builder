import { useEffect, useState } from "react";
import { getAppControllers } from "../controllers";
import { IBalanceData } from "../controllers/wallet";

export const ClubWallet = () => {
  const provider = getAppControllers().provider;
  const [balance, setBalance] = useState<IBalanceData[]>([]);

  const fetchBalance = async () => {
    const newBalance = await getAppControllers().wallet.getAllBalance();
    setBalance(newBalance);
    // setTimeout(fetchBalance, 10000);
  }
  

  useEffect (() => {
    fetchBalance()
  },[]);

  return <>{JSON.stringify(balance)}</>;
};
