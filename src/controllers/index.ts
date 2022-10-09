import { WalletController, getWalletController } from "./wallet";
import { ChainId, ThirdwebSDK } from "@thirdweb-dev/sdk";
import { getThirdWebController, ThirdWebController } from "./thirdweb";
import { getDefaultProvider } from "ethers";
import { getAppConfig } from "../config";
import { SUPPORTED_CHAINS } from "../constraints/chains";
import { getChainData } from "../helpers/utilities";
import * as ethers from "ethers";


interface IAppControllers {
  wallet: WalletController;
  thirdweb: ThirdWebController;
  provider: ethers.providers.Provider;
}

let controllers: IAppControllers | undefined;

export function setupAppControllers(): IAppControllers {
  const wallet = getWalletController();
  const thirdweb = getThirdWebController(wallet.getWallet());
  const provider = new ethers.providers.InfuraProvider(getChainData(getAppConfig().chainId).network, process.env.REACT_APP_INFURA_PROJECT_ID);
  controllers = { wallet, thirdweb, provider };
  return controllers;
}

export function getAppControllers(): IAppControllers {
  let _controllers = controllers;
  if (!_controllers) {
    _controllers = setupAppControllers();
  }
  return _controllers;
}
