import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, MapPin, Store } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";
export default function PartnerWithRetailer() {
  const retailers = (trpc as any).marketplace.eligibleRetailers.useQuery();
  type Retailer = { id: number; businessName: string; location: string };
  const eligible: Retailer[] = (retailers.data ?? []) as Retailer[];
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <SiteShell>
      <section className="retailer-partner-page">
        <p className="eyebrow">BALE PARTNERSHIP</p>
        <h1>
          Choose an eligible
          <br />
          <em>retailer partner.</em>
        </h1>
        <p className="partner-intro">
          Select the approved retailer who will sell your bale. Only business
          names and physical locations are shown here.
        </p>
        <div className="return-terms">
          <h2>Fixed return terms</h2>
          <p>
            The buyer receives the invested bale amount back plus 50% profit.
            Total payout is 150% of the investment.
          </p>
          <strong>Example: ₦100,000 investment → ₦150,000 total payout</strong>
        </div>
        {retailers.isLoading ? (
          <p className="retailer-state">Loading eligible retailers…</p>
        ) : retailers.isError ? (
          <p className="retailer-state">
            Eligible retailers could not be loaded right now.
          </p>
        ) : eligible.length ? (
          <div className="eligible-retailers">
            {eligible.map(r => (
              <label
                className={`eligible-retailer ${selected === r.id ? "selected" : ""}`}
                key={r.id}
              >
                <input
                  type="radio"
                  name="retailer"
                  value={r.id}
                  checked={selected === r.id}
                  onChange={() => setSelected(r.id)}
                />
                <Store size={21} />
                <span>
                  <strong>{r.businessName}</strong>
                  <small>
                    <MapPin size={14} />
                    {r.location}
                  </small>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="retailer-state">
            There are no eligible retailers available at the moment.
          </div>
        )}
        <div className="partner-actions">
          <Link href="/cart" className="text-link text-link-ink">
            Back to cart
          </Link>
          <Link
            href={
              selected
                ? `/checkout?mode=retailer_partner&retailerId=${selected}`
                : "#retailers"
            }
            onClick={e => {
              if (!selected) e.preventDefault();
            }}
            className={`button button-orange ${!selected ? "is-disabled" : ""}`}
          >
            Continue to checkout <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
