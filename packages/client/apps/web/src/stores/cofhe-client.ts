import { createCofheConfig, createCofheClient } from "@cofhe/sdk/web";
import { chains } from "@cofhe/sdk/chains";

const config = createCofheConfig({
  supportedChains: [chains.sepolia],
});

export const cofheClient = createCofheClient(config);
