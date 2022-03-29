import { useState, useEffect } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import './App.css';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';


const PROVIDER_URL = 'wss://frost-rpc.icenetwork.io:9944';

function App() {
  const [api, setApi] = useState(null);
  const [accounts, setAccounts] = useState([]);

  const extensionSetup = async () => {
    const extension = await web3Enable('polkadot-client-app');
    if(extension.length === 0) {
      console.log('No extension Found');
      return;
    }
    let acc = await web3Accounts();
    setAccounts(acc);

  }

  const setup = async () => {
    try {
      const wsProvider = new WsProvider(PROVIDER_URL);
      const _api = await ApiPromise.create({ provider: wsProvider });
      setApi(_api);
      if(_api) {
        console.log('Connection Success');
      }
      await extensionSetup();
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    setup();
  },[])
  return (
    <div className="App">
      Polkadot app
      <button onClick={() => console.log(api)}>Click</button>
    </div>
  );
}

export default App;
