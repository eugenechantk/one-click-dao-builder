import * as React from "react";
import WalletConnect from "@walletconnect/client";
import { getAppControllers } from "./controllers";
import { getAppConfig } from "./config";
import { DEFAULT_CHAIN_ID, DEFAULT_ACTIVE_INDEX } from "./constraints/default";
import { getCachedSession } from "./helpers/utilities";

export interface IAppState {
  loading: boolean;
  scanner: boolean;
  connector: WalletConnect | null;
  uri: string;
  peerMeta: {
    description: string;
    url: string;
    icons: string[];
    name: string;
    ssl: boolean;
  };
  connected: boolean;
  chainId: number;
  address: string;
  requests: any[];
  results: any[];
  payload: any;
}

export const DEFAULT_WALLET = getAppControllers().wallet.getWallet();
export const DEFAULT_ACCOUNTS = [DEFAULT_WALLET.address];
export const DEFAULT_ADDRESS = DEFAULT_ACCOUNTS[DEFAULT_ACTIVE_INDEX];

export const INITIAL_STATE: IAppState = {
  loading: false,
  scanner: false,
  connector: null,
  uri: "",
  peerMeta: {
    description: "",
    url: "",
    icons: [],
    name: "",
    ssl: false,
  },
  connected: false,
  chainId: getAppConfig().chainId || DEFAULT_CHAIN_ID,
  address: DEFAULT_ADDRESS,
  requests: [],
  results: [],
  payload: null,
};

class App extends React.Component<{}> {
  public state: IAppState;
  
  constructor(props: any) {
    super(props);
    this.state = {
      ...INITIAL_STATE,
    };
  }

  public componentDidMount() {
    this.init();
  }

  // Initialize the WalletConnect: restore previous session, or start a brand new one by creating a new wallet
  public init = async () => {
    let { chainId } = this.state;

    const session = getCachedSession();

    if (!session) {
      await getAppControllers().wallet.init(chainId);
    } else {
      const connector = new WalletConnect({ session });

      const { connected, accounts, peerMeta } = connector;

      const address = accounts[0];

      chainId = connector.chainId;

      await getAppControllers().wallet.init(chainId);

      await this.setState({
        connected,
        connector,
        address,
        chainId,
        peerMeta,
      });

      this.subscribeToEvents();
    }
    await getAppConfig().events.init(this.state, this.bindedSetState);
  };

  public bindedSetState = (newState: Partial<IAppState>) => this.setState(newState);

  public subscribeToEvents = () => {
    console.log("ACTION", "subscribeToEvents");
    const { connector } = this.state;

    if (connector) {
      connector.on("session_request", (error, payload) => {
        console.log("EVENT", "session_request");

        if (error) {
          throw error;
        }
        console.log("SESSION_REQUEST", payload.params);
        const { peerMeta } = payload.params[0];
        this.setState({ peerMeta });
      });

      connector.on("session_update", error => {
        console.log("EVENT", "session_update");

        if (error) {
          throw error;
        }
      });

      connector.on("call_request", async (error, payload) => {
        // tslint:disable-next-line
        console.log("EVENT", "call_request", "method", payload.method);
        console.log("EVENT", "call_request", "params", payload.params);

        if (error) {
          throw error;
        }

        await getAppConfig().rpcEngine.router(payload, this.state, this.bindedSetState);
      });

      connector.on("connect", (error, payload) => {
        console.log("EVENT", "connect");

        if (error) {
          throw error;
        }

        this.setState({ connected: true });
      });

      connector.on("disconnect", (error, payload) => {
        console.log("EVENT", "disconnect");

        if (error) {
          throw error;
        }

        this.resetApp();
      });

      if (connector.connected) {
        const { chainId, accounts } = connector;
        const index = 0;
        const address = accounts[index];
        getAppControllers().wallet.update(chainId);
        this.setState({
          connected: true,
          address,
          chainId,
        });
      }

      this.setState({ connector });
    }
  };

  public resetApp = async () => {
    await this.setState({ ...INITIAL_STATE });
    this.init();
  };

  public initWalletConnect = async () => {
    const { uri } = this.state;

    this.setState({ loading: true });

    try {
      const connector = new WalletConnect({ uri });

      if (!connector.connected) {
        await connector.createSession();
      }

      await this.setState({
        loading: false,
        connector,
        uri: connector.uri,
      });

      this.subscribeToEvents();
    } catch (error) {
      this.setState({ loading: false });

      throw error;
    }
  };

  public onURIPaste = async (e: any) => {
    const data = e.target.value;
    const uri = typeof data === "string" ? data : "";
    if (uri) {
      await this.setState({ uri });
      await this.initWalletConnect();
    }
  };


  public render() {
    return (
      <>
        <div>
          {this.state.address}
        </div>
        <input onChange={this.onURIPaste} placeholder="Paste wc uri"></input>
      </>
    )
  }


}

export default App;