import { ThirdWebController } from "../controllers/thirdweb";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { useEffect, useState } from "react";
import { getAppControllers } from "../controllers";
import { useContract, UseContractResult } from "@thirdweb-dev/react";
import { SmartContract } from "@thirdweb-dev/sdk/dist/declarations/src/evm/contracts/smart-contract";

export interface ITokenMintingFCProps {
  sdkController: ThirdWebController;
  sdk: ThirdwebSDK;
  userAddress: string;
}

export const TokenMinting = (props: ITokenMintingFCProps) => {
  const { sdkController, sdk, userAddress } = props;
  const [nameInput, setNameInput] = useState("");
  const [symbolInput, setSymbolInput] = useState("");
  const [dropTokenAddress, setDropTokenAddress] = useState(String(localStorage.getItem("club_token_address")).replace(/['"]+/g, "") || "");
  const [loading, setLoading] = useState(false);
  const [amountToClaim, setAmountToClaim] = useState("");
  const clubTokenContract = useContract(dropTokenAddress);

  const deployClubTokenContract = async (): Promise<void> => {
    const dropTokenAddress =
      await getAppControllers().thirdweb.getClubTokenAddress(
        nameInput,
        symbolInput
      );
    const formattedAddress = dropTokenAddress.replace(/['"]+/g, "");
    setDropTokenAddress(formattedAddress);
  };

  const claimClubToken = async () => {
    const claimResult = await clubTokenContract.contract?.erc20.claim(
      amountToClaim
    );
    console.log(claimResult);
  };

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
                onChange={(e) => setNameInput(e.target.value)}
              ></input>
            </div>
          </div>
          <div>
            <label>Token symbol</label>
            <div>
              <input
                placeholder="Token symbol"
                onChange={(e) => setSymbolInput(e.target.value)}
              ></input>
            </div>
          </div>
          <button
            onClick={async () => await deployClubTokenContract()}
            disabled={loading}
          >
            Mint drop token
          </button>
        </>
      ) : (
        <>
          <>Token minted! Contract address: {dropTokenAddress}</>
          <br></br>
          <br></br>
          <>Recipient address: {userAddress}</>
          <br></br>
          <br></br>
          <div>
            <input
              placeholder="Enter amount to claim"
              onChange={(e) => setAmountToClaim(e.target.value)}
            />
            <button onClick={async () => await claimClubToken()}>
              Claim club tokens
            </button>
            <br></br>
            <button
              onClick={() =>
                getAppControllers().thirdweb.setClaimCondition([
                  { startTime: new Date(), price: 0.01 },
                ])
              }
            >
              Set Claim Condition
            </button>
            <br></br>
            <button
              onClick={() =>
                getAppControllers().thirdweb.resetClaimCondition()
              }
            >
              Remove Claim Condition
            </button>
          </div>
        </>
      )}
    </>
  );
};
