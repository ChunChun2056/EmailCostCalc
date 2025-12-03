export type SendingOrigin = "aws-workload" | "external";

export interface SesPricingConfig {
  outboundPerThousand: number;
  outboundFreeTier: number;
  outboundAttachmentPerGB: number;
  inboundPerThousand: number;
  inboundFreeTier: number;
  inboundAttachmentPerGB: number;
  dedicatedIpPerAddress: number;
}

export const SES_PRICING: SesPricingConfig = {
  outboundPerThousand: 0.1, // $0.10 per 1,000 outbound emails.
  outboundFreeTier: 62_000, // Free when sending from EC2, Elastic Beanstalk, or Lambda.
  outboundAttachmentPerGB: 0.12, // Attachments and data billed at $0.12 per GB sent.
  inboundPerThousand: 0.1, // $0.10 per 1,000 inbound emails.
  inboundFreeTier: 1_000, // First 1,000 inbound emails are free each month.
  inboundAttachmentPerGB: 0.09, // Inbound attachments billed at $0.09 per GB.
  dedicatedIpPerAddress: 24.95, // Dedicated IPs cost $24.95 per IP per month.
};

export interface QuoteInputs {
  outboundEmails: number;
  origin: SendingOrigin;
  avgOutboundSizeMB: number;
  inboundEmails: number;
  avgInboundSizeMB: number;
  dedicatedIpCount: number;
}

export interface QuoteBreakdown {
  outbound: number;
  outboundData: number;
  inbound: number;
  inboundData: number;
  dedicatedIp: number;
  total: number;
}

const PER_THOUSAND = 1000;
const MB_PER_GB = 1024;

export function calculateOutboundCost(
  emails: number,
  origin: SendingOrigin,
  pricing = SES_PRICING,
): number {
  const billable =
    origin === "aws-workload"
      ? Math.max(0, emails - pricing.outboundFreeTier)
      : emails;
  return (billable / PER_THOUSAND) * pricing.outboundPerThousand;
}

export const calculateInboundCost = (
  emails: number,
  pricing = SES_PRICING,
): number => {
  const billable = Math.max(0, emails - pricing.inboundFreeTier);
  return (billable / PER_THOUSAND) * pricing.inboundPerThousand;
};

export const calculateDataCost = (
  emails: number,
  avgSizeMB: number,
  ratePerGB: number,
): number => {
  const totalGB = (emails * avgSizeMB) / MB_PER_GB;
  return totalGB * ratePerGB;
};

export const calculateQuote = (
  inputs: QuoteInputs,
  pricing = SES_PRICING,
): QuoteBreakdown => {
  const outbound = calculateOutboundCost(inputs.outboundEmails, inputs.origin, pricing);
  const outboundData = calculateDataCost(
    inputs.outboundEmails,
    inputs.avgOutboundSizeMB,
    pricing.outboundAttachmentPerGB,
  );

  const inbound = calculateInboundCost(inputs.inboundEmails, pricing);
  const inboundData = calculateDataCost(
    inputs.inboundEmails,
    inputs.avgInboundSizeMB,
    pricing.inboundAttachmentPerGB,
  );

  const dedicatedIp = inputs.dedicatedIpCount * pricing.dedicatedIpPerAddress;
  const total = outbound + outboundData + inbound + inboundData + dedicatedIp;

  return { outbound, outboundData, inbound, inboundData, dedicatedIp, total };
};
