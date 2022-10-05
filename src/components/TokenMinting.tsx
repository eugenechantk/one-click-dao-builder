import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import React from "react";
import { ThirdWebController } from "../controllers/thirdweb";

export interface ITokenMintingStates {
  sdkController: ThirdWebController;
}

export const INITIAL_STATE = {
  sdkController: new ThirdWebController(),
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

  render() {
    let name_input: string, symbol_input: string;
    const { sdkController } = this.state;
    return (
      <>
        {!sdkController.dropTokenAddress ? (
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
                sdkController.getClubTokenAddress(name_input, symbol_input)
              }
            >
              Mint drop token
            </button>
          </>
        ) : (
          <></>
        )}
      </>
    );
  }
}
