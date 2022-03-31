import { useState, useEffect, useRef } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import './App.css';
import { web3Accounts, web3Enable, web3FromSource } from '@polkadot/extension-dapp';
import abi from './metadata.json';
import { ContractPromise } from '@polkadot/api-contract';


const PROVIDER_URL = 'wss://frost-rpc.icenetwork.io:9944';
const CONTRACT_ADDRESS = '5FZ4bns2YnroQYjGXPCTG2CxitiZeYK9LeU5KnkLEeSC49jz';

function App() {
  const [api, setApi] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [token, setToken] = useState({});
  const [userLogin, setUserLogin] = useState(false);
  const [userWallet, setUserWallet] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState('');
  const [inputParam, setInputParam] = useState({
    ownerAddress: '',
    spenderAddress: '',
    checkBalanceAddress: '',
    targetAddress: '',
    approveAddress: '',
    transferFromAddress: '',
    transferToAddress: '',
    transferAmount: 0,
    approveAmount: 0,
    transferFromAmount: 0
  })

  const { ownerAddress,spenderAddress, checkBalanceAddress, targetAddress, approveAddress, transferFromAmount, transferFromAddress, transferToAddress, approveAmount, transferAmount } = inputParam;


 

  const handleChange = (e) => {
    setInputParam({
      ...inputParam,
      [e.target.name]: e.target.value
    })
  }

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
    console.log(contract);
    setContract(contract);
    setAccounts(acc);

  }

  const login = (e) => {
    console.log(e.target.value)
    setUserWallet(e.target.value);
    setUserLogin(true);
  }

  const setup = async () => {
    try {
      const wsProvider = new WsProvider(PROVIDER_URL);
      const _api = await ApiPromise.create({ provider: wsProvider });
      if(_api) {
        console.log('Connection Success');
        setApi(_api);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const gasLimit = 20000n * 1000000n;
  const value = 0;

  const getTokenName = async () => {
    setLoading('Reading...');
    const {result,output} = await contract.query.name(userWallet,{ value, gasLimit });
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
    const {result,output} = await contract.query.symbol(userWallet,{ value, gasLimit });
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
    const {result,output} = await contract.query.totalSupply(userWallet,{ value, gasLimit });
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
  const getAllowance = async () => {
    try {
      setLoading('Reading...');
      const {result,output} = await contract.query.allowance(userWallet,{ value, gasLimit },ownerAddress, spenderAddress);
      if(result.isOk){
        setToken({
          ...token,
          allowance: output.toHuman()
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
  const getBalance = async () => {
    try {
      console.log(checkBalanceAddress, 'Bal')
      setLoading('Reading...');
      const {result,output} = await contract.query.balanceOf(userWallet,{value, gasLimit: -1}, checkBalanceAddress);
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
      console.log(transferAmount,":amt");
      console.log("add:",targetAddress)
      setLoading('Executing...');
      const fromAcc = accounts.find(a => a.address === userWallet);
      console.log(fromAcc)
      const injector = await web3FromSource(fromAcc.meta.source);
      await contract.tx.transfer({value, gasLimit}, targetAddress, transferAmount).signAndSend(fromAcc.address, {signer: injector.signer}, ({status}) => {
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

  const approve = async () => {
    try {
      setLoading('Executing...');
      const fromAcc = accounts.find(a => a.address === userWallet);
      const injector = await web3FromSource(fromAcc.meta.source);
      await contract.tx.approve({value, gasLimit},approveAddress, approveAmount).signAndSend(fromAcc.address, {signer: injector.signer}, ({status}) => {
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

  const transferFrom = async () => {
    try {
      setLoading('Executing...');
      const fromAcc = accounts.find(a => a.address === userWallet);
      const injector = await web3FromSource(fromAcc.meta.source);
      await contract.tx.transferFrom({value, gasLimit}, transferFromAddress, transferToAddress, transferFromAmount).signAndSend(fromAcc.address, {signer: injector.signer}, ({status}) => {
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
        <>
          <p>Select the account to login</p>
          <select onChange={login}>
            <option value="">Select Account</option>
            {accounts.map((account,idx) => (
              <option key={idx} value={account.address}>{account.address}</option>
            ))}
          </select>
        </>
      ): (
        <button disabled={!api ? true : false} onClick={extensionSetup}>Login</button>
      )}
      {userLogin && (
        <p>Polkadot Wallet Address: <strong>{userWallet}</strong></p>
      )}
      {loading.length !== 0 && (
          <span>{loading}</span>
      )}
      {userLogin && (
        <div className="methods">
          <div className="method name">
            <h3>Name</h3>
            <button disabled={!api ? true : false} onClick={getTokenName}>Read</button>
            <p>{token?.name}</p>
          </div>
          <div className="method symbol">
            <h3>Symbol</h3>
            <button disabled={!api ? true : false} onClick={getTokenSymbol}>Read</button>
            <p>{token?.symbol}</p>
          </div>
          <div className="method supply">
            <h3>Total Supply</h3>
            <button disabled={!api ? true : false} onClick={getTotalSupply}>Read</button>
            <p>{token?.totalSupply}</p>
          </div>
          <div className="method allowance">
            <h3>Allowance</h3>
            <input type="text" placeholder='Enter owner address' name='ownerAddress' value={ownerAddress} onChange={handleChange}  />
            <input type="text" placeholder='Enter spender address' name='spenderAddress' value={spenderAddress} onChange={handleChange}  />
            <button disabled={!api ? true : false} onClick={getAllowance}>Read</button>
            <p>{token?.allowance}</p>
          </div>
          <div className="method balaceOf">
            <h3>Check Balance</h3>
            <input type="text" placeholder='Enter wallet address' name='checkBalanceAddress' value={checkBalanceAddress} onChange={handleChange}  />
            <button disabled={!api ? true : false} onClick={getBalance}>Read</button>
            <p>{token?.balance}</p>
          </div>
          <div className="method transfer">
            <h3>Transfer</h3>
            <input type="text" placeholder='Enter target address' name='targetAddress'  value={targetAddress} onChange={handleChange} />
            <input type="number" placeholder='Enter amount' name='transferAmount'  value={transferAmount} onChange={handleChange}  />
            <button disabled={!api ? true : false} onClick={transfer}>Execute</button>
          </div>
          <div className="method approve">
            <h3>Approve</h3>
            <input type="text" placeholder='Enter spender address' name='approveAddress'  value={approveAddress} onChange={handleChange}  />
            <input type="number" placeholder='Enter amount' name='approveAmount'  value={approveAmount} onChange={handleChange}  />
            <button disabled={!api ? true : false} onClick={approve}>Execute</button>
          </div>
          <div className="method transferFrom">
            <h3>Transfer from</h3>
            <input type="text" placeholder='From address' name='transferFromAddress'  value={transferFromAddress} onChange={handleChange}  />
            <input type="text" placeholder='to address' name='transferToAddress'  value={transferToAddress} onChange={handleChange}  />
            <input type="number" placeholder='Enter amount' name='transferFromAmount'  value={transferFromAmount} onChange={handleChange}  />
            <button disabled={!api ? true : false} onClick={transferFrom}>Execute</button>
          </div>
      </div>
      )}
    </div>
  );
}

export default App;
