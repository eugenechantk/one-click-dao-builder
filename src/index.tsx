import React from "react";
import { createRoot } from "react-dom/client";
import reportWebVitals from "./reportWebVitals";
import { Magic } from "magic-sdk";
import { ConnectExtension } from "@magic-ext/connect";
import { getChainData } from "./helpers/utilities";
import { ethers } from "ethers";
import { getAppConfig } from "./config";
import { WrappedApp } from "./WrappedApp";


const MAGIC_API_KEY = String(process.env.REACT_APP_MAGIC_API_KEY);
const customNodeOptions = {
  rpcUrl: getChainData(getAppConfig().chainId).rpc_url,
  chainId: getChainData(getAppConfig().chainId).network_id,
};

const magic = new Magic(MAGIC_API_KEY, {
  network: customNodeOptions,
  extensions: [new ConnectExtension()],
});

// @ts-ignore
const provider = new ethers.providers.Web3Provider(magic.rpcProvider);


const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <WrappedApp provider={provider} magic={magic}/>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
