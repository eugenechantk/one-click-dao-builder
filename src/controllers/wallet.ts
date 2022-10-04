import * as ethers from "ethers";
import * as ethSigUtil from "eth-sig-util";
import { getChainData } from "../helpers/utilities";
import { 
  DEFAULT_CHAIN_ID
 } from "../constraints/default";
import { getAppConfig } from "../config";

export class WalletController {
  // public path: string;
  // public entropy: string;
  public mnemonic: string;
  public wallet: ethers.Wallet;
  public activeChainId: number = DEFAULT_CHAIN_ID;

  constructor() {
    // this.path = this.getPath();
    // this.entropy = this.getEntropy();
    this.mnemonic = this.getMnemonic();
    this.wallet = this.init();
  }

  get provider(): ethers.providers.Provider {
    return this.wallet.provider;
  }

  public isActive() {
    if (!this.wallet) {
      return this.wallet;
    }
    return null;
  }

  public getWallet(chainId?: number): ethers.Wallet {
    if (!this.wallet || this.activeChainId === chainId) {
      return this.init(chainId);
    }
    return this.wallet;
  }

  public getAccounts(count = getAppConfig().numberOfAccounts) {
    const accounts = [];
    let wallet = null;
    for (let i = 0; i < count; i++) {
      wallet = this.generateWallet();
      accounts.push(wallet.address);
    }
    return accounts;
  }

  // HELPER FUNCTIONS: generate entropy and mnemonic and put that in localStorage, and then fetch those from localStorage
  //
  // public getData(key: string): string {
  //   // let value = getLocal(key);
  //   // if (!value) {
  //   //   switch (key) {
  //   //     case ENTROPY_KEY:
  //   //       value = this.generateEntropy();
  //   //       break;
  //   //     case MNEMONIC_KEY:
  //   //       value = this.generateMnemonic();
  //   //       break;
  //   //     default:
  //   //       throw new Error(`Unknown data key: ${key}`);
  //   //   }
  //   setLocal(key, value);
  //   return value;
  // }
  //
  // public generateEntropy(): string {
  //   this.entropy = ethers.utils.hexlify(ethers.utils.randomBytes(16));
  //   return this.entropy;
  // }

  // public generateMnemonic() {
  //   this.mnemonic = ethers.utils.entropyToMnemonic(this.getEntropy());
  //   return this.mnemonic;
  // }

  // HELPER FUNCTION: To generate the derivation path for multiple wallet
  // public getPath(index: number = this.activeIndex) {
  //   this.path = `${getAppConfig().derivationPath}/${index}`;
  //   return this.path;
  // }

  public generateWallet() {
    this.wallet = ethers.Wallet.fromMnemonic(this.getMnemonic());
    return this.wallet;
  }

  // HELPER FUNCTION: get entropy in order to generate the mnemonic for the wallet
  // public getEntropy(): string {
  //   // TODO: change this to get the entropy from club record
  //   this.entropy = String(process.env.REACT_APP_ENTROPY);
  //   return this.entropy;
  // }

  public getMnemonic(): string {
    // TODO: change this to get the mnemonic from club record
    this.mnemonic = String(process.env.REACT_APP_MNEMONIC);
    return this.mnemonic;
  }

  public init(chainId = DEFAULT_CHAIN_ID): ethers.Wallet {
    return this.update(chainId);
  }

  public update(chainId: number): ethers.Wallet {
    const firstUpdate = typeof this.wallet === "undefined";
    this.activeChainId = chainId;
    // fetch the right rpcUrl that is supported by Infura
    const rpcUrl = getChainData(chainId).rpc_url;
    const wallet = this.generateWallet();
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.wallet = wallet.connect(provider);
    if (!firstUpdate) {
      // update another controller if necessary here
    }
    return this.wallet;
  }

  public async populateTransaction(transaction: any) {
    let tx = Object.assign({}, transaction);
    if (this.wallet) {
      if (tx.gas) {
        tx.gasLimit = tx.gas;
        delete tx.gas;
      }
      if (tx.from) {
        tx.from = ethers.utils.getAddress(tx.from);
      }

      try {
        tx = await this.wallet.populateTransaction(tx);
        tx.gasLimit = ethers.BigNumber.from(tx.gasLimit).toHexString();
        if (tx.gasPrice) {
          tx.gasPrice = ethers.BigNumber.from(tx.gasPrice).toHexString();
        }
        if (tx.maxFeePerGas) {
          tx.maxFeePerGas = ethers.BigNumber.from(tx.maxFeePerGas).toHexString();
        }
        if (tx.maxPriorityFeePerGas) {
          tx.maxPriorityFeePerGas = ethers.BigNumber.from(tx.maxPriorityFeePerGas).toHexString();
        }
        tx.nonce = ethers.BigNumber.from(tx.nonce).toHexString();
      } catch (err) {
        console.error("Error populating transaction", tx, err);
      }
    }

    return tx;
  }

  public async sendTransaction(transaction: any) {
    if (this.wallet) {
      if (
        transaction.from &&
        transaction.from.toLowerCase() !== this.wallet.address.toLowerCase()
      ) {
        console.error("Transaction request From doesn't match active account");
      }

      if (transaction.from) {
        delete transaction.from;
      }

      // ethers.js expects gasLimit instead
      if ("gas" in transaction) {
        transaction.gasLimit = transaction.gas;
        delete transaction.gas;
      }

      const result = await this.wallet.sendTransaction(transaction);
      return result.hash;
    } else {
      console.error("No Active Account");
    }
    return null;
  }

  public async signTransaction(data: any) {
    if (this.wallet) {
      if (data && data.from) {
        delete data.from;
      }
      data.gasLimit = data.gas;
      delete data.gas;
      const result = await this.wallet.signTransaction(data);
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
  }

  public async signMessage(data: any) {
    if (this.wallet) {
      const signingKey = new ethers.utils.SigningKey(this.wallet.privateKey);
      const sigParams = await signingKey.signDigest(ethers.utils.arrayify(data));
      const result = await ethers.utils.joinSignature(sigParams);
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
  }

  public async signPersonalMessage(message: any) {
    if (this.wallet) {
      const result = await this.wallet.signMessage(
        ethers.utils.isHexString(message) ? ethers.utils.arrayify(message) : message,
      );
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
  }

  public async signTypedData(data: any) {
    if (this.wallet) {
      const result = ethSigUtil.signTypedData(Buffer.from(this.wallet.privateKey.slice(2), "hex"), {
        data: JSON.parse(data),
      });
      return result;
    } else {
      console.error("No Active Account");
    }
    return null;
  }
}

export function getWalletController() {
  return new WalletController();
}
