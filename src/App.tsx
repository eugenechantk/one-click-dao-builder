import { ConnectWallet } from "@thirdweb-dev/react";
import { Magic } from 'magic-sdk';
import { ConnectExtension } from '@magic-ext/connect';

const App = () => {
  
  const magic = new Magic('pk_live_257001A814ED44DA', {
    extensions: [new ConnectExtension()],
    network: "rinkeby",
  });

  return (
    <>
      <ConnectWallet accentColor="#f213a4" colorMode="light" />
    </>
  )
}

export default App;