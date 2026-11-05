import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, CircleCheck } from "lucide-react";
import { toast } from "sonner";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";
import { useMarketplaceCart } from "@/contexts/MarketplaceCartContext";
const naira = (n: number | string) => `₦${Number(n).toLocaleString("en-NG")}`;
export default function Checkout() {
  const params = new URLSearchParams(window.location.search);
  const [mode, setMode] = useState<"direct" | "retailer_partner">(
    params.get("mode") === "retailer_partner" ? "retailer_partner" : "direct"
  );
  const retailerId = params.get("retailerId");
  const eligible = (trpc as any).marketplace.eligibleRetailers.useQuery();
  const selectedRetailer = (eligible.data ?? []).find(
    (r: { id: number }) => String(r.id) === retailerId
  );
  const cart = useMarketplaceCart();
  const catalogue = trpc.marketplace.listings.useQuery({});
  const checkoutLines = cart.items.map(line => ({
    ...line,
    listing: catalogue.data?.find(item => item.id === line.listingId),
  }));
  const investment = checkoutLines.reduce(
    (sum, line) =>
      sum + (line.listing ? Number(line.listing.price) * line.quantity : 0),
    0
  );
  const fixedProfit = Math.round(investment * 50) / 100;
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<PlaceOrderResult | null>(null);
  const place = trpc.marketplace.placeOrder.useMutation({
    onSuccess: data => {
      setResult(data);
      cart.clearCart();
      toast.success("Order request submitted.");
    },
    onError: e => {
      toast.error(e.message);
    },
  });
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cart.items.length) {
      toast.error("Your cart is empty.");
      return;
    }
    const d = new FormData(e.currentTarget);
    if (mode === "retailer_partner" && !retailerId) {
      toast.error("Select an eligible retailer before checkout.");
      setLocation("/partner-with-retailer");
      return;
    }
    place.mutate({
      buyerName: String(d.get("buyerName")),
      buyerEmail: String(d.get("buyerEmail")),
      buyerPhone: String(d.get("buyerPhone")),
      deliveryLocation: String(d.get("deliveryLocation")),
      mode,
      ...(mode === "retailer_partner"
        ? { retailerId: Number(retailerId) }
        : {}),
      items: cart.items.map(({ listingId, quantity }) => ({
        listingId,
        quantity,
      })),
    });
  }
  if (result)
    return (
      <SiteShell>
        <section className="checkout-result">
          <CircleCheck size={36} />
          <p className="eyebrow">ORDER REQUEST RECEIVED</p>
          <h1>Reference {result.orderRef}</h1>
          <p>Payment pending — no charge has been made.</p>
          {mode === "retailer_partner" && (
            <div className="payout-summary">
              <p>
                Investment <strong>{naira(result.investmentAmount)}</strong>
              </p>
              <p>
                Fixed profit (50%) <strong>{naira(result.profitAmount)}</strong>
              </p>
              <p>
                Total payout (150%){" "}
                <strong>{naira(result.totalPayoutAmount)}</strong>
              </p>
            </div>
          )}
          <p>
            Your request is recorded. Payment is not collected through this
            checkout.
          </p>
          <a className="button button-dark" href="/">
            Return to marketplace
          </a>
        </section>
      </SiteShell>
    );
  return (
    <SiteShell>
      <section className="checkout-page">
        <p className="eyebrow">GUEST CHECKOUT</p>
        <h1>
          Request your <em>bale order.</em>
        </h1>
        <p>
          Submitting creates an order request only. No payment is charged here.
        </p>
        <div className="checkout-mode">
          <label>
            <input
              type="radio"
              checked={mode === "direct"}
              onChange={() => setMode("direct")}
            />{" "}
            Direct purchase
          </label>
          <label>
            <input
              type="radio"
              checked={mode === "retailer_partner"}
              onChange={() => setMode("retailer_partner")}
            />{" "}
            Partner with a retailer
          </label>
        </div>
        {mode === "retailer_partner" && (
          <p className="checkout-retailer">
            {selectedRetailer
              ? `Selected retailer: ${selectedRetailer.businessName} · ${selectedRetailer.location}`
              : "No eligible retailer selected"}{" "}
            <a href="/partner-with-retailer">Change retailer</a>
          </p>
        )}
        <div className="checkout-order-summary">
          <h2>Order summary</h2>
          {catalogue.isLoading ? (
            <p>Loading current catalogue prices…</p>
          ) : checkoutLines.length === 0 ? (
            <p>Your cart is empty. Add bales from the marketplace first.</p>
          ) : checkoutLines.some(line => !line.listing) ? (
            <p>
              One or more cart items are no longer listed. Return to your cart
              to review.
            </p>
          ) : (
            <>
              {checkoutLines.map(line => (
                <p className="checkout-summary-line" key={line.listingId}>
                  <span>
                    {line.listing!.title} × {line.quantity}
                  </span>
                  <strong>
                    {naira(Number(line.listing!.price) * line.quantity)}
                  </strong>
                </p>
              ))}
              <p className="checkout-summary-line">
                <span>
                  {mode === "retailer_partner"
                    ? "Investment"
                    : "Current order total"}
                </span>
                <strong>{naira(investment)}</strong>
              </p>
              {mode === "retailer_partner" && (
                <>
                  <p className="checkout-summary-line">
                    <span>Fixed profit (50%)</span>
                    <strong>{naira(fixedProfit)}</strong>
                  </p>
                  <p className="checkout-summary-line payout-total">
                    <span>Total payout (150%)</span>
                    <strong>{naira(investment + fixedProfit)}</strong>
                  </p>
                </>
              )}
              <small>
                Estimate based on current listed bale prices; the server
                rechecks prices and stock when you submit. No delivery fees are
                included or charged.
              </small>
            </>
          )}
        </div>
        <form className="form-stack checkout-form" onSubmit={submit}>
          <label>
            Buyer name
            <input
              name="buyerName"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <label>
            Email
            <input
              name="buyerEmail"
              type="email"
              autoComplete="email"
              required
              maxLength={320}
            />
          </label>
          <label>
            Phone
            <input
              name="buyerPhone"
              type="tel"
              autoComplete="tel"
              required
              minLength={7}
              maxLength={48}
            />
          </label>
          <label>
            Physical delivery / fulfilment location
            <textarea
              name="deliveryLocation"
              autoComplete="street-address"
              rows={3}
              required
              minLength={5}
              maxLength={200}
            />
          </label>
          <button
            className="button button-orange"
            type="submit"
            disabled={
              place.isPending ||
              cart.items.length === 0 ||
              catalogue.isLoading ||
              checkoutLines.some(line => !line.listing)
            }
          >
            {place.isPending ? "Submitting request…" : "Submit order request"}
            <ArrowRight size={16} />
          </button>
        </form>
      </section>
    </SiteShell>
  );
}
type PlaceOrderResult = {
  orderId: number;
  orderRef: string;
  investmentAmount: string;
  profitAmount: string;
  totalPayoutAmount: string | number;
  paymentStatus: string;
};
