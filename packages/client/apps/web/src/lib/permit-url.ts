export function encodePermitUrl(permitJson: string): string {
  // Ensure we encode the actual permit object, not a double-stringified string
  let parsed = JSON.parse(permitJson);
  if (typeof parsed === "string") {
    parsed = JSON.parse(parsed);
  }
  const compact = JSON.stringify(parsed);
  const encoded = btoa(compact);
  return `${window.location.origin}/verifier#permit=${encoded}`;
}

export function decodePermitFromHash(): Record<string, unknown> | null {
  const hash = window.location.hash;
  if (!hash.startsWith("#permit=")) return null;
  try {
    const encoded = hash.slice("#permit=".length);
    const json = atob(encoded);
    let parsed = JSON.parse(json);
    // Handle double-stringified JSON (PermitUtils.export returns a string)
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    return parsed;
  } catch {
    return null;
  }
}
