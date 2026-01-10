import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useToast } from "@/components/ui/use-toast";

const MANTLE_SEPOLIA_CHAIN_ID = 5003;
const WALLET_STORAGE_KEY = "mantle_estate_wallet_address";

interface UseWalletReturn {
  walletAddress: string | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  checkMetaMask: () => any;
}

export function useWallet(): UseWalletReturn {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Load wallet address from localStorage on mount
  useEffect(() => {
    const storedAddress = localStorage.getItem(WALLET_STORAGE_KEY);
    if (storedAddress) {
      setWalletAddress(storedAddress);
      // Verify the wallet is still connected
      checkExistingConnection(storedAddress);
    }
  }, []);

  // Listen for MetaMask account changes
  useEffect(() => {
    if (typeof window === "undefined" || typeof (window as any).ethereum === "undefined") {
      return;
    }

    const ethereum = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their account
        setWalletAddress(null);
        localStorage.removeItem(WALLET_STORAGE_KEY);
        toast({
          title: "Wallet Disconnected",
          description: "Your wallet has been disconnected",
        });
      } else {
        // User switched accounts
        const newAddress = accounts[0];
        setWalletAddress(newAddress);
        localStorage.setItem(WALLET_STORAGE_KEY, newAddress);
        toast({
          title: "Account Changed",
          description: `Switched to ${newAddress.slice(0, 6)}...${newAddress.slice(-4)}`,
        });
      }
    };

    const handleChainChanged = () => {
      // Reload the page when chain changes to avoid issues
      window.location.reload();
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [toast]);

  const checkExistingConnection = async (address: string) => {
    try {
      const ethereum = checkMetaMask();
      const provider = new ethers.BrowserProvider(ethereum);
      const accounts = await provider.send("eth_accounts", []);
      
      if (accounts.length === 0 || accounts[0].toLowerCase() !== address.toLowerCase()) {
        // Wallet is no longer connected
        setWalletAddress(null);
        localStorage.removeItem(WALLET_STORAGE_KEY);
        return;
      }

      // Verify it's still the same address
      const signer = await provider.getSigner();
      const currentAddress = await signer.getAddress();
      
      if (currentAddress.toLowerCase() !== address.toLowerCase()) {
        setWalletAddress(null);
        localStorage.removeItem(WALLET_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error checking existing connection:", error);
      // If check fails, clear the stored address
      setWalletAddress(null);
      localStorage.removeItem(WALLET_STORAGE_KEY);
    }
  };

  const checkMetaMask = () => {
    if (typeof (window as any).ethereum === "undefined") {
      throw new Error("MetaMask is not installed. Please install the MetaMask extension.");
    }
    return (window as any).ethereum;
  };

  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      const ethereum = checkMetaMask();
      const provider = new ethers.BrowserProvider(ethereum);

      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length === 0) {
        throw new Error("Please connect your wallet in MetaMask");
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Check network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== MANTLE_SEPOLIA_CHAIN_ID) {
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${MANTLE_SEPOLIA_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${MANTLE_SEPOLIA_CHAIN_ID.toString(16)}`,
                  chainName: "Mantle Sepolia Testnet",
                  nativeCurrency: {
                    name: "MNT",
                    symbol: "MNT",
                    decimals: 18,
                  },
                  rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
                  blockExplorerUrls: ["https://sepolia.mantlescan.xyz"],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }

      setWalletAddress(address);
      localStorage.setItem(WALLET_STORAGE_KEY, address);
      
      toast({
        title: "Wallet Connected",
        description: `Connected wallet ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error.message || "Failed to connect wallet",
      });
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    localStorage.removeItem(WALLET_STORAGE_KEY);
    toast({
      title: "Wallet Disconnected",
      description: "Wallet has been disconnected",
    });
  }, [toast]);

  return {
    walletAddress,
    isConnecting,
    connectWallet,
    disconnectWallet,
    checkMetaMask,
  };
}

