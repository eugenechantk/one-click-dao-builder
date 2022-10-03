import { convertHexToNumber } from "@walletconnect/utils";
import { formatEther } from "ethers/lib/utils";
import axios from "axios";
import { useState } from "react";

export const Payload = (props: any) => {
    const {payload} = props;
    const [textSig, setTextSig] = useState("");
    
    // HELPER FUNCTION: get the text equivalent of the transaction function used
    async function getFunctionType (hexSig: string) {
        const textSig = await axios
          .get(
            `https://www.4byte.directory/api/v1/signatures/?hex_signature=${hexSig}`
          )
          .then((response) => {
            return response.data.results[0].text_signature;
          })
          .catch((error) => {
            throw error;
          });
        const resolvedTextSig = await textSig;
        await setTextSig(resolvedTextSig)
      };

    return (
        <div>
            <div>{payload.method}</div>
            <div>{`Function: ${textSig}`}</div>
            <div>{`Value: ${formatEther(
                convertHexToNumber(payload.params[0].value)
            )}`}</div>
            <div>{`Gas: ${formatEther(
                convertHexToNumber(payload.params[0].gas)
            )}`}</div>
        </div>
    )
}

