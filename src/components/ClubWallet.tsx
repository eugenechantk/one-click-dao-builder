import { useEffect } from "react";
import Moralis from "moralis";
import { getAppControllers } from "../controllers";
import axios from "axios";
import { getAppConfig } from "../config";
import { getChainData } from "../helpers/utilities";

export const ClubWallet = () => {
  useEffect(() => {
    const getBalance = async () => {
        const balance = await getAppControllers().wallet.getAllBalance();
        console.log(balance);
    }
    getBalance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>Club Wallet info</>;
};
