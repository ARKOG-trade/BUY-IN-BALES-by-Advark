import { useMemo, useState } from "react";
import {
  ArrowRight,
  MapPin,
  PackagePlus,
  Search,
  ShoppingCart,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";
import { useMarketplaceCart } from "@/contexts/MarketplaceCartContext";
type Listing = {
  id: number;
  supplierId: number;
  title: string;
  category: string;
  grade: string;
  description: string;
  imageUrl: string | null;
  quantityAvailable: number;
  price: string;
  currency: "NGN";
  location: string;
  supplierName: string;
  supplierLocation: string;
  createdAt: Date;
};
export default function Home() {
  const [search, setSearch] = useState("");
  const listings = (trpc as any).marketplace.listings.useQuery({
    search: search.trim() || undefined,
  });
  const { addItem } = useMarketplaceCart();
  const rows: Listing[] = useMemo(
    () => (listings.data ?? []) as Listing[],
    [listings.data]
  );
  return (
    <SiteShell>
      <section className="marketplace-page">
        <div className="marketplace-intro">
          <p className="eyebrow">BUY IN BALES MARKETPLACE</p>
          <h1>
            Find your next
            <br />
            <em>bale to sell.</em>
          </h1>
          <p>
            Browse published bale listings from suppliers. Catalogue
            availability and prices come directly from the marketplace.
          </p>
          <div className="marketplace-signup-links">
            <Link href="/register?role=retailer" className="button button-dark">
              Retailer registration <ArrowRight size={16} />
            </Link>
            <Link
              href="/register?role=supplier"
              className="button button-orange"
            >
              Supplier registration <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <figure className="marketplace-hero-visual">
          <img
            src="/manus-storage/async-images/VCeXky7I2EeRjwlvSmi47p/image-1.webp"
            alt="Neatly arranged bundles of second-hand clothing bales in a wholesale warehouse"
            loading="eager"
            fetchPriority="high"
          />
          <figcaption className="marketplace-hero-caption">
            <span>Okrika bales, ready for trade</span>
            <span>Neatly arranged · Built for resellers</span>
          </figcaption>
        </figure>
        <div className="catalogue-toolbar">
          <label className="catalogue-search">
            <Search size={18} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search bales, grades or locations"
              aria-label="Search listings"
            />
          </label>
          <span>
            {rows.length} published {rows.length === 1 ? "listing" : "listings"}
          </span>
        </div>
        {listings.isLoading ? (
          <div className="catalogue-state">Loading published bales…</div>
        ) : listings.isError ? (
          <div className="catalogue-state">
            We couldn’t load the catalogue. Please try again shortly.
          </div>
        ) : rows.length === 0 ? (
          <div className="catalogue-empty">
            <PackagePlus size={28} />
            <h2>No published bales yet</h2>
            <p>
              There are no supplier listings available right now. Check back
              later, or register as a supplier to publish a bale.
            </p>
            <Link
              href="/register?role=supplier"
              className="text-link text-link-ink"
            >
              Register as a supplier <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="catalogue-grid">
            {rows.map(item => (
              <article className="catalogue-card" key={item.id}>
                {item.imageUrl ? (
                  <img
                    className="catalogue-image"
                    src={item.imageUrl}
                    alt={`${item.title} bale`}
                  />
                ) : (
                  <div className="catalogue-image catalogue-image-empty">
                    <PackagePlus size={30} />
                    <span>Supplier listing</span>
                  </div>
                )}
                <div className="catalogue-card-body">
                  <p className="catalogue-supplier">{item.supplierName}</p>
                  <h2>{item.title}</h2>
                  <p className="catalogue-grade">
                    {item.category}
                    {item.grade ? ` · ${item.grade}` : ""}
                  </p>
                  <p className="catalogue-location">
                    <MapPin size={15} />
                    {item.location}
                  </p>
                  <div className="catalogue-card-meta">
                    <span>{item.quantityAvailable} available</span>
                    <strong>
                      {item.currency}{" "}
                      {Number(item.price).toLocaleString("en-NG")}
                    </strong>
                  </div>
                  <button
                    className="button button-orange button-wide"
                    type="button"
                    disabled={item.quantityAvailable < 1}
                    onClick={() => {
                      addItem(item.id);
                      toast.success("Bale added to your cart.");
                    }}
                  >
                    <ShoppingCart size={16} /> Add to cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
