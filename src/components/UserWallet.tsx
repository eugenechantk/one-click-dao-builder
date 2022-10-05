import { useAddress } from "@thirdweb-dev/react";
import React, { useEffect } from "react";
import { getAppControllers } from "../controllers";

export const UserWallet = () => {
    const address = useAddress();
    // const sdkAddress = getAppControllers().thirdweb.sdk.getSigner()?.getAddress();
    const [sdkAddress, setSdkAddress] = React.useState('');
    useEffect(() => {
        async function getSdkAddress () {
            const sdkAddress: string = String(await getAppControllers().thirdweb.sdk.getSigner()?.getAddress());
            setSdkAddress(sdkAddress);
        }
        getSdkAddress();
    }, [address]);
    return (
        <>
            <p>User's address: {address}</p>
            <p>SDK's address: {sdkAddress}</p>
        </>
        
    )
}