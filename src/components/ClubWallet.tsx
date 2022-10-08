import { useEffect } from "react";
import { getAppControllers } from "../controllers";

export const ClubWallet = () => {
  useEffect(() => {
    const getBalance = async () => {
        const balance = await getAppControllers().wallet.getAllBalance();
        console.log(balance);
    }
    getBalance();
  }, []);

  return <>Club Wallet info</>;
};
