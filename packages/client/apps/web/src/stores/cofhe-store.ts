import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ConnectionStatus = "disconnected" | "connecting" | "connected";

interface CofheState {
  // Connection
  status: ConnectionStatus;
  account: string | null;
  chainId: number | null;

  // Encryption results (for passing between components)
  lastEncryptedHash: string | null;

  // Decryption results
  lastDecryptedViewValue: string | null;
  lastDecryptedTxValue: string | null;
  lastDecryptedTxSignature: string | null;

  // Trigger to refresh permit UI when SDK store changes
  permitVersion: number;

  // Actions
  setStatus: (status: ConnectionStatus) => void;
  setConnection: (account: string, chainId: number) => void;
  disconnect: () => void;
  bumpPermitVersion: () => void;
  setLastEncryptedHash: (hash: string | null) => void;
  setLastDecryptedView: (value: string | null) => void;
  setLastDecryptedTx: (value: string | null, signature: string | null) => void;
}

export const useCofheStore = create<CofheState>()(
  persist(
    (set) => ({
      status: "disconnected",
      account: null,
      chainId: null,
      lastEncryptedHash: null,
      lastDecryptedViewValue: null,
      lastDecryptedTxValue: null,
      lastDecryptedTxSignature: null,
      permitVersion: 0,

      setStatus: (status) => set({ status }),
      setConnection: (account, chainId) =>
        set({ account, chainId, status: "connected" }),
      disconnect: () =>
        set({
          status: "disconnected",
          account: null,
          chainId: null,
          lastEncryptedHash: null,
          lastDecryptedViewValue: null,
          lastDecryptedTxValue: null,
          lastDecryptedTxSignature: null,
          permitVersion: 0,
        }),
      bumpPermitVersion: () =>
        set((state) => ({ permitVersion: state.permitVersion + 1 })),
      setLastEncryptedHash: (hash) => set({ lastEncryptedHash: hash }),
      setLastDecryptedView: (value) => set({ lastDecryptedViewValue: value }),
      setLastDecryptedTx: (value, signature) =>
        set({
          lastDecryptedTxValue: value,
          lastDecryptedTxSignature: signature,
        }),
    }),
    {
      name: "cofhe-storage",
      partialize: (state) => ({
        account: state.account,
        chainId: state.chainId,
      }),
    },
  ),
);
