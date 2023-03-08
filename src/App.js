import React, { useEffect, useState, useCallback } from "react";
import './styles/App.css';
import w3upLogo from './assets/w3uplogo.svg';
import logo from './assets/logo.png';
import { ethers } from "ethers";
import { domainsAbi, domainsAddress } from "./utils/constants";
import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks';


const tld = '.w3';
const CONTRACT_ADDRESS = '0x4D71207a07406ab6cedA03f8E7e7bE3eB30bECe0';

const App = () => {
  const [currentAccount, setCurrentAccount] = useState('');
  const [domain, setDomain] = useState('');
  const [record, setRecord] = useState('');
  const [network, setNetwork] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mints, setMints] = useState([]);


  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        // Try to switch to the Mumbai testnet
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x89" }], // Check networks.js for hexadecimal network ids
        });
      } catch (error) {
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x89",
                  chainName: "Polygon Mainnet",
                  rpcUrls: ["https://polygon-rpc.com/"],
                  nativeCurrency: {
                    name: "Matic",
                    symbol: "MATIC",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://polygonscan.com/"],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      alert(
        "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
      );
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Make sure you have metamask!');
      return;
    } else {
      console.log('We have the ethereum object', ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });
    const isConnected = await ethereum.isConnected();

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log('Found an authorized account:', account);
      setCurrentAccount(account);
    } else {
      console.log('No authorized account found');
    }

    const chainId = await ethereum.request({ method: 'eth_chainId' });
    setNetwork(networks[chainId]);

    ethereum.on('chainChanged', handleChainChanged);

    function handleChainChanged(_chainId) {
      window.location.reload();
    }
  };

  const mintDomain = async () => {
    if (!domain) {
      return;
    }
    // // Alert the user if the domain is too short
    if (domain.length < 3) {
      alert("Domain must be at least 3 characters long");
      return;
    }

    if (domain.length > 10) {
      alert("Domain must be less than 10 characters long");
      return;
    }
    // Calculate price based on length of domain (change this to match your contract)
    // 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
    const price =
      domain.length === 3 ? "50" : domain.length === 4 ? "30" : "10";
    console.log("Minting domain", domain, "with price", price);


    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          domainsAbi,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");

        let tx = await contract.register(domain, {
          value: ethers.utils.parseEther(price),
        });

        const receipt = await tx.wait();

        if (receipt.status === 1) {
          console.log(
            "Domain minted! https://polygonscan.com/tx/" + tx.hash
          );

          tx = await contract.setRecord(domain, record);
          await tx.wait();

          console.log(
            "Record set! https://polygonscan.com/tx/" + tx.hash
          );

          setTimeout(() => {
            fetchMints();
          }, 2000);

          setRecord("");
          setDomain("");
        } else {
          alert("Transaction failed! Please try again");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateDomain = async () => {
    if (!record || !domain) {
      return;
    }
    setLoading(true);
    console.log("Updating domain", domain, "with record", record);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          domainsAbi,
          signer
        );

        let tx = await contract.setRecord(domain, record);
        await tx.wait();
        console.log("Record set https://polygonscan.com/tx/" + tx.hash);

        fetchMints();
        setRecord("");
        setDomain("");
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const renderNotConnectedContainer = () => (
    <div className="connect-wallet-container">
      <center><strong><h1>Mint your <span class="w3" data-v-0948da16>.w3</span> web3 username!</h1></strong></center>
      <br />
      <button onClick={connectWallet} className="cta-button connect-wallet-button">
        Connect Wallet
      </button>



      <span className="Costs">

        <br />
        <br />
        <strong><p>All profits go to fund public goods on Polygon by <span class="w3" data-v-0948da16>#W3UPDAO</span>.</p></strong>
        <></>
        <br />
        <br />
        <br />
        <br />
        <center><div className="floating">
          <div className="w3up-logo">
            <img alt="W3UP" className="w3up-logo" src={w3upLogo} />
          </div>
        </div></center>
        <br />
        <br />
        <br />
        <br />
        <p className="subtitle"> <strong><span class="w3" data-v-0948da16>.w3</span> domain price:</strong></p>
        <br />
        <table class="table table-borderless table-ppl" data-v-0948da16>
          <thead class="table-light" data-v-0948da16>
            <tr data-v-0948da16>
              <th scope="col" data-v-0948da16>Name length</th>
              <th scope="col" data-v-0948da16>Price</th>
            </tr>
          </thead>
          <tbody data-v-0948da16>
            <tr data-v-0948da16>
              <td data-v-0948da16>3 characters</td>
              <td data-v-0948da16>50 MATIC</td>
            </tr>
            <tr data-v-0948da16>
              <td data-v-0948da16>4 characters</td>
              <td data-v-0948da16>30 MATIC</td>
            </tr>
            <tr data-v-0948da16>
              <td data-v-0948da16>5+ characters</td>
              <td data-v-0948da16>10 MATIC</td>
            </tr>
          </tbody>
        </table>
      </span>
    </div>
  );

  const renderInputForm = () => {

    if (network !== 'Polygon Mainnet') {
      return (
        <div className="connect-wallet-container">
          <h2>Please switch to Polygon</h2>
          <button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
        </div>
      );
    }

    return (
      <div className="form-container">
        <center><strong><h1>Mint your <span class="w3" data-v-0948da16>.w3</span> web3 username!</h1></strong></center>
        <div className="first-row">
          <input
            type="text"
            value={domain}
            placeholder='Desired Username'
            onChange={e => setDomain(e.target.value)}
          />
          <p className='tld'> {tld} </p>
        </div>


        {/* If the editing variable is true, return the "Set record" and "Cancel" button */}
        {editing ? (
          <div className="button-container">
            {/* This will call the updateDomain function we just made */}
            <button
              className="cta-button mint-button"
              disabled={loading}
              onClick={updateDomain}
            >
              Set record
            </button>
            {/* This will let us get out of editing mode by setting editing to
            false */}
            <button
              className="cta-button mint-button"
              onClick={() => {
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          // If editing is not true, the mint button will be returned instead
          <button
            className="cta-button mint-button"
            disabled={loading}
            onClick={mintDomain}
          >
            Mint
          </button>
        )}{""}
        <span className="Costs">

          <br />
          <strong><p>All profits go to fund public goods on Polygon by <span class="w3" data-v-0948da16>#W3UPDAO</span>.</p></strong>
          <></>
          <br />
          <br />
          <p className="subtitle"> <strong><span class="w3" data-v-0948da16>.w3</span> domain price:</strong></p>
          <br />
          <table class="table table-borderless table-ppl" data-v-0948da16>
            <thead class="table-light" data-v-0948da16>
              <tr data-v-0948da16>
                <th scope="col" data-v-0948da16>Name length</th>
                <th scope="col" data-v-0948da16>Price</th>
              </tr>
            </thead>
            <tbody data-v-0948da16>
              <tr data-v-0948da16>
                <td data-v-0948da16>3 characters</td>
                <td data-v-0948da16>50 MATIC</td>
              </tr>
              <tr data-v-0948da16>
                <td data-v-0948da16>4 characters</td>
                <td data-v-0948da16>30 MATIC</td>
              </tr>
              <tr data-v-0948da16>
                <td data-v-0948da16>5+ characters</td>
                <td data-v-0948da16>10 MATIC</td>
              </tr>
            </tbody>
          </table>
          <br />
          <br />
          <strong><p><span class="w3" data-v-0948da16>W3UP</span> Protocol is a distributed, open, and scalable naming system based on EVM blockchain.</p></strong>
          <strong><p>More infos ➜ <span class="w3" data-v-0948da16><a href='https://docs.w3up.cc/' target="_blank">Read W3UP Docs</a></span> 📚</p></strong>
        </span>
      </div>

    );
  };



  const fetchMints = useCallback(async () => {
    try {
      const { ethereum } = window;
      if (ethereum && currentAccount) {
        // You know all this
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          domainsAbi,
          signer
        );

        // Get all the domain names from our contract
        const names = await contract.getAllNames();

        // For each name, get the record and the address
        const mintRecords = await Promise.all(
          names.map(async (name) => {
            const mintRecord = await contract.records(name);
            const owner = await contract.domains(name);
            return {
              id: names.indexOf(name),
              name: name,
              record: mintRecord,
              owner: owner,
            };
          })
        );

        console.log("MINTS FETCHED ", mintRecords);
        setMints(mintRecords);
      }
    } catch (error) {
      console.log(error);
    }
  }, [currentAccount]);

  // This will run any time currentAccount or network are changed
  useEffect(() => {
    if (network === "Polygon Mainnet") {
      fetchMints();
    }
  }, [currentAccount, network, fetchMints]);

  // This runs our function when the page loads.
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <header>
            <div className="left">
              <img alt="W3UP" className="wlogo" src={logo} />
            </div>

            <div className="right">
              <img alt="Network logo" className="logo" src={network?.includes("Polygon Mainnet") ? polygonLogo : ethLogo} />
              {currentAccount ? (
                <a
                  className="link"
                  href={`https://polygonscan.com/address/${currentAccount}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <p className="underlined">
                    {" "}
                    {currentAccount.slice(0, 6)}...
                    {currentAccount.slice(-4)}{" "}
                  </p>
                </a>
              ) : (
                <p> Not connected </p>
              )}
            </div>
          </header>
        </div>

        {!currentAccount && renderNotConnectedContainer()}
        {currentAccount && renderInputForm()}



        <div className="footer-container">
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          {/* <div className="floating">
            <div className="w3up-logo">
              <img alt="W3UP" className="w3up-logo" src={w3upLogo} />
            </div>
          </div> */}
        </div>
      </div>
      <div class="footer">
        <a href='https://twitter.com/W3UPcc' target="_blank">Twitter</a> | <a href='https://github.com/W3UP' target="_blank">Github</a> | <a href='https://docs.w3up.cc/' target="_blank">Docs</a> | <a href='https://opensea.io/collection/w3ns' target="_blank">Market</a> | <a href='https://polygonscan.com/address/0x4d71207a07406ab6ceda03f8e7e7be3eb30bece0' target="_blank">Polygonscan</a>
      </div>
    </div>
  );
};

export default App;
