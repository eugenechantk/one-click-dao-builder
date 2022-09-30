import * as React from "react";
import WalletConnect from "@walletconnect/client";
import { getAppControllers } from "./controllers";
import { DEFAULT_ACTIVE_INDEX } from "./constraints/default";

export interface IAppState {
  loading: boolean;
  scanner: boolean;
  connector: WalletConnect | null;
  uri: string;
  peerMeta: {
    description: string;
    url: string;
    icons: string[];
    name: string;
    ssl: boolean;
  };
  connected: boolean;
  chainId: number;
  accounts: string[];
  activeIndex: number;
  address: string;
  requests: any[];
  results: any[];
  payload: any;
}

export const DEFAULT_ACCOUNTS = getAppControllers().wallet.getAccounts();
export const DEFAULT_ADDRESS = DEFAULT_ACCOUNTS[DEFAULT_ACTIVE_INDEX];

const App = () => {

  return (
    <>
      Hi
    </>
  )
}

export default App;