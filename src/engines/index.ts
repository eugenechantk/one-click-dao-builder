import { IRpcEngine } from "../helpers/types";
import { IAppState } from "../App";
import ethereum from "./ethereum";

class RpcEngine implements IRpcEngine {
  public engines: IRpcEngine[];
  constructor(engines: IRpcEngine[]) {
    this.engines = engines;
  }

  // Return the filter transaction function of the specific engine to handle the request
  public filter(payload: any) {
    const engine = this.getEngine(payload);
    return engine.filter(payload);
  }

  // Return the route transaction function of the specific engine to handle the request
  public router(payload: any, state: IAppState, setState: any) {
    const engine = this.getEngine(payload);
    return engine.router(payload, state, setState);
  }

  // Return the render transaction function of the specific engine to handle the request
  public render(payload: any) {
    const engine = this.getEngine(payload);
    return engine.render(payload);
  }

  // Return the sign transaction function of the specific engine to handle the request
  public signer(payload: any, state: IAppState, setState: any) {
    const engine = this.getEngine(payload);
    return engine.signer(payload, state, setState);
  }

  // Get the rpcEngine that can handle the request parsed
  private getEngine(payload: any) {
    // Check if there is any rpc engine that can handle the request, using the filter function of the engines
    const match = this.engines.filter(engine => engine.filter(payload));
    if (!match || !match.length) {
      throw new Error(`No RPC Engine found to handle payload with method ${payload.method}`);
    }
    return match[0];
  }
}

export function getRpcEngine() {
  return new RpcEngine([ethereum]);
}
