import { useState, useEffect, useRef } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import './App.css';
import { web3Accounts, web3Enable, web3FromSource } from '@polkadot/extension-dapp';
import abi from './metadata.json';
import { ContractPromise } from '@polkadot/api-contract';

console.log(abi);

const PROVIDER_URL = 'wss://frost-rpc.icenetwork.io:9944';

function App() {
  const [api, setApi] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [token, setToken] = useState({});
  const [userLogin, setUserLogin] = useState(false);
  const [contract, setContract] = useState(null);
  const [methods, setMethods] = useState([]);
  const [hash, setHash] = useState({});
  const [loading, setLoading] = useState('');
  const addressRef = useRef(null);
  const targetAddressRef = useRef(null);
  const transferAmountRef = useRef(null);

  const CONTRACT_ADDRESS = '5FZ4bns2YnroQYjGXPCTG2CxitiZeYK9LeU5KnkLEeSC49jz';

  const extensionSetup = async () => {
    const extension = await web3Enable('polkadot-client-app');
    if(extension.length === 0) {
      console.log('No extension Found');
      return;
    }
    let acc = await web3Accounts();
    // initialize contract
    const contractAddress = CONTRACT_ADDRESS;
    const contract = new ContractPromise(api, abi, contractAddress );
    console.log(contract)
    setMethods(abi.messages);
    setContract(contract);
    setAccounts(acc);
    setUserLogin(true);

  }

  const setup = async () => {
    try {
      const wsProvider = new WsProvider(PROVIDER_URL);
      const _api = await ApiPromise.create({ provider: wsProvider });
      setApi(_api);
      if(_api) {
        console.log('Connection Success');
      }
    } catch (error) {
      console.log(error);
    }
  }

  const gasLimit = 20000n * 1000000n;
  const value = 0;

  const getTokenName = async () => {
    setLoading('Reading...');
    const {result,output} = await contract.query.name('',{ value, gasLimit });
    if(result.isOk){
      setToken({
        ...token,
        name: output.toHuman()
      });
      setLoading('');
    } else {
      setLoading('');
      console.log('Error:', result.asErr);
    }
  }
  const getTokenSymbol = async () => {
    setLoading('Reading...');
    const {result,output} = await contract.query.symbol('',{ value, gasLimit });
    if(result.isOk){
      setToken({
        ...token,
        symbol: output.toHuman()
      })
      setLoading('');
    } else {
      setLoading('');
      console.log('Error:', result.asErr);
    }
  }

  const getTotalSupply = async () => {
    setLoading('Reading...');
    const {result,output} = await contract.query.totalSupply('',{ value, gasLimit });
    if(result.isOk){
      setToken({
        ...token,
        totalSupply: output.toHuman()
      })
      setLoading('');
    } else {
      setLoading('');
      console.log('Error:', result.asErr);
    }
  }
  const getBalance = async () => {
    try {
      setLoading('Reading...');
      const {result,output} = await contract.query.balanceOf(accounts[0].address,{value, gasLimit: -1}, addressRef.current.value);
      if(result.isOk){
        setToken({
          ...token,
          balance: output.toHuman()
        })
        setLoading('');
      } else {
        setLoading('');
        console.log('Error:', result.asErr);
      }
    } catch (error) {
      setLoading('');
      console.log(error)
    }
    
  }
  const transfer = async () => {
    try {
      setLoading('Executing...');
      const injector = await web3FromSource(accounts[0].meta.source);
      await contract.tx.transfer({value, gasLimit}, targetAddressRef.current.value, transferAmountRef.current.value).signAndSend(accounts[0].address, {signer: injector.signer}, ({status}) => {
        if(status.isFinalized) {
          console.log(`Finalized. Block hash: ${status.asFinalized.toString()}`);
          setLoading('');
        } else {
          console.log(`Current transaction status: ${status.type}`);
        }
      })
    } catch (error) {
      setLoading('');
      console.log(error)
    }
    
  }

  useEffect(() => {
    setup();
  },[])
  return (
    <div className="App">
      <h3>ERC20 Token</h3>
      {accounts.length !== 0 ? (
        <p>Polkadot Wallet Address: <strong>{accounts[0].address}</strong></p>
      ): (
        <button disabled={!api ? true : false} onClick={extensionSetup}>Login</button>
      )}
      {loading.length !== 0 && (
          <span>{loading}</span>
      )}
      {userLogin && (
        <div className="methods">
        <div className="method name">
          <button disabled={!api ? true : false} onClick={getTokenName}>Name</button>
          <p>{token?.name}</p>
        </div>
        <div className="method symbol">
          <button disabled={!api ? true : false} onClick={getTokenSymbol}>Symbol</button>
          <p>{token?.symbol}</p>
        </div>
        <div className="method supply">
          <button disabled={!api ? true : false} onClick={getTotalSupply}>Total Supply</button>
          <p>{token?.totalSupply}</p>
        </div>
        <div className="method balaceOf">
          <input type="text" placeholder='Enter wallet address' ref={addressRef} />
          <button disabled={!api ? true : false} onClick={getBalance}>get Balance</button>
          <p>{token?.balance}</p>
        </div>
        <div className="method transfer">
          <input type="text" placeholder='Enter target address' ref={targetAddressRef} />
          <input type="number" placeholder='Enter amount' ref={transferAmountRef} />
          <button disabled={!api ? true : false} onClick={transfer}>transfer</button>
        </div>
      </div>
      )}
    </div>
  );
}

export default App;
