import { useEffect, useState } from "react";
import { getAppControllers } from "../controllers";
import { IBalanceData } from "../controllers/wallet";

export const SplitBalance = (props: any) => {
  const [balance, setBalance] = useState<IBalanceData[]>([]);
  const fetchBalance = async () => {
    const newBalance = await getAppControllers().wallet.getAllBalance(
      props.address
    );
    setBalance(newBalance);
    // Comment this out if I want to update wallet balance regularly
    // setTimeout(fetchBalance, 3000);
  };

  useEffect(() => {
    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.address]);

  return (
    <>
      <p>Split Balance</p>
      <>{JSON.stringify(balance)}</>
    </>
  );
};
