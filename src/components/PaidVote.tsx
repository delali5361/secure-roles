import { useState } from "react";
import { Btn, Modal } from "@/components/ui-kit";
import { actions, ghs, MAX_VOTES_PER_PAYMENT, type Candidacy, type Election, type Payment, type Position, type User } from "@/lib/store";

const QUICK = [1, 5, 10, 50, 100];

/** Pick a quantity, then pay through a simulated Paystack checkout. */
export function BuyVotes({ e, p, c, nominee, me, onClose, onPaid }: { e: Election; p: Position; c: Candidacy; nominee: string; me: User; onClose: () => void; onPaid: (pay: Payment) => void }) {
  const [qty, setQty] = useState(1);
  const [step, setStep] = useState<"qty" | "pay" | "processing">("qty");
  const [method, setMethod] = useState<"momo" | "card">("momo");
  const [momo, setMomo] = useState({ network: "MTN", phone: me.phone });
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const [err, setErr] = useState("");
  const price = p.price ?? 0;
  const total = Math.round(qty * price * 100) / 100;

  const pay = () => {
    setErr("");
    if (method === "momo" && !/^\+?\d{10,13}$/.test(momo.phone.replace(/\s/g, ""))) return setErr("Enter a valid mobile money number.");
    if (method === "card") {
      if (!/^\d{16}$/.test(card.number.replace(/\s/g, ""))) return setErr("Card number must be 16 digits.");
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) return setErr("Expiry must look like MM/YY.");
      if (!/^\d{3}$/.test(card.cvv)) return setErr("CVV must be 3 digits.");
    }
    setStep("processing");
    setTimeout(() => {
      try { onPaid(actions.buyVotes({ electionId: e.id, positionId: p.id, candidacyId: c.id, quantity: qty, method })); }
      catch (x) { setErr((x as Error).message); setStep("pay"); }
    }, 1400);
  };

  return (
    <Modal open onClose={step === "processing" ? () => {} : onClose} title={step === "qty" ? `Vote for ${nominee}` : "Paystack checkout"}>
      {step === "qty" && (
        <div className="space-y-4">
          <p className="text-[13px] text-muted-foreground">{p.title} · {ghs(price)} per vote. Buy as many votes as you like.</p>
          <div className="flex flex-wrap gap-2">{QUICK.map((n) => <Btn key={n} size="sm" variant={qty === n ? "brand" : "soft"} onClick={() => setQty(n)}>{n}</Btn>)}</div>
          <label className="block text-[13px]">Number of votes
            <input type="number" min={1} max={MAX_VOTES_PER_PAYMENT} className="field mt-1" value={qty} onChange={(ev) => setQty(Math.max(1, Math.min(MAX_VOTES_PER_PAYMENT, Math.floor(+ev.target.value || 1))))} />
          </label>
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <span className="text-muted-foreground">Total</span><span className="font-display text-2xl font-bold text-mint">{ghs(total)}</span>
          </div>
          <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={() => setStep("pay")}>Continue to payment</Btn></div>
        </div>
      )}
      {step !== "qty" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div><p className="text-[12px] text-muted-foreground">{me.email}</p><p className="text-[13px]">{qty} vote{qty === 1 ? "" : "s"} · {nominee}</p></div>
            <p className="font-display text-xl font-bold">{ghs(total)}</p>
          </div>
          <div className="flex gap-2">
            <Btn size="sm" variant={method === "momo" ? "brand" : "soft"} onClick={() => setMethod("momo")}>Mobile Money</Btn>
            <Btn size="sm" variant={method === "card" ? "brand" : "soft"} onClick={() => setMethod("card")}>Card</Btn>
          </div>
          {method === "momo" ? (
            <div className="grid gap-2 sm:grid-cols-3">
              <select className="field" value={momo.network} onChange={(ev) => setMomo({ ...momo, network: ev.target.value })}><option>MTN</option><option>Telecel</option><option>AirtelTigo</option></select>
              <input className="field sm:col-span-2" placeholder="Mobile money number" value={momo.phone} onChange={(ev) => setMomo({ ...momo, phone: ev.target.value })} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <input className="field col-span-2 font-mono" placeholder="4084 0840 8408 4081" inputMode="numeric" value={card.number} onChange={(ev) => setCard({ ...card, number: ev.target.value })} />
              <input className="field font-mono" placeholder="MM/YY" value={card.expiry} onChange={(ev) => setCard({ ...card, expiry: ev.target.value })} />
              <input className="field font-mono" placeholder="CVV" inputMode="numeric" value={card.cvv} onChange={(ev) => setCard({ ...card, cvv: ev.target.value })} />
            </div>
          )}
          {err && <p className="text-[13px] text-destructive">{err}</p>}
          <Btn className="w-full" disabled={step === "processing"} onClick={pay}>{step === "processing" ? "Processing payment…" : `Pay ${ghs(total)}`}</Btn>
          <p className="text-center text-[11px] text-muted-foreground">Test mode · simulated Paystack · no real money is charged</p>
          {step === "pay" && <Btn variant="ghost" size="sm" onClick={() => setStep("qty")}>← Change quantity</Btn>}
        </div>
      )}
    </Modal>
  );
}
