import { useAddress } from "@thirdweb-dev/react";
import React, { useEffect } from "react";
import { getAppControllers } from "../controllers";

export interface IUserWalletProps {
    setUserAddress: (userAddress: string) => void;
}

export const UserWallet = (props: IUserWalletProps) => {
    const address = useAddress();
    const { setUserAddress } = props;
    // const sdkAddress = getAppControllers().thirdweb.sdk.getSigner()?.getAddress();
    const [sdkAddress, setSdkAddress] = React.useState('');
    useEffect(() => {
        async function getSdkAddress () {
            const sdkAddress: string = String(await getAppControllers().thirdweb.sdk.getSigner()?.getAddress());
            setSdkAddress(sdkAddress);
        }
        getSdkAddress();
        setUserAddress(String(address));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address, sdkAddress]);
    return (
        <>
            <p>User's address: {address}</p>
            {/* <p>SDK's address: {sdkAddress}</p> */}
        </>
        
    )
}