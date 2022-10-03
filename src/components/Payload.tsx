import { convertHexToNumber } from "@walletconnect/utils";
import { formatEther } from "ethers/lib/utils";
import axios from "axios";
import { useState, useEffect } from "react";

export const Payload = (props: any) => {
    const {payload} = props;
    const [textSig, setTextSig] = useState("");
    
    useEffect(() => {
        // HELPER FUNCTION: get the text equivalent of the transaction function used
        async function getFunctionType () {
            const textSig = await axios
            .get(
                `https://www.4byte.directory/api/v1/signatures/?hex_signature=${payload.params[0].data.slice(0,9)}`
            )
            .then((response) => {
                return response.data.results[0].text_signature;
            })
            .catch((error) => {
                throw error;
            });
            setTextSig(textSig)
        };
        getFunctionType();
    },[payload.params]);
    

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
            <div>{`To: ${payload.params[0].to}`}</div>
            <br></br>
            <button>Approve</button>
            <button>Reject</button>
        </div>
    )
}

