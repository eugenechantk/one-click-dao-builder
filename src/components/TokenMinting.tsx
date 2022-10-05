import React from "react";
import { getSdkAddress } from "../controllers/token";

export class TokenMinting extends React.Component {

    componentDidMount(): void {
        this.init();
    }

    public init () {
        getSdkAddress();
    }

    render () {
        return (
            <>
                Token minting section
            </>    
        )
    }
}