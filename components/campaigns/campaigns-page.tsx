"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import {
  CheckCircle2, Clock, Loader2, Mail, MessageSquare,
  Send, Star, AlertCircle, Info,
} from "lucide-react";

const MOCK_CAMPAIGNS = [
  { id: "c1", type: "WHATSAPP", recipient: "+91 98765 43210", sentAt: new Date(Date.now() - 2 * 86400000).toISOString(), clickedAt: new Date(Date.now() - 1.5 * 86400000).toISOString(), reviewedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "c2", type: "EMAIL",    recipient: "rahul@example.com", sentAt: new Date(Date.now() - 5 * 86400000).toISOString(), clickedAt: null, reviewedAt: null },
  { id: "c3", type: "WHATSAPP", recipient: "+91 87654 32109", sentAt: new Date(Date.now() - 7 * 86400000).toISOString(), clickedAt: new Date(Date.now() - 6 * 86400000).toISOString(), reviewedAt: null },
];

type CampaignType = "WHATSAPP" | "EMAIL";

export function CampaignsPage() {
  const [recipient, setRecipient] = useState("");
  const [campaignType, setCampaignType] = useState<CampaignType>("WHATSAPP");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!recipient.trim()) return;
    setSending(true);

    try {
      const res = await fetch("/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: recipient.trim(), type: campaignType }),
      });

      let data: { error?: string; message?: string; campaignId?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON body */ }

      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }

      toast({
        title: campaignType === "WHATSAPP" ? "✅ WhatsApp Sent!" : "✅ Email Sent!",
        description: data.message ?? `Review request sent to ${recipient}.`,
      });
      setRecipient("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send";
      toast({ title: "❌ Failed to send", description: message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  function getCampaignStatus(c: typeof MOCK_CAMPAIGNS[0]) {
    if (c.reviewedAt) return { label: "Reviewed",  icon: Star,         color: "success" as const };
    if (c.clickedAt)  return { label: "Clicked",   icon: CheckCircle2, color: "warning" as const };
    return                  { label: "Sent",       icon: Clock,        color: "secondary" as const };
  }

  const stats = {
    sent:     MOCK_CAMPAIGNS.length,
    clicked:  MOCK_CAMPAIGNS.filter(c => c.clickedAt).length,
    reviewed: MOCK_CAMPAIGNS.filter(c => c.reviewedAt).length,
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Requests Sent", value: stats.sent,     icon: Send,         color: "#7B5CFF" },
          { label: "Link Clicked",  value: stats.clicked,  icon: CheckCircle2, color: "#22C55E" },
          { label: "Reviews Left",  value: stats.reviewed, icon: Star,         color: "#FFB020" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "#0C1020", border: "1px solid #1E2540" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs" style={{ color: "#5D6590" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Send new campaign */}
      <div className="rounded-2xl p-5" style={{ background: "#0C1020", border: "1px solid #1E2540" }}>
        <h2 className="font-bold text-white mb-1">Send Review Request</h2>
        <p className="text-sm mb-4" style={{ color: "#5D6590" }}>
          Send a personalised review request to your customer via WhatsApp or Email.
        </p>

        <Tabs value={campaignType} onValueChange={v => setCampaignType(v as CampaignType)}>
          <TabsList className="mb-4" style={{ background: "#060818", border: "1px solid #1E2540" }}>
            <TabsTrigger value="WHATSAPP" className="gap-2 data-[state=active]:text-white">
              <MessageSquare className="h-4 w-4" /> WhatsApp
            </TabsTrigger>
            <TabsTrigger value="EMAIL" className="gap-2 data-[state=active]:text-white">
              <Mail className="h-4 w-4" /> Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="WHATSAPP">
            {/* WhatsApp setup notice */}
            <div className="flex gap-3 p-3 rounded-xl mb-4"
              style={{ background: "#0A1628", border: "1px solid #1E3A6A" }}>
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
              <div className="text-xs" style={{ color: "#7BA7D4" }}>
                <p className="font-semibold text-blue-300 mb-1">WhatsApp Setup Required</p>
                <p>Recipient must first opt-in to your Twilio WhatsApp Sandbox by sending:</p>
                <code className="block mt-1 px-2 py-1 rounded text-blue-200"
                  style={{ background: "#0C1E38", fontFamily: "monospace" }}>
                  join &lt;your-sandbox-keyword&gt;
                </code>
                <p className="mt-1">to <span className="text-blue-200 font-mono">+1 415 523 8886</span> on WhatsApp.
                  Or use a <a href="https://www.twilio.com/whatsapp" target="_blank" rel="noopener noreferrer"
                    className="underline text-blue-300">Twilio WhatsApp Business approved number</a>.</p>
              </div>
            </div>
            <form onSubmit={handleSend} className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="phone" className="sr-only">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  className="bg-[#060818] border-[#1E2540] text-white placeholder:text-[#5D6590]"
                  required
                />
              </div>
              <Button type="submit" disabled={sending}
                className="gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white border-0">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                {sending ? "Sending…" : "Send WhatsApp"}
              </Button>
            </form>
            <p className="text-xs mt-2" style={{ color: "#5D6590" }}>
              Uses Twilio WhatsApp Business API. Requires TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_WHATSAPP_FROM env vars.
            </p>
          </TabsContent>

          <TabsContent value="EMAIL">
            <form onSubmit={handleSend} className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="email" className="sr-only">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="customer@example.com"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  className="bg-[#060818] border-[#1E2540] text-white placeholder:text-[#5D6590]"
                  required
                />
              </div>
              <Button type="submit" disabled={sending}
                className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white border-0">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "Sending…" : "Send Email"}
              </Button>
            </form>
            <p className="text-xs mt-2" style={{ color: "#5D6590" }}>
              Sent via Resend. Requires RESEND_API_KEY env var. Available on Starter plan and above.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Campaign history */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#0C1020", border: "1px solid #1E2540" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#1E2540" }}>
          <h3 className="font-semibold text-white">Campaign History</h3>
        </div>
        <div className="divide-y" style={{ borderColor: "#1E2540" }}>
          {MOCK_CAMPAIGNS.map(c => {
            const status = getCampaignStatus(c);
            const StatusIcon = status.icon;
            return (
              <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: c.type === "WHATSAPP" ? "#16A34A18" : "#6366F118",
                      border: `1px solid ${c.type === "WHATSAPP" ? "#16A34A30" : "#6366F130"}`,
                    }}>
                    {c.type === "WHATSAPP"
                      ? <MessageSquare className="h-4 w-4 text-green-400" />
                      : <Mail className="h-4 w-4 text-indigo-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{c.recipient}</p>
                    <p className="text-xs" style={{ color: "#5D6590" }}>{formatDate(c.sentAt)}</p>
                  </div>
                </div>
                <Badge variant={status.color} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
