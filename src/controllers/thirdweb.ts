import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { getAppControllers } from ".";

export class ThirdWebController {
  sdk: ThirdwebSDK;
  dropTokenAddress: string;

  constructor(){
    this.sdk = this.init();
    this.dropTokenAddress = "";
  }

  public init(): ThirdwebSDK {
    if (!this.sdk) {
       return new ThirdwebSDK(getAppControllers().wallet.getWallet());
    }
    return this.sdk
  }

  public async getSdkAddress(): Promise<void> {
    try {
        const address = await this.sdk.getSigner()?.getAddress();
        console.log("👋 SDK initialized by address:", address);
      } catch (err) {
        console.error("Failed to get apps from the sdk", err);
      }
  }

  // Deploy the drop token contract with the name and symbol as params
  // RETURN none: it will set the dropTokenAddress var as the deployed contract address
  public async getClubTokenAddress(name_input: string, symbol_input:string, primary_sale_recipient_input?:string): Promise<void> {
    try {
      const contractAddress = await this.sdk.deployer.deployTokenDrop({
        name: name_input,
        symbol: symbol_input,
        primary_sale_recipient: getAppControllers().wallet.getWallet().address,
      });
      this.dropTokenAddress = contractAddress;
      console.log(
        "✅ Successfully deployed token module, address:",
        contractAddress,
      );
    } catch (error) {
      console.error("failed to deploy token module", error);
    }
  }
}