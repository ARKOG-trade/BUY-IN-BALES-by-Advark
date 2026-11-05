import { Link } from "wouter";
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";
import { useMarketplaceCart } from "@/contexts/MarketplaceCartContext";
const naira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;
export default function Cart() {
  const cart = useMarketplaceCart();
  const query = (trpc as any).marketplace.listings.useQuery({});
  const available: Array<{
    id: number;
    title: string;
    category: string;
    grade: string;
    location: string;
    price: string;
    supplierName: string;
    quantityAvailable: number;
  }> = (query.data ?? []) as any;
  const lines = cart.items
    .map(line => ({
      ...line,
      listing: available.find(x => x.id === line.listingId),
    }))
    .filter(line => line.listing);
  const subtotal = lines.reduce(
    (sum, line) => sum + Number(line.listing!.price) * line.quantity,
    0
  );
  return (
    <SiteShell>
      <section className="cart-page">
        <p className="eyebrow">YOUR SELECTION</p>
        <h1>
          Your bale <em>cart.</em>
        </h1>
        {query.isLoading ? (
          <p className="cart-state">Loading current catalogue prices…</p>
        ) : lines.length === 0 ? (
          <div className="cart-empty">
            <ShoppingCart size={28} />
            <h2>Your cart is empty</h2>
            <p>Add published bales from the marketplace to get started.</p>
            <Link href="/" className="button button-orange">
              Browse marketplace <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-lines">
              {lines.map(line => (
                <article className="cart-line" key={line.listingId}>
                  <div>
                    <p className="catalogue-supplier">
                      {line.listing!.supplierName}
                    </p>
                    <h2>{line.listing!.title}</h2>
                    <p>
                      {line.listing!.category} · {line.listing!.grade} ·{" "}
                      {line.listing!.location}
                    </p>
                    <strong>{naira(Number(line.listing!.price))} each</strong>
                  </div>
                  <div className="cart-line-controls">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() =>
                        cart.setQuantity(line.listingId, line.quantity - 1)
                      }
                    >
                      <Minus size={15} />
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      aria-label="Increase quantity"
                      disabled={
                        line.quantity >= line.listing!.quantityAvailable
                      }
                      onClick={() =>
                        cart.setQuantity(line.listingId, line.quantity + 1)
                      }
                    >
                      <Plus size={15} />
                    </button>
                    <button
                      aria-label="Remove item"
                      onClick={() => cart.removeItem(line.listingId)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <strong>
                    {naira(Number(line.listing!.price) * line.quantity)}
                  </strong>
                </article>
              ))}
            </div>
            <div className="cart-summary">
              <span>Current catalogue subtotal</span>
              <strong>{naira(subtotal)}</strong>
              <p>
                Final prices are recalculated by the marketplace when you submit
                an order request.
              </p>
              <div className="cart-actions">
                <Link href="/checkout" className="button button-orange">
                  Direct purchase <ArrowRight size={16} />
                </Link>
                <Link
                  href="/partner-with-retailer"
                  className="button button-dark"
                >
                  Partner with a retailer <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </>
        )}
      </section>
    </SiteShell>
  );
}
