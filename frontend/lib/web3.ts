export function shortenAddress(address: string): string {\n  return `${address.slice(0,6)}...${address.slice(-4)}`;\n}
