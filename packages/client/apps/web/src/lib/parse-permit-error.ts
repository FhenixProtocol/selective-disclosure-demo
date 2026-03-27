export function parsePermitError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (
    msg.includes("sealoutput") ||
    msg.includes("seal") ||
    msg.includes("Seal") ||
    msg.includes("SEAL")
  ) {
    return "Decryption denied: the active permit does not have access to this ciphertext. Make sure you have a valid self-permit or that the ACP was issued for your address.";
  }

  if (
    msg.includes("permission") ||
    msg.includes("Permission") ||
    msg.includes("unauthorized")
  ) {
    return "Permission denied: the permit used does not authorize decryption of this balance. Try creating a new self-permit or requesting an ACP from the token holder.";
  }

  if (msg.includes("not found") || msg.includes("404")) {
    return "Ciphertext not found on the network. The account may not have a balance, or the contract address may be incorrect.";
  }

  if (msg.includes("revert") || msg.includes("execution reverted")) {
    return "Transaction reverted: the contract rejected the request. This may indicate the account has no balance.";
  }

  return msg;
}
