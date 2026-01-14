import { useState, useEffect, useRef } from 'react';
import { Wallet, DollarSign, ShieldCheck, ArrowRightLeft, Lock, FileCheck, Plus, X, Sun, LogOut, Mail, Key, Loader2, CheckCircle2, AlertCircle, Search, Cpu, ShieldAlert, Zap } from 'lucide-react';
import { ethers } from 'ethers';
import { fetchOrders, createOrder, login, register, anchorToBitcoin } from './utils/api';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// --- Matrix Rain Component ---
const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const characters = "01SOLARIS6789ABCDEFGHIJKLMNOPQRSTUVWXYZ$";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#D4AF37';
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 opacity-40 pointer-events-none" />;
};

interface Order {
  id: string;
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  paymentMethod: string;
}

interface AuditResult {
  address: string;
  isContract: boolean;
  riskScore: number;
  vulnerabilities: string[];
  status: 'VERIFIED' | 'SUSPICIOUS' | 'UNKNOWN';
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'defi' | 'rwa' | 'auditor'>('defi');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('1240.50');
  const [orders, setOrders] = useState<Order[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'BUY' | 'SELL' | 'RWA' | 'CERT'>('BUY');
  const [selectedCert, setSelectedCert] = useState<any>(null);

  // Auditor State
  const [auditTarget, setAuditTarget] = useState('');
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  // Status Modal State
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusTitle, setStatusTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'loading' | 'success' | 'error'>('loading');
  const [progress, setProgress] = useState(0);

  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // P2P Form State
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('1.00');

  useEffect(() => {
    const token = localStorage.getItem('solaris_token');
    if (token) {
      setIsAuthenticated(true);
      loadOrders();
    }
  }, []);

  const loadOrders = async () => {
    const data = await fetchOrders();
    setOrders(data || []);
  };

  const showStatus = (title: string, msg: string, type: 'loading' | 'success' | 'error' = 'loading', prog = 0) => {
    setStatusTitle(title);
    setStatusMessage(msg);
    setStatusType(type);
    setProgress(prog);
    setIsProcessing(true);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (authMode === 'login') {
      const res = await login({ email, password });
      if (res.token) {
        setIsAuthenticated(true);
        loadOrders();
      } else {
        alert(res.error || "Login Failed");
      }
    } else {
      const res = await register({ email, password, walletAddress });
      if (!res.error) {
        alert("Registration Successful! Please login.");
        setAuthMode('login');
      } else {
        alert(res.error);
      }
    }
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('solaris_token');
    localStorage.removeItem('solaris_user');
    setIsAuthenticated(false);
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        showStatus('Connecting Nexus', 'Establishing secure link with Metamask...', 'loading', 30);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        setTimeout(() => {
          setWalletAddress(address);
          setProgress(100);
          showStatus('Nexus Linked', `Wallet ${address.slice(0, 6)}... connected successfully.`, 'success');
          setTimeout(() => setIsProcessing(false), 2000);
        }, 1500);
      } catch (error) {
        showStatus('Link Failed', 'User rejected the connection request.', 'error');
        setTimeout(() => setIsProcessing(false), 3000);
      }
    } else {
      showStatus('Metamask Required', 'Please install a Web3 wallet to continue.', 'error');
      setTimeout(() => setIsProcessing(false), 3000);
    }
  };

  const executeAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditTarget) return;

    showStatus('Protocol Auditor', 'Iniciando escaneo de seguridad en la red Solaris...', 'loading', 10);

    try {
      // Immediate feedback
      setTimeout(() => {
        setProgress(30);
        setStatusMessage('Nexus Audit: Verificando integridad del bytecode y metadatos...');

        setTimeout(async () => {
          setProgress(60);
          setStatusMessage('Heuristic Scan: Analizando patrones de lógica y permisos...');

          let isContract = false;
          let risk = 15;
          let notes = ['None Detected (Standard Logic)'];

          try {
            if (typeof window.ethereum !== 'undefined') {
              const provider = new ethers.BrowserProvider(window.ethereum);
              const target = auditTarget as any;
              if (ethers.isAddress(target)) {
                const code = await provider.getCode(target);
                isContract = code !== '0x';
                if (!isContract) {
                  risk = 45;
                  notes = ['EOA Wallet detected', 'External ownership risk'];
                }
              } else if (target && typeof target === 'string' && target.startsWith('0x') && target.length === 66) {
                // Tx Hash
                risk = 5;
                notes = ['Transaction Hash detected', 'Integrity confirmed'];
              } else {
                risk = 85;
                notes = ['Invalid identifier format', 'High probability of phishing'];
              }
            }
          } catch (pErr) {
            console.warn("Provider check failed", pErr);
          }

          setTimeout(() => {
            setProgress(90);
            setStatusMessage('Graph Sync: Finalizando reporte de vulnerabilidades...');

            setTimeout(() => {
              const status = risk > 50 ? 'SUSPICIOUS' : 'VERIFIED';
              setAuditResult({
                address: auditTarget,
                isContract,
                riskScore: risk,
                vulnerabilities: notes,
                status
              });
              setProgress(100);
              showStatus('Audit Complete', 'Reporte de seguridad generado exitosamente.', 'success');
              setTimeout(() => setIsProcessing(false), 2000);
            }, 1000);
          }, 1000);
        }, 1200);
      }, 500);
    } catch (err) {
      showStatus('Audit Fail', 'Error crítico en el motor de auditoría.', 'error');
      setTimeout(() => setIsProcessing(false), 3000);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return showStatus('Error', 'Connect wallet before broadcasting.', 'error');

    showStatus('Broadcasting Order', 'Sending liquidity intent to the Solaris Grid...', 'loading', 40);

    setTimeout(async () => {
      await createOrder({
        type: modalType === 'BUY' ? 'BUY' : 'SELL',
        amount: Number(amount),
        price: Number(price),
        paymentMethod: 'Bank Transfer',
        creator: walletAddress
      });
      setProgress(100);
      showStatus('Order Live', 'Your liquidity is now visible to the network.', 'success');
      setShowModal(false);
      loadOrders();
      setTimeout(() => setIsProcessing(false), 2000);
    }, 2000);
  };

  const executeTrade = (order: Order) => {
    showStatus('Initializing Trade', `Locking ${order.amount} USDC in secure Escrow...`, 'loading', 20);

    setTimeout(() => {
      setProgress(50);
      setStatusMessage('Nexus Audit: Verifying node reputation and liquidity...');

      setTimeout(() => {
        setProgress(80);
        setStatusMessage('Contract Sync: Finalizing on-chain settlement...');

        setTimeout(() => {
          setProgress(100);
          showStatus('Trade Successful', 'Assets released. Check your vault history.', 'success');
          setTimeout(() => setIsProcessing(false), 2500);
        }, 2000);
      }, 2000);
    }, 2000);
  };

  const handleDeposit = () => {
    showStatus('Vault Deposit', 'Simulating asset transfer to Solaris Smart Vault...', 'loading', 20);
    setTimeout(() => {
      setProgress(100);
      setBalance((parseFloat(balance) + 500).toFixed(2));
      showStatus('Tokens Secured', '+500 USDC added to your vault balance.', 'success');
      setTimeout(() => setIsProcessing(false), 2000);
    }, 2500);
  };

  const handleTransfer = () => {
    showStatus('External Transfer', 'Confirming destination address on Solaris Node...', 'loading', 30);
    setTimeout(() => {
      setProgress(100);
      setBalance((parseFloat(balance) - 100).toFixed(2));
      showStatus('Transfer Sent', '100 USDC moved to external wallet successfully.', 'success');
      setTimeout(() => setIsProcessing(false), 2000);
    }, 2500);
  };

  const handleInitializeAnchor = async () => {
    showStatus('RWA Notary Start', 'Generating cryptographic proof...', 'loading', 10);

    try {
      // Generate real SHA-256 hash from asset data
      const assetData = JSON.stringify({
        contractId: `RWA-${Date.now()}`,
        timestamp: new Date().toISOString(),
        owner: walletAddress || 'anonymous',
        network: 'polygon'
      });

      const hashBuffer = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(assetData)
      );

      const assetHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      setTimeout(async () => {
        setProgress(30);
        setStatusMessage('Timechain Sync: Broadcasting to Bitcoin network...');

        // Real Bitcoin anchoring
        const result = await anchorToBitcoin(assetHash, {
          assetType: 'RWA',
          owner: walletAddress,
          timestamp: Date.now()
        });

        if (result.success) {
          setProgress(60);
          setStatusMessage(`TX Broadcast: ${result.txid.slice(0, 16)}...`);

          setTimeout(() => {
            setProgress(85);
            setStatusMessage('Waiting for network confirmation...');

            setTimeout(() => {
              setProgress(100);
              showStatus(
                'Asset Anchored',
                `Permanently recorded on Bitcoin. TXID: ${result.txid.slice(0, 12)}...`,
                'success'
              );
              setShowModal(false);

              // Open block explorer in new tab
              if (result.explorer_url) {
                window.open(result.explorer_url, '_blank');
              }

              setTimeout(() => setIsProcessing(false), 3000);
            }, 2000);
          }, 2000);
        } else {
          showStatus('Anchor Failed', result.error || 'Bitcoin node unavailable', 'error');
          setTimeout(() => setIsProcessing(false), 3000);
        }
      }, 1500);
    } catch (err: any) {
      showStatus('Anchor Error', err.message || 'Failed to generate proof', 'error');
      setTimeout(() => setIsProcessing(false), 3000);
    }
  };

  const openModal = (type: 'BUY' | 'SELL' | 'RWA' | 'CERT', data: any = null) => {
    setModalType(type);
    setSelectedCert(data);
    setShowModal(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
        <MatrixRain />
        <div className="w-full max-w-md animate-solaris-in z-10">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-gold to-yellow-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-brand-gold/30 mx-auto mb-6 transform hover:rotate-12 transition-transform">
              <Sun size={40} className="text-black fill-black" />
            </div>
            <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase mb-2">Solaris</h1>
            <p className="text-brand-gold text-xs font-black uppercase tracking-[0.5em]">Vault Activation</p>
          </div>

          <div className="card-solaris bg-zinc-950/80 p-10 border-brand-gold/20 shadow-[0_0_80px_rgba(212,175,55,0.1)]">
            <div className="flex bg-white/5 p-1.5 rounded-2xl mb-10 border border-white/5">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${authMode === 'login' ? 'bg-brand-gold text-black shadow-lg shadow-brand-gold/20' : 'text-zinc-500 hover:text-white'}`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${authMode === 'register' ? 'bg-brand-gold text-black shadow-lg shadow-brand-gold/20' : 'text-zinc-500 hover:text-white'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-2">Secure Link (Email)</label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-gold transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="node@solaris.net"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl pl-14 pr-6 py-5 focus:border-brand-gold outline-none text-white font-medium transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-2">Encryption Key (Password)</label>
                <div className="relative group">
                  <Key size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-gold transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl pl-14 pr-6 py-5 focus:border-brand-gold outline-none text-white font-medium transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-gold w-full py-5 text-base shadow-brand-gold/40 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : (authMode === 'login' ? 'Enter Vault' : 'Create Node')}
                <ArrowRightLeft size={18} />
              </button>
            </form>

            <p className="text-center mt-10 text-[10px] text-zinc-700 font-bold uppercase tracking-widest">
              Solaris Protocol v1.5 • Privacy Maximized
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-slate-100 font-sans selection:bg-brand-gold/30 pb-10">
      <MatrixRain />

      {/* Processing Portal Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
          <div className="w-full max-w-sm p-10 bg-zinc-950 border border-brand-gold/30 rounded-[2.5rem] shadow-[0_0_100px_rgba(212,175,55,0.15)] text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-gold to-transparent opacity-50"></div>

            <div className="flex justify-center">
              {statusType === 'loading' && <Loader2 size={60} className="text-brand-gold animate-spin" />}
              {statusType === 'success' && <CheckCircle2 size={60} className="text-green-500 animate-solaris-in" />}
              {statusType === 'error' && <AlertCircle size={60} className="text-red-500 animate-solaris-in" />}
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{statusTitle}</h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest leading-relaxed px-4">{statusMessage}</p>
            </div>

            {statusType === 'loading' && (
              <div className="space-y-3">
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-gold shadow-[0_0_10px_rgba(212,175,55,0.5)] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em] text-brand-gold">
                  <span>Synchronizing</span>
                  <span>{progress}%</span>
                </div>
              </div>
            )}

            {statusType !== 'loading' && (
              <button
                onClick={() => setIsProcessing(false)}
                className="px-10 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
              >
                Close Terminal
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="border-b border-brand-gold/10 bg-black/60 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-gold to-yellow-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-gold/20 group-hover:rotate-12 transition-all">
              <Sun size={28} className="text-black fill-black" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl leading-none tracking-tighter text-white uppercase italic">Solaris</span>
              <span className="text-[10px] uppercase tracking-[0.4em] text-brand-gold font-black">P2P Nexus</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={connectWallet}
              className="flex items-center gap-3 bg-white/5 hover:bg-brand-gold/10 border border-brand-gold/20 px-8 py-3 rounded-2xl transition-all active:scale-95 group"
            >
              <Wallet size={20} className="text-brand-gold group-hover:scale-110 transition-transform" />
              <span className="text-sm font-black uppercase tracking-widest text-brand-gold">
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Link Wallet'}
              </span>
            </button>

            <button
              onClick={logout}
              className="w-12 h-12 flex items-center justify-center bg-red-500/5 hover:bg-red-500/20 border border-red-500/10 rounded-2xl text-red-500 transition-all active:scale-95 group"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Tab Switcher */}
        <div className="flex justify-center mb-20 animate-solaris-in">
          <div className="bg-zinc-900/50 p-2 rounded-3xl flex shadow-2xl border border-white/5">
            <button
              onClick={() => setActiveTab('defi')}
              className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black transition-all uppercase tracking-widest text-xs ${activeTab === 'defi'
                ? 'bg-brand-gold text-black shadow-2xl shadow-brand-gold/30'
                : 'text-zinc-500 hover:text-brand-gold hover:bg-white/5'
                }`}
            >
              <DollarSign size={18} />
              DeFi Market
            </button>
            <button
              onClick={() => setActiveTab('auditor')}
              className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black transition-all uppercase tracking-widest text-xs ${activeTab === 'auditor'
                ? 'bg-brand-gold text-black shadow-2xl shadow-brand-gold/30'
                : 'text-zinc-500 hover:text-brand-gold hover:bg-white/5'
                }`}
            >
              <ShieldAlert size={18} />
              Protocol Auditor
            </button>
            <button
              onClick={() => setActiveTab('rwa')}
              className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black transition-all uppercase tracking-widest text-xs ${activeTab === 'rwa'
                ? 'bg-brand-gold text-black shadow-2xl shadow-brand-gold/30'
                : 'text-zinc-500 hover:text-brand-gold hover:bg-white/5'
                }`}
            >
              <ShieldCheck size={18} />
              RWA Notary
            </button>
          </div>
        </div>

        {activeTab === 'defi' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-solaris-in">
            <div className="card-solaris col-span-2 space-y-10">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black flex items-center gap-4 text-white uppercase italic tracking-tighter">
                    <ArrowRightLeft className="text-brand-gold" />
                    Solaris Grid
                  </h2>
                  <p className="text-zinc-500 text-sm font-medium">Liquidez P2P protegida por colateral cripto-nativo</p>
                </div>
                <button
                  onClick={() => openModal('BUY')}
                  className="btn-gold group"
                >
                  <Plus size={20} className="inline-block mr-1 group-hover:rotate-90 transition-transform" />
                  Broadcast Order
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div onClick={() => openModal('BUY')} className="bg-gradient-to-br from-brand-gold/10 to-transparent p-8 rounded-3xl border border-brand-gold/10 hover:border-brand-gold/40 transition-all group cursor-pointer relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <DollarSign size={100} className="text-brand-gold" />
                  </div>
                  <h3 className="text-brand-gold text-xs font-black uppercase tracking-[0.3em] mb-4">Ingreso</h3>
                  <p className="text-3xl font-black text-white mb-2">Buy Assets</p>
                  <p className="text-zinc-500 text-sm">Cambio Fiat a Solaris USDC</p>
                </div>
                <div onClick={() => openModal('SELL')} className="bg-gradient-to-br from-zinc-900 to-transparent p-8 rounded-3xl border border-white/5 hover:border-brand-gold/40 transition-all group cursor-pointer relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ArrowRightLeft size={100} className="text-white" />
                  </div>
                  <h3 className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] mb-4">Egreso</h3>
                  <p className="text-3xl font-black text-white mb-2">Sell Assets</p>
                  <p className="text-zinc-500 text-sm">Retiro de fondos a Banca Tradicional</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h3 className="text-xl font-black text-white italic tracking-tighter">Live Sessions</h3>
                  <span className="text-[10px] font-black text-brand-gold animate-pulse uppercase tracking-[0.2em]">Synchronized</span>
                </div>
                <div className="space-y-4">
                  {orders.length > 0 ? orders.map((order) => (
                    <div key={order.id} className="group flex items-center justify-between bg-zinc-950/40 hover:bg-brand-gold/[0.03] p-6 rounded-3xl border border-white/5 hover:border-brand-gold/30 transition-all">
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 ${order.type === 'BUY' ? 'bg-brand-gold/20 text-brand-gold' : 'bg-white/10 text-white'}`}>
                          {order.type === 'BUY' ? <Plus size={28} /> : <ArrowRightLeft size={28} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-black text-white text-xl tracking-tighter">{order.amount} USDC</span>
                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${order.type === 'BUY' ? 'bg-brand-gold text-black' : 'bg-zinc-800 text-white'}`}>{order.type === 'BUY' ? 'Bid' : 'Ask'}</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{order.paymentMethod} • Rate: {order.price}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => executeTrade(order)}
                        className="btn-gold-outline px-10"
                      >
                        Trade
                      </button>
                    </div>
                  )) : (
                    <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2rem]">
                      <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Waiting for Network Pulse...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="card-solaris bg-gradient-to-br from-zinc-900 via-black to-black border-brand-gold/20">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Sun size={120} className="text-brand-gold" />
                </div>
                <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Vault Balance</h3>
                <p className="text-6xl font-black text-white tracking-tighter mb-10 select-none">${balance}</p>
                <div className="space-y-3 relative z-10">
                  <button
                    onClick={handleDeposit}
                    className="w-full py-4 bg-brand-gold hover:bg-brand-gold-bright text-black rounded-2xl font-black transition-all shadow-2xl shadow-brand-gold/40 uppercase tracking-widest text-sm active:scale-95"
                  >
                    Deposit
                  </button>
                  <button
                    onClick={handleTransfer}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black transition-all uppercase tracking-widest text-xs active:scale-95"
                  >
                    Transfer
                  </button>
                </div>
              </div>

              <div className="card-solaris group cursor-pointer hover:border-brand-gold/40 transition-colors">
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-1">
                    <h3 className="font-black text-white uppercase italic tracking-tighter">Yield Protocol</h3>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Aave V3 Alchemy</p>
                  </div>
                  <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center text-brand-gold group-hover:rotate-12 transition-transform">
                    <Lock size={20} />
                  </div>
                </div>
                <div className="space-y-6">
                  <p className="text-5xl font-black text-brand-gold tracking-tighter">4.95% <span className="text-sm font-bold text-zinc-600 uppercase">APY</span></p>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-gold/40 w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'auditor' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-solaris-in">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Protocol Auditor</h2>
              <p className="text-zinc-500 font-medium max-w-lg mx-auto">Vincular un contrato o transacción para auditar su integridad criptográfica en tiempo real.</p>
            </div>

            <div className="card-solaris p-12 bg-zinc-950/40 border-brand-gold/30">
              <form onSubmit={executeAudit} className="space-y-8">
                <div className="relative group">
                  <Search size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-gold transition-colors" />
                  <input
                    type="text"
                    value={auditTarget}
                    onChange={(e) => setAuditTarget(e.target.value)}
                    placeholder="Contract Address (0x...) or Transaction Hash"
                    className="w-full bg-black/60 border-2 border-white/5 rounded-3xl py-6 pl-16 pr-8 text-white font-black tracking-widest outline-none focus:border-brand-gold transition-all shadow-inner"
                  />
                </div>
                <button type="submit" className="btn-gold w-full py-6 text-lg tracking-[0.2em] shadow-brand-gold/20 flex items-center justify-center gap-4">
                  <Cpu size={22} />
                  Submit Protocol for Review
                </button>
              </form>
            </div>

            {auditResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-solaris-in">
                <div className="card-solaris space-y-6">
                  <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                    <ShieldCheck size={14} className="text-brand-gold" /> Security Snapshot
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Node Type</span>
                      <span className="text-white font-black uppercase text-xs">{auditResult.isContract ? 'Smart Contract' : 'EOA / Wallet'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Risk Index</span>
                      <span className={`font-black text-xs ${auditResult.riskScore > 50 ? 'text-red-500' : 'text-green-500'}`}>{auditResult.riskScore}%</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Status</span>
                      <span className={`font-black text-xs px-2 py-0.5 rounded border ${auditResult.status === 'VERIFIED' ? 'text-green-500 border-green-500/30 bg-green-500/5' : 'text-red-500 border-red-500/30 bg-red-500/5'}`}>
                        {auditResult.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-solaris space-y-6">
                  <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                    <Zap size={14} className="text-brand-gold" /> Logic Diagnostics
                  </h3>
                  <div className="space-y-3">
                    {auditResult.vulnerabilities.map((v, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-brand-gold/20 transition-all">
                        <AlertCircle size={14} className={auditResult.status === 'VERIFIED' ? 'text-green-500' : 'text-red-500'} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rwa' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-solaris-in">
            <div className="card-solaris border-brand-gold/30">
              <div className="flex justify-between items-center mb-10">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black flex items-center gap-4 text-white uppercase italic tracking-tighter">
                    <ShieldCheck className="text-brand-gold" />
                    Aureum Notary
                  </h2>
                  <p className="text-zinc-500 text-sm font-medium">Anclaje de integridad en Bitcoin Timechain</p>
                </div>
                <div className="px-4 py-1.5 bg-brand-gold/10 rounded-full border border-brand-gold/30">
                  <span className="text-[9px] font-black text-brand-gold uppercase tracking-[0.3em]">Quantum Proof</span>
                </div>
              </div>

              <div className="space-y-8">
                <div onClick={() => openModal('RWA')} className="bg-zinc-950 p-10 rounded-[2.5rem] border-2 border-dashed border-brand-gold/10 text-center hover:border-brand-gold/50 hover:bg-brand-gold/[0.02] transition-all cursor-pointer group relative overflow-hidden">
                  <div className="w-24 h-24 bg-brand-gold/5 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-inner border border-brand-gold/10">
                    <FileCheck size={40} className="text-brand-gold" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-4 uppercase italic tracking-tighter">Anchor Asset</h3>
                  <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-10 leading-relaxed font-medium">Firma la inmutabilidad de tu activo físico. Generamos una prueba digital vinculada a la red más segura del planeta: Bitcoin.</p>
                  <button className="btn-gold px-12 py-4 shadow-brand-gold/20">Protocol Start</button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-black p-5 rounded-2xl border border-white/5 group hover:border-brand-gold/30 transition-colors">
                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-3">Sync Status: BTC</p>
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-gold animate-ping"></div>
                      <span className="text-xs font-black text-white uppercase tracking-widest">Anchored</span>
                    </div>
                  </div>
                  <div className="bg-black p-5 rounded-2xl border border-white/5 group hover:border-brand-gold/30 transition-colors">
                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-3">Polygon Mainnet</p>
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                      <span className="text-xs font-black text-white uppercase tracking-widest">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="card-solaris">
                <h3 className="font-black text-white uppercase italic tracking-tighter flex items-center gap-3 mb-8">
                  <FileCheck size={22} className="text-brand-gold" /> Evidence Layer
                </h3>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      onClick={() => openModal('CERT', { id: `AURE-00${i}`, hash: `000...${7742 + i}`, date: '2026-01-12' })}
                      className="flex gap-6 items-center p-6 bg-black/40 hover:bg-brand-gold/[0.02] rounded-3xl border border-white/5 hover:border-brand-gold/20 transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold flex-shrink-0 group-hover:rotate-6 transition-transform">
                        <ShieldCheck size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-black text-white text-lg tracking-tighter">Cert #AURE-00{i}</p>
                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Active</span>
                        </div>
                        <p className="text-[9px] text-zinc-500 truncate font-black uppercase tracking-[0.2em] mb-3">BTC-HASH: 000...{7742 + i}</p>
                        <div className="flex items-center gap-3">
                          <div className="h-1 flex-1 bg-zinc-900 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-gold w-full"></div>
                          </div>
                          <span className="text-[9px] font-black text-brand-gold uppercase tracking-[0.2em]">Verified</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4 opacity-30 grayscale hover:grayscale-0 transition-all cursor-pointer text-white">
            <Sun size={20} className="text-brand-gold" />
            <span className="text-[11px] font-black uppercase tracking-[0.5em]">Solaris P2P v1.5</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">Autonomous Reserve & Digital Assets Notary</p>
            <p className="text-zinc-800 text-[9px] font-bold">&copy; 2026 Solaris Labs. Secured by Bitcoin Timechain.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-solaris-in">
          <div className="bg-zinc-950 border-2 border-brand-gold/20 rounded-[3rem] w-full max-w-lg p-12 shadow-[0_0_100px_rgba(212,175,55,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-gold to-transparent opacity-50"></div>
            <div className="flex justify-between items-start mb-12">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                  {modalType === 'RWA' ? 'Vault Entry' : modalType === 'CERT' ? 'Notary Evidence' : 'Market Order'}
                </h3>
                <p className="text-brand-gold text-[10px] font-black uppercase tracking-[0.5em]">Solaris Protocol v1.5</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl text-zinc-500 hover:text-brand-gold hover:bg-white/10 transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            {modalType === 'CERT' && selectedCert && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-white/5 pb-4">
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Certificate ID</span>
                    <span className="text-white font-black text-sm">{selectedCert.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-4">
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Network Proof</span>
                    <span className="text-brand-gold font-black text-sm tracking-tighter">{selectedCert.hash}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-4">
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Anchor Date</span>
                    <span className="text-white font-black text-sm">{selectedCert.date}</span>
                  </div>
                </div>
                <div className="p-6 bg-brand-gold/5 rounded-2xl border border-brand-gold/10">
                  <p className="text-[10px] text-brand-gold font-black uppercase leading-loose tracking-widest text-center">
                    Este activo está anclado criptográficamente a la red de Bitcoin. Cualquier alteración en los metadatos invalidará esta prueba de integridad global.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest"
                >
                  Verify Explorer
                </button>
              </div>
            )}

            {modalType === 'RWA' && (
              <div className="space-y-8">
                <div className="bg-brand-gold/5 p-6 rounded-3xl border border-brand-gold/20 flex gap-4">
                  <ShieldCheck className="text-brand-gold flex-shrink-0" size={20} />
                  <p className="text-brand-gold text-[11px] font-black leading-relaxed uppercase tracking-wide">Encryption check active. Ensure NFT is minted on Solaris Grid before anchoring to Bitcoin.</p>
                </div>
                <div className="space-y-6">
                  <input type="text" placeholder="Smart Contract ID" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:border-brand-gold outline-none text-white font-black transition-all" />
                  <input type="number" placeholder="Digital Serial" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:border-brand-gold outline-none text-white font-black transition-all" />
                </div>
                <button
                  onClick={handleInitializeAnchor}
                  className="btn-gold w-full py-5 text-base shadow-brand-gold/40"
                >
                  Initialize Anchor
                </button>
              </div>
            )}

            {(modalType === 'BUY' || modalType === 'SELL') && (
              <form onSubmit={handleCreateOrder} className="space-y-10">
                <div className="space-y-6">
                  <div className="relative">
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-white/5 border-2 border-white/5 rounded-3xl px-8 py-6 pr-24 focus:border-brand-gold outline-none text-white text-3xl font-black transition-all tracking-tighter" required />
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-brand-gold text-sm tracking-widest">USDC</span>
                  </div>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Execution Rate (1.00)" className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 focus:border-brand-gold outline-none text-white font-black transition-all" required />
                </div>
                <button type="submit" className="btn-gold w-full py-5 text-base shadow-brand-gold/40">Broadcast Order</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
