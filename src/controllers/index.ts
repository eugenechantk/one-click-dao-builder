import { WalletController, getWalletController } from "./wallet";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { getThirdWebController, ThirdWebController } from "./thirdweb";

interface IAppControllers {
  wallet: WalletController;
  thirdweb: ThirdWebController;
}

let controllers: IAppControllers | undefined;

export function setupAppControllers(): IAppControllers {
  const wallet = getWalletController();
  const thirdweb = getThirdWebController(wallet.getWallet());
  controllers = { wallet, thirdweb };
  return controllers;
}

export function getAppControllers(): IAppControllers {
  let _controllers = controllers;
  if (!_controllers) {
    _controllers = setupAppControllers();
  }
  return _controllers;
}
