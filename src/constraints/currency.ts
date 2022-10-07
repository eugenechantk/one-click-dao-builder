export interface ISupportedCurrency {
  name: string;
  symbol: string;
  currency_address: string;
}

export const SUPPORTED_CURRENCY: ISupportedCurrency[] = [
  {
    name: "USDC",
    symbol: "USDC",
    currency_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
];
