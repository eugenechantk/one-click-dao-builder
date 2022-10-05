import { WalletController, getWalletController } from "./wallet";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";

interface IAppControllers {
  wallet: WalletController;
}

let controllers: IAppControllers | undefined;

export function setupAppControllers(): IAppControllers {
  const wallet = getWalletController();
  controllers = { wallet };
  return controllers;
}

export function getAppControllers(): IAppControllers {
  let _controllers = controllers;
  if (!_controllers) {
    _controllers = setupAppControllers();
  }
  return _controllers;
}
