import { useContract } from "@thirdweb-dev/react";
import { SmartContract } from "@thirdweb-dev/sdk/dist/declarations/src/evm/contracts/smart-contract";
import { getAppControllers } from ".";

export class TokenController {
  public tokenAddress: string;
  public tokenContract: SmartContract;

  constructor(address:string) {
    this.tokenAddress = address;
    this.tokenContract = {} as SmartContract;
  }

  public async init(address:string) {
    const contract = await getAppControllers().thirdweb.sdk.getContract(address);
    this.tokenContract = contract;
  }

  public async getAllMemberAddress() {
    if (!Object.keys(this.tokenContract).length){
      this.init(this.tokenAddress);
    }
    const events = await this.tokenContract.events.getAllEvents();
    return events;
  }
}

export function getTokenController(address:string) {
  return new TokenController(address);
}