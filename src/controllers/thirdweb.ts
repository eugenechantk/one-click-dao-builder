import {
  ClaimConditionInput,
  ThirdwebSDK,
  TransactionResult,
} from "@thirdweb-dev/sdk";
import { ethers } from "ethers";
import { getAppControllers } from ".";
import { local, setLocal } from "../helpers/local";

const initialClaimCondition: ClaimConditionInput = {
  startTime: new Date(),
  price: 0.01,
};

export class ThirdWebController {
  public sdk: ThirdwebSDK;
  public clubTokenAddress: string;
  public claimCondition: ClaimConditionInput[];

  constructor(wallet: ethers.Wallet) {
    this.sdk = this.init(wallet);
    this.clubTokenAddress = localStorage.getItem("club_token_address") || "";
    this.claimCondition = [];
  }

  public init(wallet: ethers.Wallet): ThirdwebSDK {
    if (!this.sdk) {
      const sdk = new ThirdwebSDK(wallet);
      this.sdk = sdk;
    }
    return this.sdk;
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
  public async getClubTokenAddress(
    name_input: string,
    symbol_input: string,
    primary_sale_recipient_input?: string
  ): Promise<string> {
    if (!this.clubTokenAddress) {
      let contractAddress = "";
      try {
        contractAddress = await this.sdk.deployer.deployTokenDrop({
          name: name_input,
          symbol: symbol_input,
          primary_sale_recipient:
            getAppControllers().wallet.getWallet().address,
        });
        console.log(
          "✅ Successfully deployed token module, address:",
          contractAddress
        );
        setLocal("club_token_address", contractAddress);
      } catch (error) {
        console.error("failed to deploy token module", error);
      }
      this.clubTokenAddress = contractAddress;
    }
    if (!this.claimCondition?.length) {
      try {
        await this.setClaimCondition([initialClaimCondition]);
      } catch (error) {
        console.log(`Error in setting claim condition: `, error);
      }
    }
    return this.clubTokenAddress;
  }

  // Setting the claim condition, inc. start date, price, which cryptocurrency to charge
  // ARG - condition: ClaimConditionInput[] -- the claim condition with various parameters to set the start date, price, maxQuantity, currency to claim, etc.
  public async setClaimCondition(
    condition: ClaimConditionInput[]
  ): Promise<void> {
    const formattedAddress = this.clubTokenAddress.replace(/['"]+/g, "");
    console.log(formattedAddress);
    const clubTokenContract = await this.sdk.getTokenDrop(formattedAddress);
    const transactionResult = await clubTokenContract.claimConditions.set(
      condition
    );
    this.claimCondition = condition;
    console.log(transactionResult);
  }

  public async resetClaimCondition(): Promise<void> {
    const formattedAddress = this.clubTokenAddress.replace(/['"]+/g, "");
    const clubTokenContract = await this.sdk.getTokenDrop(formattedAddress);
    const transactionResult = await clubTokenContract.claimConditions.set([]);
    this.claimCondition = [];
    console.log(transactionResult);
  }

  public async claimClubToken(amountToClaim: string) {
    const formattedAddress = this.clubTokenAddress.replace(/['"]+/g, "");
    const clubTokenContract =
      await getAppControllers().thirdweb.sdk.getTokenDrop(formattedAddress);
    const claimResult = await clubTokenContract.claim(amountToClaim);
    console.log(
      `✅ Successfully claimed ${amountToClaim} tokens. Result:`,
      claimResult
    );
  }
}

export function getThirdWebController(wallet: ethers.Wallet) {
  return new ThirdWebController(wallet);
}
