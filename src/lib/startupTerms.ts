import type { StartupTerm } from "./types";

const STARTUP_TERMS: StartupTerm[] = [
  { term: "ARR", definition: "Annual Recurring Revenue — yearly subscription income" },
  { term: "CAC", definition: "Customer Acquisition Cost — what you spend to get one customer" },
  { term: "Burn Rate", definition: "Monthly cash outflow — how fast you're spending" },
  { term: "Runway", definition: "Months of cash left before you need more funding" },
  { term: "Unit Economics", definition: "Profit or loss on a single transaction" },
  { term: "GMV", definition: "Gross Merchandise Value — total value of goods sold on a platform" },
  { term: "LTV", definition: "Lifetime Value — total revenue from one customer over time" },
  { term: "Churn", definition: "Percentage of customers who stop paying each month" },
  { term: "TAM", definition: "Total Addressable Market — the full revenue opportunity" },
  { term: "Valuation", definition: "What investors think your company is worth today" },
  { term: "Term Sheet", definition: "The document that outlines the investment deal terms" },
  { term: "Equity Dilution", definition: "How much ownership you give up per funding round" },
  { term: "Gross Margin", definition: "Revenue minus cost of goods — your real profit signal" },
  { term: "MoM Growth", definition: "Month-over-month growth rate — the momentum metric" },
  { term: "Series A", definition: "First major VC round — typically ₹15-50Cr in India" },
  { term: "EBITDA", definition: "Earnings before interest, taxes, depreciation, amortization" },
  { term: "Pivot", definition: "Fundamental change in business model or target market" },
  { term: "Moat", definition: "Competitive advantage that protects you from copycats" },
];

export function getRandomTerm(): StartupTerm {
  return STARTUP_TERMS[Math.floor(Math.random() * STARTUP_TERMS.length)];
}

export default STARTUP_TERMS;
