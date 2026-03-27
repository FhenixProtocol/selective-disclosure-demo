import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export interface ImportedAcp {
  id: string;
  name: string;
  issuer: string;
  recipient: string;
  type: "self" | "sharing" | "recipient";
  expiration: number;
  raw: string;
}

interface CofheState {
  // Connection
  status: ConnectionStatus;
  account: string | null;
  chainId: number | null;

  // Minting
  mintTxHash: string | null;

  // Balance (encrypted ciphertext hash from contract)
  balanceCtHash: string | null;
  decryptedBalance: string | null;

  // Verifier ACPs
  importedAcps: ImportedAcp[];
  selectedAcpId: string | null;

  // Trigger to refresh permit UI when SDK store changes
  permitVersion: number;

  // Actions
  setStatus: (status: ConnectionStatus) => void;
  setConnection: (account: string, chainId: number) => void;
  disconnect: () => void;
  bumpPermitVersion: () => void;
  setMintTxHash: (hash: string | null) => void;
  setBalanceCtHash: (hash: string | null) => void;
  setDecryptedBalance: (value: string | null) => void;
  addImportedAcp: (acp: ImportedAcp) => void;
  removeImportedAcp: (id: string) => void;
  setSelectedAcpId: (id: string | null) => void;
}

export const useCofheStore = create<CofheState>()(
  persist(
    (set) => ({
      status: "disconnected",
      account: null,
      chainId: null,
      mintTxHash: null,
      balanceCtHash: null,
      decryptedBalance: null,
      importedAcps: [],
      selectedAcpId: null,
      permitVersion: 0,

      setStatus: (status) => set({ status }),
      setConnection: (account, chainId) =>
        set({ account, chainId, status: "connected" }),
      disconnect: () =>
        set({
          status: "disconnected",
          account: null,
          chainId: null,
          mintTxHash: null,
          balanceCtHash: null,
          decryptedBalance: null,
          importedAcps: [],
          selectedAcpId: null,
          permitVersion: 0,
        }),
      bumpPermitVersion: () =>
        set((state) => ({ permitVersion: state.permitVersion + 1 })),
      setMintTxHash: (hash) => set({ mintTxHash: hash }),
      setBalanceCtHash: (hash) => set({ balanceCtHash: hash }),
      setDecryptedBalance: (value) => set({ decryptedBalance: value }),
      addImportedAcp: (acp) =>
        set((state) => ({
          importedAcps: [...state.importedAcps, acp],
          selectedAcpId: acp.id,
        })),
      removeImportedAcp: (id) =>
        set((state) => ({
          importedAcps: state.importedAcps.filter((a) => a.id !== id),
          selectedAcpId: state.selectedAcpId === id ? null : state.selectedAcpId,
        })),
      setSelectedAcpId: (id) => set({ selectedAcpId: id }),
    }),
    {
      name: "cofhe-storage",
      partialize: (state) => ({
        account: state.account,
        chainId: state.chainId,
        importedAcps: state.importedAcps,
        selectedAcpId: state.selectedAcpId,
      }),
    },
  ),
);
