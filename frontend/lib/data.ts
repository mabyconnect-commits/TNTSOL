// Mock data for the TNTSOL prototype. No network/chain calls — this is a
// design prototype; numbers are illustrative.

export type Bucket = "white" | "black";

export type Token = {
  id: string;
  rank: string;
  sym: string;
  name: string;
  av: string;
  avBg: string;
  avFg: string;
  price: string;
  priceNum: number;
  m5: string;
  m5down?: boolean;
  h1: string;
  h1down?: boolean;
  mcap: string;
  grad: number; // % to graduation
  bucket: Bucket;
  holders: string;
  spark?: boolean;
  // curve reserves for the trade preview (x*y=k)
  virtualSol: number;
  realToken: number;
};

export const GRADUATION_SOL = 85;

export const TOKENS: Token[] = [
  { id: "peped", rank: "01", sym: "PEPED", name: "Pepe Detonator", av: "P", avBg: "#FF2D1F", avFg: "#FFF6E8", price: "0.000412", priceNum: 0.000412, m5: "+12.4%", h1: "+184%", mcap: "82.4k", grad: 96, bucket: "white", holders: "1,284", spark: true, virtualSol: 112.4, realToken: 272_800_000 },
  { id: "fuse", rank: "02", sym: "FUSE", name: "Fuse Coin", av: "F", avBg: "#9945FF", avFg: "#FFF6E8", price: "0.000118", priceNum: 0.000118, m5: "+4.2%", h1: "+67%", mcap: "48.1k", grad: 56, bucket: "white", holders: "612", virtualSol: 78.1, realToken: 661_800_000 },
  { id: "boom", rank: "03", sym: "BOOM", name: "Boom Town", av: "B", avBg: "#14F195", avFg: "#0A0908", price: "0.0000088", priceNum: 0.0000088, m5: "+42%", h1: "+128%", mcap: "3.2k", grad: 4, bucket: "black", holders: "89", virtualSol: 33.2, realToken: 920_000_000 },
  { id: "dyn", rank: "04", sym: "DYN", name: "Dynaverse", av: "D", avBg: "#FFB627", avFg: "#0A0908", price: "0.00214", priceNum: 0.00214, m5: "−2.1%", m5down: true, h1: "+18.4%", mcap: "71.8k", grad: 84, bucket: "white", holders: "2,041", virtualSol: 101.8, realToken: 47_500_000 },
  { id: "kero", rank: "05", sym: "KERO", name: "Kerosene", av: "K", avBg: "#FF5436", avFg: "#FFF6E8", price: "0.000041", priceNum: 0.000041, m5: "−8.4%", m5down: true, h1: "+24%", mcap: "22.6k", grad: 26, bucket: "white", holders: "418", virtualSol: 52.6, realToken: 128_000_000 },
  { id: "mag", rank: "06", sym: "MAG", name: "Magma", av: "M", avBg: "#5C2BB0", avFg: "#FFF6E8", price: "0.0000412", priceNum: 0.0000412, m5: "+1.2%", h1: "+9%", mcap: "8.4k", grad: 10, bucket: "black", holders: "156", virtualSol: 38.4, realToken: 204_000_000 },
  { id: "ntr", rank: "07", sym: "NTR", name: "Nitro", av: "N", avBg: "#E8E2D5", avFg: "#0A0908", price: "0.00811", priceNum: 0.00811, m5: "+0.8%", h1: "−4.2%", h1down: true, mcap: "68.4k", grad: 80, bucket: "white", holders: "3,418", virtualSol: 98.4, realToken: 12_100_000 },
  { id: "sprk", rank: "08", sym: "SPRK", name: "Sparkler", av: "S", avBg: "#FFB627", avFg: "#0A0908", price: "0.000018", priceNum: 0.000018, m5: "+8%", h1: "+44%", mcap: "5.6k", grad: 7, bucket: "black", holders: "142", virtualSol: 35.6, realToken: 311_000_000 },
  { id: "trig", rank: "09", sym: "TRIG", name: "Trigger", av: "T", avBg: "#B81A0F", avFg: "#FFF6E8", price: "0.00128", priceNum: 0.00128, m5: "+3.4%", h1: "+22%", mcap: "38.2k", grad: 45, bucket: "white", holders: "824", virtualSol: 68.2, realToken: 53_200_000 },
];

export function getToken(id: string): Token | undefined {
  return TOKENS.find((t) => t.id === id);
}

export type Holding = {
  sym: string; name: string; av: string; bg: string; fg: string;
  bucket: Bucket; balance: string; value: string; avg: string;
  pnl: string; pct: string; up: boolean;
};

export const HOLDINGS: Holding[] = [
  { sym: "PEPED", name: "Pepe Detonator", av: "P", bg: "#FF2D1F", fg: "#FFF6E8", bucket: "white", balance: "12,400", value: "5.10", avg: "0.000218", pnl: "+2.41", pct: "+88.9", up: true },
  { sym: "FUSE", name: "Fuse Coin", av: "F", bg: "#9945FF", fg: "#FFF6E8", bucket: "white", balance: "24,180", value: "2.85", avg: "0.000098", pnl: "+0.48", pct: "+20.4", up: true },
  { sym: "NTR", name: "Nitro", av: "N", bg: "#E8E2D5", fg: "#0A0908", bucket: "white", balance: "1,840", value: "1.42", avg: "0.00084", pnl: "−0.12", pct: "−7.8", up: false },
  { sym: "BOOM", name: "Boom Town", av: "B", bg: "#14F195", fg: "#0A0908", bucket: "black", balance: "184k", value: "1.62", avg: "0.0000056", pnl: "+0.79", pct: "+95.4", up: true },
  { sym: "KERO", name: "Kerosene", av: "K", bg: "#FF5436", fg: "#FFF6E8", bucket: "black", balance: "21,400", value: "0.88", avg: "0.000048", pnl: "−0.14", pct: "−13.7", up: false },
  { sym: "DET", name: "Detonate", av: "D", bg: "#5C2BB0", fg: "#FFF6E8", bucket: "black", balance: "8,200", value: "0.62", avg: "0.000064", pnl: "+0.10", pct: "+19.2", up: true },
  { sym: "WICK", name: "Wick", av: "W", bg: "#FFB627", fg: "#0A0908", bucket: "black", balance: "4,800", value: "0.42", avg: "0.000071", pnl: "+0.08", pct: "+23.5", up: true },
  { sym: "SPRK", name: "Sparkler", av: "S", bg: "#FF2D1F", fg: "#FFF6E8", bucket: "black", balance: "12,800", value: "0.18", avg: "0.000018", pnl: "−0.02", pct: "−10.0", up: false },
];

export const REDEMPTIONS = [
  { time: "2m ago", from: "7XnZ…q9kF", dev: "2.412", sol: "+1.930" },
  { time: "14m ago", from: "3Bq…n2R", dev: "8.000", sol: "+6.400" },
  { time: "22m ago", from: "9zL…k8X", dev: "1.250", sol: "+1.000" },
  { time: "1h ago", from: "5Hk…m2P", dev: "0.640", sol: "+0.512" },
];

export const REDEEM_RATE = 0.8; // % paid out
export const ACTIVATION_FEE = 1; // % charged on first trade
export const WHITELIST_BALANCE = 10.81;
