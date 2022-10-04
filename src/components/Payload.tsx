import React, { useState, useEffect } from "react";
import { IAppState } from "../helpers/types";
import { IRequestRenderParams } from "../helpers/types";
import axios from "axios";

export interface IPayloadProps {
  payload: any;
  approveRequest: () => Promise<void>;
  rejectRequest: () => Promise<void>;
  renderPayload: (payload: any) => Promise<IRequestRenderParams[]>;
  appState: IAppState;
}

export interface IPayloadStates {
  params: IRequestRenderParams[];
  loading: boolean;
}

export class Payload extends React.Component<IPayloadProps, IPayloadStates> {
  constructor(props: any) {
    super(props);
    this.state = {
      params: [],
      loading: true,
    };
  }

  public componentDidMount() {
    this.init();
  }

  // Fetches the formatted object async
  public init = async () => {
    let params;
    const { renderPayload, payload } = this.props;
    params = await renderPayload(payload);
    this.setState({ params, loading: false });
  };

  public render() {
    const { params, loading } = this.state;
    const { approveRequest, rejectRequest, appState } = this.props;
    return (
      <>
        {!loading ? (
          // Render the params of the payload after payload is formatted async
          <div>
            <div>
              {params.map((param) => (
                <div key={param.label}>
                  <h4>{param.label}</h4>
                  <p>{param.value}</p>
                </div>
              ))}
            </div>
            <br></br>
            <button
              onClick={approveRequest}
              disabled={appState.transactionLoading}
            >
              Approve
            </button>
            <button
              onClick={rejectRequest}
              disabled={appState.transactionLoading}
            >
              Reject
            </button>
          </div>
        ) : (
          // Loading state to mount component while it waits for payload to format
          <>Loading transaction info</>
        )}
      </>
    );
  }
}
