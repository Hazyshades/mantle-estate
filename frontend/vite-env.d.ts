/// <reference types="vite/client" />

interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    send: (method: string, params?: any[]) => Promise<any>;
    isMetaMask?: boolean;
  };
}