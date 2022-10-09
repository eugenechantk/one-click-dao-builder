import { useEffect, useState } from "react";
import { getAppControllers } from "../controllers";
import { IBalanceData } from "../controllers/wallet";

export const ClubWallet = () => {
  const provider = getAppControllers().provider;
  const [balance, setBalance] = useState<IBalanceData[]>([]);
  const filter = {
    address: getAppControllers().wallet.getAddress(),
    topic: null,
  }
  provider.on(filter, async () => {
    console.log('New event emitted with club wallet');
    const balance = await getAppControllers().wallet.getAllBalance();
    setBalance(balance);
  })

  useEffect (() => {
    console.log(getAppControllers().wallet.getAddress());
    const fetchBalance = async () => {
      const balance = await getAppControllers().wallet.getAllBalance();
      setBalance(balance);
    }
    fetchBalance()
  },[]);

  return <>{JSON.stringify(balance)}</>;
};
