import { useEffect } from "react";
import { getAppControllers } from "../controllers";

export const ClubWallet = () => {
  useEffect(() => {
    const getBalance = async () => {
        const balance = await getAppControllers().wallet.getAllBalance();
        console.log(balance);
    }
    const getBalance = async () => {
      const balance = await getAppControllers().provider.getBalance(getAppControllers().wallet.getWallet.)
    }
    getBalance();
  }, []);

  return <>Club Wallet info</>;
};
