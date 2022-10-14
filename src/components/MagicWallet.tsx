import { getAppConfig } from "../config";
import { getChainData } from "../helpers/utilities";
import { Magic } from "magic-sdk";
import { ConnectExtension } from "@magic-ext/connect";
import { ethers } from "ethers";

export const MagicWallet = () => {
  const MAGIC_API_KEY = String(process.env.REACT_APP_MAGIC_API_KEY);
  const customNodeOptions = {
    rpcUrl: getChainData(getAppConfig().chainId).rpc_url, // your ethereum, polygon, or optimism mainnet/testnet rpc URL
    chainId: getChainData(getAppConfig().chainId).network_id,
  };

  const magic = new Magic(MAGIC_API_KEY, {
    network: customNodeOptions,
    extensions: [new ConnectExtension()],
  });

  // @ts-ignore
  const provider = new ethers.providers.Web3Provider(magic.rpcProvider);

  const login = async () => {
    await provider.send("eth_accounts", []);
    const signer = await provider.getSigner();
  }

  return (
    <>
      <p>Magic Connect</p>
      <button onClick={() => login()}>login</button>
      <button onClick={() => magic.connect.showWallet().catch(e => console.log(e))}>Show wallet</button>
    </>
  )
}