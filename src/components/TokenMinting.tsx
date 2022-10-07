import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import React from "react";
import { getAppControllers } from "../controllers";
import { ThirdWebController } from "../controllers/thirdweb";
import { getLocal } from "../helpers/local";

export interface ITokenMintingStates {
  sdkController: ThirdWebController;
  sdk: ThirdwebSDK;
  dropTokenAddress: string;
  deployContractLoading: boolean;
}

export const INITIAL_STATE = {
  sdkController: getAppControllers().thirdweb,
  sdk: getAppControllers().thirdweb.sdk,
  // TODO: remove drop token address from localStorage and fetch it from database
  dropTokenAddress: getLocal('club_token_address') ? getLocal('club_token_address') : '',
  deployContractLoading: false,
};
export class TokenMinting extends React.Component {
  public state: ITokenMintingStates;
  constructor(props: any) {
    super(props);
    this.state = {
      ...INITIAL_STATE,
    };
  }

  componentDidMount(): void {
    this.init();
  }

  public init() {
    const { sdkController } = this.state;
    sdkController.getSdkAddress();
  }

  public async deployClubTokenContract(name_input: string, symbol_input: string) {
    const { sdkController } = this.state;
    this.setState({deployContractLoading: true})
    const dropTokenAddress = await sdkController.getClubTokenAddress(name_input, symbol_input);
    this.setState({dropTokenAddress, deployContractLoading: false});
  }

  render() {
    let name_input: string, symbol_input: string, amountToClaim: string;
    const { dropTokenAddress, deployContractLoading} = this.state;
    return (
      <>
        {!dropTokenAddress ? (
          <>
            <h4>Token minting section</h4>
            <div>
              <label>Token name</label>
              <div>
                <input
                  placeholder="Token name"
                  onChange={(e) => (name_input = e.target.value)}
                ></input>
              </div>
            </div>
            <div>
              <label>Token symbol</label>
              <div>
                <input
                  placeholder="Token symbol"
                  onChange={(e) => (symbol_input = e.target.value)}
                ></input>
              </div>
            </div>
            <button
              onClick={() =>
                this.deployClubTokenContract(name_input,symbol_input)
              }
              disabled={deployContractLoading}
            >
              Mint drop token
            </button>
          </>
        ) : (
          <>
            <>Token minted! Contract address: {dropTokenAddress}</>
            <br></br>
            <br></br>
            <div>
              <input placeholder='Enter amount to claim' onChange={(e) => (amountToClaim = e.target.value)}/>
              <button onClick={() => getAppControllers().thirdweb.claimClubToken(amountToClaim)}>Claim club tokens</button>
            </div>
          </>
          
        )}
      </>
    );
  }
}
