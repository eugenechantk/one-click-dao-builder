import { IJsonRpcRequest } from "@walletconnect/types";
import { IAppState } from "../App";

export interface IAssetData {
    symbol: string;
    name: string;
    decimals: string;
    contractAddress: string;
    balance?: string;
}

export interface IChainData {
    name: string;
    short_name: string;
    chain: string;
    network: string;
    chain_id: number;
    network_id: number;
    rpc_url: string;
    native_currency: IAssetData;
}

export interface IAppEvents {
    init: (state: IAppState, setState: any) => Promise<void>;
    update: (state: IAppState, setState: any) => Promise<void>;
}

export interface IRequestRenderParams {
    label: string;
    value: string;
}

export interface IRpcEngine {
    filter: (payload: IJsonRpcRequest) => boolean;
    router: (payload: IJsonRpcRequest, state: IAppState, setState: any) => Promise<void>;
    render: (payload: IJsonRpcRequest) => IRequestRenderParams[];
    signer: (payload: IJsonRpcRequest, state: IAppState, setState: any) => Promise<void>;
}

export interface IAppConfig {
    name: string;
    logo: string;
    chainId: number;
    derivationPath: string;
    numberOfAccounts: number;
    colors: {
      defaultColor: string;
      backgroundColor: string;
    };
    chains: IChainData[];
    styleOpts: {
      showPasteUri: boolean;
      showVersion: boolean;
    };
    rpcEngine: IRpcEngine;
    events: IAppEvents;
  }