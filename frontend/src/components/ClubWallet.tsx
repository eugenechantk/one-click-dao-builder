import { useEffect, useState } from "react";
import { getAppControllers } from "../controllers";
import { IBalanceData } from "../controllers/wallet";

export const ClubWallet = () => {
  const [balance, setBalance] = useState<IBalanceData[]>([]);

  const fetchBalance = async () => {
    const newBalance = await getAppControllers().wallet.getAllBalance();
    setBalance(newBalance);
    // Comment this out if I want to update wallet balance regularly
    // setTimeout(fetchBalance, 3000);
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  return <>{JSON.stringify(balance)}</>;
};
