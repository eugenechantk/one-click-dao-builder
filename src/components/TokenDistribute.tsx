import { SmartContract } from "@thirdweb-dev/sdk/dist/declarations/src/evm/contracts/smart-contract";
import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import { getAppControllers } from "../controllers";
import { IBalanceData } from "../controllers/wallet";

export interface IHolderBalanceInfo {
  balance: BigNumber;
  power: BigNumber;
  share: { tokenAddress: string | undefined; value: BigNumber }[];
}

export const TokenDistribute = () => {
  const [clubTokenAddress, setClubTokenAddress] = useState("");
  const [contract, setContract] = useState({} as SmartContract);
  const [walletBalance, setWalletBalance] = useState([] as IBalanceData[]);
  const [holderBalance, setHolderBalance] = useState(
    {} as { [k: string]: IHolderBalanceInfo }
  );
  const [tokenSupply, setTokenSupply] = useState(0);
  // Multiplying factor used to calculate claimPower and member's share on the tokens in the club wallet
  const mulFactor = BigNumber.from("1000000");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAddress = async () =>
      await getAppControllers()
        .thirdweb.getClubTokenAddress()
        .then((address) => {
          const formattedAddress = address.replace(/['"]+/g, "");
          setClubTokenAddress(formattedAddress);
        });
    fetchAddress();
    getWalletBalance();
  }, []);

  useEffect(() => {
    const fetchContract = async () => {
      await getAppControllers()
        .thirdweb.sdk.getContract(clubTokenAddress)
        .then((contract) => {
          setContract(contract);
        });
    };
    fetchContract();
  }, [clubTokenAddress]);

  const getWalletBalance = async () => {
    const balance = await getAppControllers().wallet.getAllBalance();
    setWalletBalance(balance);
  };

  const getAllHolder = async () => {
    let _holderBalance: { [k: string]: IHolderBalanceInfo } = {};

    // Fetch all the events related to this club token contract
    const events = await contract.events.getAllEvents();
    // Return only transfer events
    const transferEvent = events.filter((event) => {
      return event.eventName === "Transfer";
    });
    // Reverse the transfer events, because the events are ordered by latest to earliest
    transferEvent.reverse();
    console.log(transferEvent);

    // Function to populate the holderBalance dict
    transferEvent.forEach((event) => {
      // Add the addresses if they are not already in the holder-balance dictionary
      if (!(event.data.from in _holderBalance)) {
        _holderBalance[event.data.from] = {
          balance: BigNumber.from(0),
          power: BigNumber.from(0),
          share: [],
        };
      }
      if (!(event.data.to in _holderBalance)) {
        _holderBalance[event.data.to] = {
          balance: BigNumber.from(0),
          power: BigNumber.from(0),
          share: [],
        };
      }
      // Update the value of each balance
      _holderBalance[event.data.from].balance = _holderBalance[
        event.data.from
      ].balance.sub(event.data.value);
      _holderBalance[event.data.to].balance = _holderBalance[
        event.data.to
      ].balance.add(event.data.value);
    });
    // remove the balance of the root address
    delete _holderBalance["0x0000000000000000000000000000000000000000"];
    return _holderBalance;
  };

  const getClaimPower = async (_holderBalance: {
    [k: string]: IHolderBalanceInfo;
  }) => {
    const totalSupply = await contract.erc20.totalSupply();
    Object.entries(_holderBalance).forEach(([address, value]) => {
      const { balance } = value;
      // In order to return a BigNumber when balance/totalSupply, I have to multiply the balance by a factor such thatn balance >> totalSupply
      // When calculating the member's share on each token, I will divide the share by the multiplying factor
      _holderBalance[address].power = balance
        .mul(mulFactor)
        .div(totalSupply.value);
    });
    return _holderBalance;
  };

  const getTokenShareBalance = (
    _holderBalance: { [k: string]: IHolderBalanceInfo }
  ) => {
    Object.entries(_holderBalance).forEach(([address, value]) => {
      const power = _holderBalance[address].power;
      let _distribution: {
        tokenAddress: string | undefined;
        value: BigNumber;
      }[] = [];
      walletBalance.forEach((token) => {
        const share = BigNumber.from(token.balance).mul(power).div(mulFactor);
        _distribution.push({ tokenAddress: token.token_address, value: share });
        _holderBalance[address].share = _distribution;
      });
    });
    return _holderBalance;
  };

  const claimToken = async () => {
    setLoading(true);
    const _holderBalance = await getAllHolder();
    const _claimPowerBalance = await getClaimPower(_holderBalance);
    const _distibutionBalance = await getTokenShareBalance(_claimPowerBalance);
    setHolderBalance(_distibutionBalance);
    setLoading(false);
  };

  return (
    <>
      <p>Token Distribute</p>
      <button onClick={() => claimToken()} disabled={loading}>See claim power</button>
    </>
  );
};
