import { ThirdWebController } from "../controllers/thirdweb";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { useEffect, useState } from "react";
import { getAppControllers } from "../controllers";
import { useContract } from "@thirdweb-dev/react";
import { TokenDistribute } from "./TokenDistribute";

export interface ITokenMintingFCProps {
  sdkController: ThirdWebController;
  sdk: ThirdwebSDK;
  userAddress: string;
}

export const TokenMinting = (props: ITokenMintingFCProps) => {
  const { userAddress } = props;
  const [nameInput, setNameInput] = useState("");
  const [symbolInput, setSymbolInput] = useState("");
  const [dropTokenAddress, setDropTokenAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [amountToClaim, setAmountToClaim] = useState("");
  const clubTokenContract = useContract(dropTokenAddress);
  const [claimTokenLoading, setClaimTokenLoading] = useState(false);

  const deployClubTokenContract = async (): Promise<void> => {
    setLoading(true);
    const dropTokenAddress =
      await getAppControllers().thirdweb.getClubTokenAddress(
        nameInput,
        symbolInput
      );
    const formattedAddress = dropTokenAddress.replace(/['"]+/g, "");
    await getAppControllers().thirdweb.setClaimCondition();
    setDropTokenAddress(formattedAddress);
    setLoading(false);
  };

  const claimClubToken = async () => {
    setClaimTokenLoading(true);
    try {
      const claimResult = await clubTokenContract.contract?.erc20.claim(
        amountToClaim
      );
      console.log(claimResult);
    } catch (err) {
      console.log(err);
    }
    setClaimTokenLoading(false);
  };

  useEffect (() => {
    if (localStorage.getItem("club_token_address")) {
      setDropTokenAddress(String(localStorage.getItem("club_token_address")).replace(/['"]+/g, ""))
    }
  }, []);

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
            <button onClick={async () => await claimClubToken()} disabled={claimTokenLoading}>
              Claim club tokens
            </button>
            <br></br>
            <button
              onClick={() =>
                getAppControllers().thirdweb.setClaimCondition()
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
          <br></br>
          <br></br>
          <TokenDistribute />
        </>
      )}
    </>
  );
};
