import React, { useState } from 'react';
import './App.css';
import { ethers } from 'ethers';

const PEPU_RPC = 'https://rpc.pepeunchained.com';
const LLR_TOKEN_ADDRESS = '0xf6d46ae85d982812e75d034ab8dbba408208472f';

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

function App() {
  const [userWallet, setUserWallet] = useState('');
  const [llrAmount, setLlrAmount] = useState('');
  const [usdAmount, setUsdAmount] = useState(0);
  const [llrBalance, setLlrBalance] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBalance = async (wallet) => {
    try {
      const provider = new ethers.JsonRpcProvider(PEPU_RPC);
      const contract = new ethers.Contract(LLR_TOKEN_ADDRESS, ERC20_ABI, provider);
      const raw = await contract.balanceOf(wallet);
      const decimals = await contract.decimals();
      const formatted = Number(ethers.formatUnits(raw, decimals)).toFixed(2);
      setLlrBalance(formatted);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setLlrBalance(null);
    }
  };

  const handleWalletChange = (e) => {
    const w = e.target.value;
    setUserWallet(w);
    if (/^0x[a-fA-F0-9]{40}$/.test(w)) {
      fetchBalance(w);
    } else {
      setLlrBalance(null);
    }
  };

  const handleLlrChange = (e) => {
    const value = e.target.value;
    setLlrAmount(value);
    setUsdAmount((value * 0.05).toFixed(2)); // Example: 1 LLR = $0.05
  };

  const handleSwap = async () => {
    setLoading(true);
    setMessage('');

    if (!/^0x[a-fA-F0-9]{40}$/.test(userWallet)) {
      setMessage('❌ Invalid wallet address.');
      setLoading(false);
      return;
    }

    if (parseFloat(llrAmount) > parseFloat(llrBalance)) {
      setMessage('❌ You don’t have enough LLR to complete this top-up.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('https://curly-invention-7vw4pqv44rwx2wr-4000.app.github.dev/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          llrAmount: Number(llrAmount),
          userWallet,
          cardId: 'virtualCard123'
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage(`✅ $${data.usdAmount} added to your card!`);
        fetchBalance(userWallet); // Refresh balance
      } else {
        setMessage(`❌ Error: ${data.error || 'Swap failed.'}`);
      }
    } catch (err) {
      setMessage('❌ Network error.');
    }

    setLoading(false);
  };

  return (
    <div className="App">
      <h1>LLR to USD Card Top-Up</h1>

      <input
        type="text"
        placeholder="Your wallet address"
        value={userWallet}
        onChange={handleWalletChange}
      />

      {llrBalance !== null && (
        <p>Your LLR Balance: <strong>{llrBalance} LLR</strong></p>
      )}

      <input
        type="number"
        placeholder="Enter LLR amount"
        value={llrAmount}
        onChange={handleLlrChange}
      />

      <p>You'll receive: <strong>${usdAmount}</strong></p>

      <button onClick={handleSwap} disabled={loading || !llrAmount || !userWallet}>
        {loading ? 'Processing...' : 'Top Up My Card'}
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}

export default App;
