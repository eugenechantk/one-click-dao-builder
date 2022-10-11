import { WalletController, getWalletController } from "./wallet";
import { ChainId, ThirdwebSDK } from "@thirdweb-dev/sdk";
import { getThirdWebController, ThirdWebController } from "./thirdweb";
import { getDefaultProvider } from "ethers";
import { getAppConfig } from "../config";
import { SUPPORTED_CHAINS } from "../constraints/chains";
import { getChainData } from "../helpers/utilities";
import * as ethers from "ethers";
import { getTokenController, TokenController } from "./token";


interface IAppControllers {
  wallet: WalletController;
  thirdweb: ThirdWebController;
  provider: ethers.providers.Provider;
  token?: TokenController;
}

let controllers: IAppControllers | undefined;

export function setupAppControllers(): IAppControllers {
  const wallet = getWalletController();
  const thirdweb = getThirdWebController(wallet.getWallet());
  const provider = wallet.provider;
  controllers = { wallet, thirdweb, provider };
  return controllers;
}

export function addTokenController(address:string):void {
  try {
    let _controllers = controllers;
    if (!_controllers){
      _controllers = setupAppControllers();
    }
    const {wallet, thirdweb, provider} = _controllers;
    const token = getTokenController(address);
    controllers = {wallet, thirdweb, provider, token}
  } catch (error) {
    console.log(error);
  }
}

export function getAppControllers(): IAppControllers {
  let _controllers = controllers;
  if (!_controllers) {
    _controllers = setupAppControllers();
  }
  return _controllers;
}
