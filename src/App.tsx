import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  type QuoteBreakdown,
  type QuoteInputs,
  type SendingOrigin,
  calculateQuote,
} from "@/lib/pricing";

const defaultInputs: QuoteInputs = {
  outboundEmails: 150_000,
  origin: "aws-workload",
  avgOutboundSizeMB: 0.11, // ~110 KB per campaign email.
  inboundEmails: 10_000,
  avgInboundSizeMB: 0.2,
  dedicatedIpCount: 0,
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const nprCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "NPR",
  minimumFractionDigits: 0,
});

const USD_TO_NPR = 133;

const commaNumber = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number) => currency.format(value || 0);

export default function App() {
  const [inputs, setInputs] = useState<QuoteInputs>(defaultInputs);
  const [includeInbound, setIncludeInbound] = useState(true);
  const [surcharge, setSurcharge] = useState(4);

  const quote = useMemo<QuoteBreakdown>(() => {
    const sanitized: QuoteInputs = {
      ...inputs,
      inboundEmails: includeInbound ? inputs.inboundEmails : 0,
      avgInboundSizeMB: includeInbound ? inputs.avgInboundSizeMB : 0,
    };
    return calculateQuote(sanitized);
  }, [inputs, includeInbound]);

  const totalWithSurcharge = quote.total + surcharge;
  const totalInNpr = totalWithSurcharge * USD_TO_NPR;
  const effectiveCpm =
    inputs.outboundEmails > 0 ? totalWithSurcharge / (inputs.outboundEmails / 1000) : 0;
  const costPerEmail =
    inputs.outboundEmails > 0 ? totalWithSurcharge / inputs.outboundEmails : 0;

  const handleNumberChange =
    (field: keyof QuoteInputs) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number(event.target.value);
      setInputs((prev: QuoteInputs) => ({
        ...prev,
        [field]: isNaN(nextValue) ? 0 : Math.max(0, nextValue),
      }));
    };

  const handleOriginChange = (value: SendingOrigin) => {
    setInputs((prev: QuoteInputs) => ({ ...prev, origin: value }));
  };

  const handleSurchargeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);
    setSurcharge(isNaN(nextValue) ? 0 : Math.max(0, nextValue));
  };

  const resetDefaults = () => {
    setInputs(defaultInputs);
    setIncludeInbound(true);
  };

  const breakdownRows = [
    {
      label: "Outbound sending",
      value: quote.outbound,
    },
    {
      label: "Outbound data transfer",
      value: quote.outboundData,
    },
    includeInbound && {
      label: "Inbound email processing",
      value: quote.inbound,
    },
    includeInbound && {
      label: "Inbound data transfer",
      value: quote.inboundData,
    },
    inputs.dedicatedIpCount > 0 && {
      label: `Dedicated IP add-on (${inputs.dedicatedIpCount})`,
      value: quote.dedicatedIp,
    },
    surcharge > 0 && {
      label: "Infrastructure surcharge",
      value: surcharge,
    },
  ].filter(Boolean) as { label: string; value: number }[];

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 lg:px-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">SES internal quote</h1>
          <p className="text-sm text-muted-foreground">
            Quick estimator for client emails, based on the public{" "}
            <a className="text-primary underline" href="https://aws.amazon.com/ses/pricing/" target="_blank" rel="noreferrer">
              SES pricing table
            </a>.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Email parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="outboundEmails">Outbound emails / month</Label>
                  <Input
                    id="outboundEmails"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={inputs.outboundEmails}
                    onChange={handleNumberChange("outboundEmails")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origin">Sending origin</Label>
                  <Select
                    value={inputs.origin}
                    onValueChange={(value: string) =>
                      handleOriginChange(value as SendingOrigin)
                    }
                  >
                    <SelectTrigger id="origin">
                      <SelectValue placeholder="Choose origin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aws-workload">
                        AWS compute (EC2/Lambda/Elastic Beanstalk)
                      </SelectItem>
                      <SelectItem value="external">External or on-premises systems</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avgOutboundSize">Average outbound size (MB)</Label>
                  <Input
                    id="avgOutboundSize"
                    type="number"
                    step="0.01"
                    min={0}
                    value={inputs.avgOutboundSizeMB}
                    onChange={handleNumberChange("avgOutboundSizeMB")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dedicatedIpCount">Dedicated IP addresses</Label>
                  <Input
                    id="dedicatedIpCount"
                    type="number"
                    min={0}
                    value={inputs.dedicatedIpCount}
                    onChange={handleNumberChange("dedicatedIpCount")}
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Include inbound email pricing</p>
                  <Switch
                    checked={includeInbound}
                    onCheckedChange={(checked: boolean) => setIncludeInbound(checked)}
                    aria-label="Toggle inbound pricing"
                  />
                </div>
                {includeInbound && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="inboundEmails">Inbound emails / month</Label>
                      <Input
                        id="inboundEmails"
                        type="number"
                        min={0}
                        value={inputs.inboundEmails}
                        onChange={handleNumberChange("inboundEmails")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avgInboundSize">Average inbound size (MB)</Label>
                      <Input
                        id="avgInboundSize"
                        type="number"
                        min={0}
                        step="0.01"
                        value={inputs.avgInboundSizeMB}
                        onChange={handleNumberChange("avgInboundSizeMB")}
                      />
                    </div>
                  </div>
                )}
              </section>

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={resetDefaults} variant="secondary">
                  Reset defaults
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setInputs((prev: QuoteInputs) => ({
                      ...prev,
                      outboundEmails: 62_000,
                      origin: "aws-workload",
                    }))
                  }
                >
                  Apply AWS free tier
                </Button>
              </div>

              <section className="space-y-2 rounded-lg border p-4">
                <Label htmlFor="surcharge">Monthly infrastructure surcharge (USD)</Label>
                <Input
                  id="surcharge"
                  type="number"
                  min={0}
                  step="0.5"
                  value={surcharge}
                  onChange={handleSurchargeChange}
                />
              </section>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader className="space-y-1">
              <CardTitle>Quote summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border bg-primary/5 p-4">
                <p className="text-xs uppercase text-muted-foreground">Monthly total</p>
                <p className="text-3xl font-semibold">{formatCurrency(totalWithSurcharge)}</p>
                {inputs.outboundEmails > 0 && (
                  <p className="text-sm text-muted-foreground">
                    CPM {formatCurrency(effectiveCpm)} • Per email ${costPerEmail.toFixed(4)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  ≈ {nprCurrency.format(totalInNpr)} (rate: 1 USD ≈ {USD_TO_NPR} NPR)
                </p>
              </div>

              <div className="rounded-lg border">
                <div className="grid grid-cols-2 gap-0 divide-x text-xs text-muted-foreground">
                  <div className="p-3">
                    <p className="uppercase">Outbound</p>
                    <p className="text-lg font-semibold">
                      {commaNumber.format(inputs.outboundEmails)}
                    </p>
                  </div>
                  <div className="p-3">
                    <p className="uppercase">Inbound</p>
                    <p className="text-lg font-semibold">
                      {includeInbound ? commaNumber.format(inputs.inboundEmails) : "0"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border">
                {breakdownRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between px-4 py-2 text-sm"
                  >
                    <span>{row.label}</span>
                    <span className="font-medium">{formatCurrency(row.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
