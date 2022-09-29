import * as React from "react";
import WalletConnect from "@walletconnect/client";

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

const App = () => {

  return (
    <>
      Hi
    </>
  )
}

export default App;