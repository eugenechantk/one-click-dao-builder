import { signingMethods, convertHexToNumber } from "@walletconnect/utils";
import { IAppState } from "../App";
import { apiGetCustomRequest } from "../helpers/api";
import { convertHexToUtf8IfPossible } from "../helpers/utilities";
import { IRequestRenderParams, IRpcEngine } from "../helpers/types";
import { getAppControllers } from "../controllers";
import { BigNumber } from "ethers";
import { formatEther } from "ethers/lib/utils";
import axios from "axios";

// Specify what kind of request method is accepted by this RPC
// RETURN boolean: whether the request can be served by this RPC
export function filterEthereumRequests(payload: any) {
  return (
    payload.method.startsWith("eth_") ||
    payload.method.startsWith("net_") ||
    payload.method.startsWith("shh_") ||
    payload.method.startsWith("personal_") ||
    payload.method.startsWith("wallet_")
  );
}

// Determine the right RPC method to process the request
// RETURN none: add the request with the right RPC method to the app state 
export async function routeEthereumRequests(payload: any, state: IAppState, setState: any) {
  if (!state.connector) {
    return;
  }
  const { chainId, connector } = state;
  if (!signingMethods.includes(payload.method)) {
    try {
      const result = await apiGetCustomRequest(chainId, payload);
      connector.approveRequest({
        id: payload.id,
        result,
      });
    } catch (error) {
      return connector.rejectRequest({
        id: payload.id,
        error: { message: "JSON RPC method not supported" },
      });
    }
  } else {
    const requests = state.requests;
    requests.push(payload);
    await setState({ requests });
  }
}

async function getFunctionType(data: string): Promise<string> {
  const textSig = await axios
    .get(
      `https://www.4byte.directory/api/v1/signatures/?hex_signature=${data.slice(0,9)}`
    )
    .then((response) => {
      return response.data.results[0].text_signature;
    })
    .catch((error) => {
      throw error;
    });
  // TODO: translate textSig to human-readable names
  return textSig;
}

// Format the request parameters
// RETURN IRequestRenderParams[]: a formatted set of parameters of the request
export async function renderEthereumRequests(payload: any): Promise<IRequestRenderParams[]> {
  let params = [{ label: "Method", value: payload.method }];
  // translate the function hash to text equivalent using an API
  const textSig = await getFunctionType(payload.params[0].data)

  switch (payload.method) {
    case "eth_sendTransaction":
    case "eth_signTransaction":
      params = [
        ...params,
        { label: "textSig", value: textSig},
        { label: "From", value: payload.params[0].from },
        { label: "To", value: payload.params[0].to },
        payload.params[0].gasLimit && {
          label: "Gas Limit",
          value: BigNumber.from(payload.params[0].gasLimit).toString()
        },
        payload.params[0].gas && {
          label: "Gas Limit",
          value: BigNumber.from(payload.params[0].gas).toString()
        },
        payload.params[0].gas && {
          label: "Transaction Fee",
          value: formatEther(BigNumber.from(payload.params[0].gas).mul(BigNumber.from(payload.params[0].gasLimit)))
        },
        payload.params[0].gasPrice && {
          label: "Gas Price",
          value: formatEther(BigNumber.from(payload.params[0].gasPrice))
        },
        payload.params[0].gasPrice && {
          label: "Transaction Fee",
          value: formatEther(BigNumber.from(payload.params[0].gasPrice).mul(BigNumber.from(payload.params[0].gasLimit)))
        },
        payload.params[0].maxFeePerGas && {
          label: "Gas Price",
          value: formatEther(BigNumber.from(payload.params[0].maxFeePerGas))
        },
        payload.params[0].maxFeePerGas && 
        {
          label: "Transaction Fee",
          value: formatEther(BigNumber.from(payload.params[0].maxFeePerGas).mul(BigNumber.from(payload.params[0].gasLimit)))
        },

        payload.params[0].nonce && {
          label: "Nonce",
          value: BigNumber.from(payload.params[0].nonce).toString()
        },
        payload.params[0].value && {
          label: "Value",
          value: formatEther(BigNumber.from(payload.params[0].value)) || "",
        },
        { label: "Data", value: payload.params[0].data },
      ];
      params = params.filter(param => param !== undefined)
      break;

    case "eth_sign":
      params = [
        ...params,
        { label: "Address", value: payload.params[0] },
        { label: "Message", value: payload.params[1] },
      ];
      break;
    case "personal_sign":
      params = [
        ...params,
        { label: "Address", value: payload.params[1] },
        {
          label: "Message",
          value: convertHexToUtf8IfPossible(payload.params[0]),
        },
      ];
      break;
    default:
      params = [
        ...params,
        {
          label: "params",
          value: JSON.stringify(payload.params, null, "\t"),
        },
      ];
      break;
  }
  return params;
}

// Sign the request, using the sign functions (depending on the request method) in the wallet, powered by ethers.js
// RETURN none
export async function signEthereumRequests(payload: any, state: IAppState, setState: any) {
  const { connector, address, chainId } = state;

  let errorMsg = "";
  let result = null;

  if (connector) {
    if (!getAppControllers().wallet.isActive()) {
      await getAppControllers().wallet.init(chainId);
    }

    let transaction = null;
    let dataToSign = null;
    let addressRequested = null;

    switch (payload.method) {
      case "eth_sendTransaction":
        transaction = payload.params[0];
        addressRequested = transaction.from;
        if (address.toLowerCase() === addressRequested.toLowerCase()) {
          result = await getAppControllers().wallet.sendTransaction(transaction);
        } else {
          errorMsg = "Address requested does not match active account";
        }
        break;
      case "eth_signTransaction":
        transaction = payload.params[0];
        addressRequested = transaction.from;
        if (address.toLowerCase() === addressRequested.toLowerCase()) {
          result = await getAppControllers().wallet.signTransaction(transaction);
        } else {
          errorMsg = "Address requested does not match active account";
        }
        break;
      case "eth_sign":
        dataToSign = payload.params[1];
        addressRequested = payload.params[0];
        if (address.toLowerCase() === addressRequested.toLowerCase()) {
          result = await getAppControllers().wallet.signMessage(dataToSign);
        } else {
          errorMsg = "Address requested does not match active account";
        }
        break;
      case "personal_sign":
        dataToSign = payload.params[0];
        addressRequested = payload.params[1];
        if (address.toLowerCase() === addressRequested.toLowerCase()) {
          result = await getAppControllers().wallet.signPersonalMessage(dataToSign);
        } else {
          errorMsg = "Address requested does not match active account";
        }
        break;
      case "eth_signTypedData":
        dataToSign = payload.params[1];
        addressRequested = payload.params[0];
        if (address.toLowerCase() === addressRequested.toLowerCase()) {
          result = await getAppControllers().wallet.signTypedData(dataToSign);
        } else {
          errorMsg = "Address requested does not match active account";
        }
        break;
      default:
        break;
    }

    if (result) {
      // Approve the request for WalletConnect
      connector.approveRequest({
        id: payload.id,
        result,
      });
    } else {
      let message = "JSON RPC method not supported";
      if (errorMsg) {
        message = errorMsg;
      }
      if (!getAppControllers().wallet.isActive()) {
        message = "No Active Account";
      }
      // Reject the request for WalletConnect
      connector.rejectRequest({
        id: payload.id,
        error: { message },
      });
    }
  }
}

const ethereum: IRpcEngine = {
  filter: filterEthereumRequests,
  router: routeEthereumRequests,
  render: renderEthereumRequests,
  signer: signEthereumRequests,
};

export default ethereum;
