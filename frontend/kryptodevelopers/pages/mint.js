import { useCallback, useEffect, useState } from 'react';
import Web3 from 'web3';
import { ABI } from '../config.js';
import Base from '../components/Base';
import Button from '../components/Button';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const EXPLORER = process.env.NEXT_PUBLIC_EXPLORER;
const CONTRACT_NETWORK = process.env.NEXT_PUBLIC_NETWORK;

export default function Mint() {
    const [signedIn, setSignedIn] = useState(false);
    const [mintLoading, setMintLoading] = useState(false);
    const [walletAddress, setWalletAddress] = useState(null);
    const [totalSupply, setTotalSupply] = useState(0);
    const [saleStatus, setSaleStatus] = useState(false);
    const [contract, setContract] = useState(null);
    const [developersMintQtty, setDevelopersMintQtty] = useState(1);
    const [developerPrice, setDeveloperPrice] = useState(0);
    const [ownedTokens, setOwnedTokens] = useState([]);
    const [tokensLinks, setTokensLinks] = useState([]);
    const [balance, setBalance] = useState(0);
    const [transactionHash, setTransactionHash] = useState(null);

    useEffect(async () => {
        signIn();
    }, []);

    useEffect(() => {
        if (walletAddress) {
            loadOwnedTokens();
        }
    }, [walletAddress]);

    const loadOwnedTokens = async () => {
        const balance = await contract.methods.balanceOf(walletAddress).call();
        setBalance(balance);

        if (balance !== 0) {
            const ownedTokens = await contract.methods
                .tokensOfOwner(walletAddress)
                .call();

            const promiseTokensUrls = [];

            ownedTokens.forEach((token) => {
                promiseTokensUrls.push(generateTokenURL(token));
            });

            const tokensUrls = await Promise.all(promiseTokensUrls);
            setOwnedTokens(ownedTokens);
            setTokensLinks(tokensUrls);
        }
    };

    const loadBlockchainData = async () => {
        const web3 = window.web3;
        const networkId = await web3.eth.net.getId();
        if (networkId) {
            const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
            setContract(contract);

            const saleStatus = await contract.methods.saleIsActive().call();
            setSaleStatus(saleStatus);

            const totalSupply = await contract.methods.totalSupply().call();
            setTotalSupply(totalSupply);

            const developerPrice = await contract.methods
                .developerPrice()
                .call();
            setDeveloperPrice(developerPrice);

            const accounts = await web3.eth.getAccounts();

            if (accounts.length > 0) {
                setWalletAddress(accounts[0]);
                setSignedIn(true);
            }
        } else {
            window.alert('Smart contract not deployed yet.');
        }
    };

    const signIn = async () => {
        if (typeof window.web3 !== 'undefined') {
            // Use existing gateway
            window.web3 = new Web3(window.ethereum);
        } else {
            alert(
                'No Ethereum interface injected into browser. Read-only access'
            );
        }
        try {
            // checks if connected network is mainnet (change this to rinkeby if you wanna test on testnet)
            await window.ethereum.enable();
            // const networkId = await web3.eth.net.getId();
            const network = await window.web3.eth.net.getNetworkType();
            const networkId = await window.web3.eth.net.getId();
            //TODO FIX THIS
            if (!((networkId.toString()) === CONTRACT_NETWORK)) {
                alert(
                    'You are on ' +
                        network +
                        " network. Change network to POLYGON MAINNET or you won't be able to do anything here"
                );
            }

            await loadBlockchainData();
        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                console.error(e);
            }
        }
    };

    const generateTokenURL = async (token) => {
        const url = 'api/' + token;

        const result = await fetch(url, {
            method: 'GET',
            mode: 'no-cors',
            cache: 'default',
        });
        const resultJson = await result.json();
        return resultJson.image;
    };

    const mintDeveloper = async (quantity) => {
        if (contract) {
            const price = Number(developerPrice) * quantity;

            const gasAmount = await contract.methods
                .mint(quantity)
                .estimateGas({ from: walletAddress, value: price });

            setMintLoading(true);

            contract.methods
                .mint(quantity)
                .send({
                    from: walletAddress,
                    value: price,
                    gas: String(gasAmount),
                })
                .on('transactionHash', async (hash) => {
                    setTransactionHash(hash);
                })
                .on('confirmation', async (confirmationNumber) => {
                    await loadOwnedTokens(walletAddress);
                    setMintLoading(false);
                })
                .on('error', async (error) => {
                    console.error(error);
                    setMintLoading(false);
                });
        } else {
            console.log('Wallet not connected');
        }
    };

    const signOut = useCallback(async () => {
        setSignedIn(false);
    }, [setSignedIn]);

    return (
        <Base>
            <div className="max-w-4xl mx-auto text-center px-4">
                <div className="flex justify-between items-center">
                    <Button as="a" href="/">
                        &lsaquo; Back to Home
                    </Button>
                    <h1 className="text-2xl md:text-5xl leading-relaxed text-center py-12">
                        Mint Page
                    </h1>
                    <div></div>
                </div>

                <div className="text-justify">
                    <div>
                        Wallet status: {signedIn ? 'Connected' : 'Disconnected'}
                        <Button
                            onClick={signedIn ? signOut : signIn}
                            classes="ml-4"
                        >
                            {!signedIn ? 'CONNECT WALLET' : 'DISCONNECT WALLET'}
                        </Button>
                    </div>
                    <div>Wallet Address: {walletAddress} </div>
                    <div>Developers already minted: {totalSupply} / 10000 </div>
                    {/* <div>Sale is  {saleStatus ? 'Active!' : 'Not active!'} </div> */}
                    <div>
                        Developer Price: {developerPrice / 10 ** 18} MATIC{' '}
                    </div>
                </div>

                <div className="mintForm">
                    <div id="mint" className="my-4">
                        <span className="mr-4">Give me</span>

                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={developersMintQtty}
                            onChange={(e) =>
                                setDevelopersMintQtty(e.target.value)
                            }
                            name=""
                            className="bg-gray-900 focus:bg-gray-700 border border-teal-light py-2 px-4 rounded-lg"
                        />

                        <span className="ml-4">Developers!</span>
                    </div>
                    {saleStatus ? (
                        <Button
                            onClick={() => mintDeveloper(developersMintQtty)}
                            disabled={mintLoading}
                        >
                            {mintLoading && 'Loading...'}
                            {!mintLoading &&
                                `MINT ${developersMintQtty} developer(s) for ${
                                    (developerPrice * developersMintQtty) /
                                    10 ** 18
                                } MATIC + GAS`}
                        </Button>
                    ) : (
                        <Button>
                            SALE IS NOT ACTIVE OR NO WALLET IS CONNECTED
                        </Button>
                    )}
                    {transactionHash && (
                        <div className="mt-4">
                            <Button
                                as="a"
                                href={`${EXPLORER}${transactionHash}`}
                                target="_blank"
                            >
                                View Transaction on Explorer
                            </Button>
                        </div>
                    )}
                </div>
                <h3 className="text-xl font-semibold mt-4">Your NFTs:</h3>
                <span>
                    {balance === 0
                        ? "You don't own any developers at the moment."
                        : 'Your currently own ' + balance + ' developers.'}
                </span>
            </div>
            <div className="mt-4 px-8">
                <div>
                    {balance !== 0 && (
                        <div className="grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 py-8">
                            {tokensLinks.map((value, index) => {
                                return (
                                    <img
                                        src={value}
                                        alt="KryptoDeveloper"
                                        width="256"
                                        height="256"
                                        key={value}
                                        className="block"
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Base>
    );
}
