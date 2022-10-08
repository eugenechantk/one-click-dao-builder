import { useEffect } from "react";
import Moralis from "moralis";
import { getAppControllers } from "../controllers";
import axios from "axios";
import { getAppConfig } from "../config";
import { getChainData } from "../helpers/utilities";

export const ClubWallet = () => {
  const MORALIES_API_KEY = String(process.env.REACT_APP_MORALIS_KEY);
  const clubWalletAddress = getAppControllers()
    .wallet.getWallet()
    .address.toLowerCase();
  const tokensOptions = {
    method: "GET",
    url: "https://deep-index.moralis.io/api/v2/%address%/erc20".replace(
      "%address%",
      clubWalletAddress
    ),
    params: { chain: getChainData(getAppConfig().chainId).network },
    headers: { accept: "application/json", "X-API-Key": MORALIES_API_KEY },
  };
  const nativeOptions = {
    method: "GET",
    url: "https://deep-index.moralis.io/api/v2/%address%/balance".replace(
      "%address%",
      clubWalletAddress
    ),
    params: { chain: getChainData(getAppConfig().chainId).network },
    headers: { accept: "application/json", "X-API-Key": MORALIES_API_KEY },
  };

  useEffect(() => {
    console.log(MORALIES_API_KEY);
    console.log(clubWalletAddress);
    const getTokenBalance = async () => {
      const balance = await axios
        .request(tokensOptions)
        .then((response) => {
          return response.data;
        })
        .catch((error) => console.log(error));
      console.log(balance);
    };
    const getNativeBalance = async () => {
      const balance = await axios
        .request(nativeOptions)
        .then((response) => {
          return response.data;
        })
        .catch((error) => console.log(error));
      console.log(balance);
    };
    getTokenBalance();
    getNativeBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>Club Wallet info</>;
};
