import * as React from "react";
import { getAppControllers } from "./controllers";
import { getAppConfig } from "./config";
import { DEFAULT_CHAIN_ID, DEFAULT_ACTIVE_INDEX } from "./constraints/default";
import { getCachedSession } from "./helpers/utilities";
import WalletConnect from "@walletconnect/client";
import { Payload } from "./components/Payload";
import { ConnectWallet } from "@thirdweb-dev/react";
import { UserWallet } from "./components/UserWallet";
import { TokenMinting } from "./components/TokenMinting";
import { ClubWallet } from "./components/ClubWallet";
import { TokenDistribute } from "./components/TokenDistribute";
export interface IAppState {
  loading: boolean;
  scanner: boolean;
  connector: WalletConnect | null;
  transactionLoading: boolean;
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
  userAddress: string;
}

export const INITIAL_STATE: IAppState = {
  loading: false,
  scanner: false,
  connector: null,
  transactionLoading: false,
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
  // TODO: simplify accounts, address, activeIndex since there is only 1 account
  // address: DEFAULT_ADDRESS,
  address: getAppControllers().wallet.getWallet().address || "",
  requests: [],
  results: [],
  payload: null,
  userAddress: "",
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

    // TODO: Modify how/what we store in localStorage for the cache
    // NOTE: the connector is stored in localStorage once connected
    const wcSession = getCachedSession("walletconnect");

    if (!wcSession) {
      await getAppControllers().wallet.init(chainId);
      this.setState({
        address: getAppControllers().wallet.getWallet().address,
      });
    } else {
      const connector = new WalletConnect({ session: wcSession });

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

  public bindedSetState = (newState: Partial<IAppState>) =>
    this.setState(newState);

  // HELPER FUNCTION: call this subscribe function to confirm the type of event emitted by connector
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

      connector.on("session_update", (error) => {
        console.log("EVENT", "session_update");

        if (error) {
          throw error;
        }
      });

      connector.on("call_request", async (error, payload) => {
        // tslint:disable-next-line
        console.log("EVENT", "call_request", "method", payload.method);
        console.log("EVENT", "call_request", "params", payload.params);
        console.log("PAYLOAD", payload);

        if (error) {
          throw error;
        }

        await getAppConfig().rpcEngine.router(
          payload,
          this.state,
          this.bindedSetState
        );
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
      // Instantiate a new WalletConnect connector to connect to dapps
      const connector = new WalletConnect({ uri });

      if (!connector.connected) {
        // Create a new session with the WalletConnect connector
        await connector.createSession();
      }

      // Store the connector to the specific dapp in the states
      await this.setState({
        loading: false,
        connector,
        uri: connector.uri,
      });

      // Call the event subscriber to get to know what is the event emitted by connector
      this.subscribeToEvents();
    } catch (error) {
      this.setState({ loading: false });

      throw error;
    }
  };

  public approveSession = () => {
    console.log("ACTION", "approveSession");
    const { connector, chainId, address } = this.state;
    if (connector) {
      // Approve the session connected by this state's connector
      connector.approveSession({ chainId, accounts: [address] });
    }
    this.setState({ connector });
  };

  public killSession = () => {
    console.log("ACTION", "killSession");
    const { connector } = this.state;
    if (connector) {
      connector.killSession();
    }
    this.resetApp();
  };

  public onURIPaste = async (e: any) => {
    const data = e.target.value;
    const uri = typeof data === "string" ? data : "";
    if (uri) {
      await this.setState({ uri });
      await this.initWalletConnect();
    }
  };

  public openRequest = async (request: any) => {
    const payload = Object.assign({}, request);

    const params = payload.params[0];
    if (request.method === "eth_sendTransaction") {
      payload.params[0] = await getAppControllers().wallet.populateTransaction(
        params
      );
    }

    this.setState({
      payload,
    });
  };

  // Approve request from connected dApp using rpcEngine
  public approveRequest = async () => {
    const { connector, payload } = this.state;

    try {
      this.setState({ transactionLoading: true });
      // Use the signer function of the specific rpcEngine (i.e. ethereum.ts/signEthereumRequests)
      await getAppConfig().rpcEngine.signer(
        payload,
        this.state,
        this.bindedSetState
      );
    } catch (error) {
      console.error(error);
      if (connector) {
        connector.rejectRequest({
          id: payload.id,
          error: { message: "Failed or Rejected Request" },
        });
      }
    }

    this.closeRequest();
    await this.setState({ connector });
  };

  public rejectRequest = async () => {
    const { connector, payload } = this.state;
    if (connector) {
      connector.rejectRequest({
        id: payload.id,
        error: { message: "Failed or Rejected Request" },
      });
    }
    await this.closeRequest();
    await this.setState({ connector });
  };

  public closeRequest = async () => {
    const { requests, payload } = this.state;
    this.setState({ transactionLoading: false });
    const filteredRequests = requests.filter(
      (request) => request.id !== payload.id
    );
    await this.setState({
      requests: filteredRequests,
      payload: null,
    });
  };

  public render() {
    const { peerMeta, connected, requests, payload, address, userAddress } =
      this.state;
    return (
      <>
        <h4>User's wallet</h4>
        <ConnectWallet />
        <UserWallet
          setUserAddress={(userAddress) => this.setState({ userAddress })}
        />
        <></>
        <hr />
        <h4>Club wallet</h4>
        <div>{address}</div>
        <br></br>
        {!connected ? (
          <>
            <input
              onChange={this.onURIPaste}
              placeholder="Paste wc uri"
            ></input>
            {
              // View to approve connection to dApp
              peerMeta && peerMeta.name && (
                <>
                  <p>{peerMeta.name}</p>
                  <p>{peerMeta.description}</p>
                  <button onClick={this.approveSession}>Approve</button>
                  <button>Rejects</button>
                </>
              )
            }
          </>
        ) : (
          <>
            {/* Show the dApp that is connected */}
            <h5>{"Connected to"}</h5>
            <img src={peerMeta.icons[0]} alt={peerMeta.name} />
            <div>{peerMeta.name}</div>
            <button onClick={this.killSession}>Disconnect</button>
            {!payload ? (
              requests.length !== 0 && (
                // Show the requests to the connector from connected dApp
                <div>
                  {requests.map((request, index) => (
                    <div key={request.id}>
                      <p>{request.method}</p>
                      <button onClick={() => this.openRequest(request)}>
                        Sign
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <>
                <hr />
                <Payload
                  payload={payload}
                  approveRequest={this.approveRequest}
                  rejectRequest={this.rejectRequest}
                  renderPayload={(payload: any) =>
                    getAppConfig().rpcEngine.render(payload)
                  }
                  appState={this.state}
                />
              </>
            )}
          </>
        )}
        <br></br>
        <br></br>
        <ClubWallet />
        <hr />
        <h4>Club tokens</h4>
        <TokenMinting
          sdkController={getAppControllers().thirdweb}
          sdk={getAppControllers().thirdweb.sdk}
          userAddress={userAddress}
        />
        <br></br>
        <br></br>
        <div></div>
      </>
    );
  }
}

export default App;
