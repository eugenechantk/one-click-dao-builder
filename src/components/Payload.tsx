import { convertHexToNumber } from "@walletconnect/utils";
import { formatEther } from "ethers/lib/utils";
import axios from "axios";
import { useState, useEffect } from "react";
import { IAppState } from "../helpers/types";
import { BigNumber } from "ethers";

export interface IPayloadProps {
  payload: any;
  approveRequest: () => Promise<void>;
  rejectRequest: () => Promise<void>;
  state: IAppState;
}

export const Payload = (props: IPayloadProps) => {
  const [textSig, setTextSig] = useState("");
  const { payload, approveRequest, rejectRequest, state } = props;
  console.log(payload);

  useEffect(() => {
    // HELPER FUNCTION: get the text equivalent of the transaction function used
    async function getFunctionType() {
      const textSig = await axios
        .get(
          `https://www.4byte.directory/api/v1/signatures/?hex_signature=${payload.params[0].data.slice(
            0,
            9
          )}`
        )
        .then((response) => {
          return response.data.results[0].text_signature;
        })
        .catch((error) => {
          throw error;
        });
      setTextSig(textSig);
    }
    getFunctionType();
  }, [payload.params]);

  return (
    <div>
      <div>{payload.method}</div>
      <div>{`Function: ${textSig}`}</div>
      <div>
        {`Value: ${formatEther(BigNumber.from(payload.params[0].value))}`}
      </div>
      <div>
        {`Transaction Fee: ${
          payload.params[0].gasPrice
            ? formatEther(
                BigNumber.from(payload.params[0].gasPrice).mul(
                  BigNumber.from(payload.params[0].gasLimit)
                )
              )
            : formatEther(
                BigNumber.from(payload.params[0].maxFeePerGas).mul(
                  BigNumber.from(payload.params[0].gasLimit)
                )
              )
        }`}
      </div>
      <div>{`To: ${payload.params[0].to}`}</div>
      <br></br>
      <button onClick={approveRequest} disabled={state.transactionLoading}>
        Approve
      </button>
      <button onClick={rejectRequest} disabled={state.transactionLoading}>
        Reject
      </button>
    </div>
  );
};
