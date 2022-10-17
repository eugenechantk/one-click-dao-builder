import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import {
  ChainId,
  ThirdwebSDKProvider,
} from "@thirdweb-dev/react";
import { Magic } from "magic-sdk";
import { ConnectExtension } from "@magic-ext/connect";
import { getChainData } from "./helpers/utilities";
import { ethers } from "ethers";
import { getAppConfig } from "./config";

// This is the chainId your dApp will work on.
const activeChainId = ChainId.Goerli;

const INFURA_KEY = String(process.env.REACT_APP_INFURA_PROJECT_ID);

const MAGIC_API_KEY = String(process.env.REACT_APP_MAGIC_API_KEY);
const customNodeOptions = {
  rpcUrl: getChainData(getAppConfig().chainId).rpc_url,
  chainId: getChainData(getAppConfig().chainId).network_id,
};

export const magic = new Magic(MAGIC_API_KEY, {
  network: customNodeOptions,
  extensions: [new ConnectExtension()],
});

// @ts-ignore
export const provider = new ethers.providers.Web3Provider(magic.rpcProvider);

export const signer = provider.getSigner();

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <ThirdwebSDKProvider
      desiredChainId={activeChainId}
      provider={provider}
      signer={signer}
      sdkOptions={{readonlySettings:{rpcUrl:"https://goerli.infura.io/v3/%API_KEY%".replace(
        "%API_KEY%",
        INFURA_KEY
      ), chainId:5}}}
    >
      <App />
    </ThirdwebSDKProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
