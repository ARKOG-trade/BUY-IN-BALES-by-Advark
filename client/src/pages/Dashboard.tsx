import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  ChartNoAxesCombined,
  CircleDollarSign,
  PackagePlus,
  RefreshCw,
  Store,
  Truck,
  Archive,
  Pencil,
  ImagePlus,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

function money(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
function dealLabel(type: string) {
  if (type === "fixed_return") return "Fixed return";
  if (type === "profit_split") return "Legacy profit split";
  return "Own-business bale";
}
function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="metric-card">
      <span className="metric-icon">{icon}</span>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const account = trpc.account.me.useQuery();
  const role = account.data?.role;
  const retailer = trpc.retailer.snapshot.useQuery(undefined, {
    enabled: role === "retailer",
  });
  const funded = trpc.retailer.fundedOrders.useQuery(undefined, {
    enabled: role === "retailer",
  });
  const wholesaler = trpc.wholesaler.retailerPerformance.useQuery(undefined, {
    enabled: role === "wholesaler",
  });
  const supplierListings = trpc.supplier.myListings.useQuery(undefined, {
    enabled: role === "supplier",
  });
  const supplierOrders = trpc.supplier.myOrders.useQuery(undefined, {
    enabled: role === "supplier",
  });
  const [selectedDeal, setSelectedDeal] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const addDeal = trpc.retailer.addDeal.useMutation({
    onSuccess: async () => {
      toast.success("Bale record added.");
      await queryClient.invalidateQueries();
    },
    onError: e => toast.error(e.message),
  });
  const addProgress = trpc.retailer.addProgress.useMutation({
    onSuccess: async () => {
      toast.success("Progress update saved.");
      await queryClient.invalidateQueries();
    },
    onError: e => toast.error(e.message),
  });
  const setSharing = trpc.retailer.setPerformanceSharing.useMutation({
    onSuccess: async () => {
      toast.success("Your sharing preference was updated.");
      await queryClient.invalidateQueries();
    },
    onError: e => toast.error(e.message),
  });
  const orderProgress = trpc.retailer.recordOrderProgress.useMutation({
    onSuccess: async () => {
      toast.success("Order progress saved.");
      await queryClient.invalidateQueries();
    },
    onError: e => {
      toast.error(e.message);
    },
  });
  const remittance = trpc.retailer.recordRemittance.useMutation({
    onSuccess: async () => {
      toast.success("Remittance recorded.");
      await queryClient.invalidateQueries();
    },
    onError: e => {
      toast.error(e.message);
    },
  });
  const createListing = trpc.supplier.createListing.useMutation({
    onSuccess: async () => {
      toast.success("Listing published.");
      await queryClient.invalidateQueries();
    },
    onError: e => {
      toast.error(e.message);
    },
  });
  const updateListing = trpc.supplier.updateListing.useMutation({
    onSuccess: async () => {
      toast.success("Listing updated.");
      setEditingId(null);
      await queryClient.invalidateQueries();
    },
    onError: e => {
      toast.error(e.message);
    },
  });
  const archiveListing = trpc.supplier.archiveListing.useMutation({
    onSuccess: async () => {
      toast.success("Listing archived.");
      await queryClient.invalidateQueries();
    },
    onError: e => {
      toast.error(e.message);
    },
  });
  const uploadPhoto = trpc.supplier.uploadListingPhoto.useMutation({
    onError: e => {
      toast.error(e.message);
    },
  });

  useEffect(() => {
    if (!account.isLoading && !account.data) setLocation("/login");
  }, [account.isLoading, account.data, setLocation]);
  useEffect(() => {
    const first = retailer.data?.deals?.[0];
    if (first && !selectedDeal) setSelectedDeal(String(first.id));
  }, [retailer.data?.deals, selectedDeal]);
  if (account.isLoading || !account.data)
    return (
      <SiteShell>
        <div className="page-loading">
          <RefreshCw className="spin" /> Loading your business view…
        </div>
      </SiteShell>
    );

  if (role === "supplier") {
    const listings = supplierListings.data ?? [];
    function saveListing(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const form = event.currentTarget;
      const d = new FormData(form);
      const fields = {
        title: String(d.get("title")).trim(),
        category: String(d.get("category")).trim(),
        grade: String(d.get("grade")).trim(),
        description: String(d.get("description")).trim(),
        imageUrl: String(d.get("imageUrl") ?? "") || undefined,
        quantityAvailable: Number(d.get("quantityAvailable")),
        price: String(d.get("price")),
        location: String(d.get("location")).trim(),
      };
      if (
        !fields.title ||
        !fields.category ||
        !fields.grade ||
        !fields.location ||
        fields.quantityAvailable < 0 ||
        Number(fields.price) <= 0
      ) {
        toast.error(
          "Complete all required fields with a valid price and stock."
        );
        return;
      }
      if (editingId) updateListing.mutate({ id: editingId, ...fields });
      else {
        createListing.mutate(fields);
        form.reset();
      }
    }
    async function selectPhoto(event: React.ChangeEvent<HTMLInputElement>) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 4 * 1024 * 1024
      ) {
        toast.error("Choose a JPEG, PNG, or WebP image no larger than 4 MiB.");
        return;
      }
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await uploadPhoto.mutateAsync({ imageDataUrl });
      const input = document.querySelector<HTMLInputElement>("[name=imageUrl]");
      if (input) input.value = result.imageUrl;
      toast.success("Photo uploaded.");
    }
    return (
      <SiteShell>
        <section className="dashboard-page supplier-dashboard">
          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">Supplier workspace</p>
              <h1>
                Bring your stock
                <br />
                <em>to market.</em>
              </h1>
              <p>
                Publish bales at your own NGN prices and manage stock and
                relevant orders.
              </p>
            </div>
            <div className="dashboard-role-badge">
              <Truck size={17} /> Supplier · {account.data.businessName}
            </div>
          </div>
          <div className="supplier-work-grid">
            <div className="dashboard-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Your listings</p>
                  <h2>Published stock</h2>
                </div>
                <span className="count-pill">{listings.length} listings</span>
              </div>
              {supplierListings.isLoading ? (
                <div className="panel-empty">
                  <RefreshCw className="spin" /> Loading listings…
                </div>
              ) : listings.length ? (
                <div className="supplier-listings">
                  {listings.map((item: any) => (
                    <article className="supplier-listing" key={item.id}>
                      {item.imageUrl && (
                        <img
                          className="supplier-listing-photo"
                          src={item.imageUrl}
                          alt={item.title}
                        />
                      )}
                      <div>
                        <span className="deal-row-tag">
                          {item.category} · {item.grade}
                        </span>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                        <p className="deal-row-meta">
                          {money(Number(item.price))} / bale ·{" "}
                          {item.quantityAvailable} available · {item.location}
                        </p>
                        <span className="deal-status">
                          {item.status ?? "Published"}
                        </span>
                        <div className="supplier-listing-actions">
                          <button
                            type="button"
                            className="button button-light"
                            onClick={() => {
                              setEditingId(item.id);
                              const form =
                                document.querySelector<HTMLFormElement>(
                                  ".listing-form"
                                );
                              if (!form) return;
                              for (const [key, value] of Object.entries(item)) {
                                const field = form.elements.namedItem(key) as
                                  | HTMLInputElement
                                  | HTMLTextAreaElement
                                  | null;
                                if (field && value != null)
                                  field.value = String(value);
                              }
                            }}
                          >
                            {" "}
                            <Pencil size={15} /> Edit
                          </button>
                          <button
                            type="button"
                            className="button button-light"
                            onClick={() =>
                              archiveListing.mutate({ id: item.id })
                            }
                            disabled={archiveListing.isPending}
                          >
                            <Archive size={15} /> Archive
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="panel-empty">
                  <Boxes size={26} />
                  <h3>No listings yet</h3>
                  <p>
                    Create a listing to publish available bales at your price.
                  </p>
                </div>
              )}
            </div>
            <div className="dashboard-side-panels">
              <div className="dashboard-panel compact-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">
                      {editingId ? "Edit listing" : "New listing"}
                    </p>
                    <h2>{editingId ? "Update stock" : "Publish a bale"}</h2>
                  </div>
                  <PackagePlus size={20} />
                </div>
                <form
                  className="form-stack compact-form listing-form"
                  onSubmit={saveListing}
                >
                  <label>
                    Title
                    <input
                      name="title"
                      required
                      minLength={2}
                      maxLength={120}
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      Category
                      <input name="category" required maxLength={80} />
                    </label>
                    <label>
                      Grade
                      <input name="grade" required maxLength={80} />
                    </label>
                  </div>
                  <label>
                    Description
                    <textarea
                      name="description"
                      rows={3}
                      required
                      maxLength={1000}
                    />
                  </label>
                  <label>
                    Photo <span className="optional-label">optional</span>
                    <input name="imageUrl" placeholder="Image URL or upload" />
                    <span className="photo-upload-control">
                      <ImagePlus size={16} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={selectPhoto}
                        disabled={uploadPhoto.isPending}
                      />
                    </span>
                  </label>
                  <div className="form-row">
                    <label>
                      Quantity available
                      <input
                        name="quantityAvailable"
                        type="number"
                        min="0"
                        step="1"
                        required
                      />
                    </label>
                    <label>
                      Price (NGN)
                      <input
                        name="price"
                        type="number"
                        min="1"
                        step="1"
                        required
                      />
                    </label>
                  </div>
                  <label>
                    Location
                    <input name="location" required maxLength={160} />
                  </label>
                  <button
                    className="button button-dark button-wide"
                    type="submit"
                    disabled={
                      createListing.isPending || updateListing.isPending
                    }
                  >
                    {editingId ? "Save listing" : "Publish listing"}
                    <ArrowRight size={16} />
                  </button>
                  {editingId && (
                    <button
                      className="button button-light button-wide"
                      type="button"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel edit
                    </button>
                  )}
                </form>
              </div>
              <div className="dashboard-panel compact-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Order desk</p>
                    <h2>Relevant orders</h2>
                  </div>
                  <Boxes size={20} />
                </div>
                {supplierOrders.isLoading ? (
                  <div className="panel-empty">
                    <RefreshCw className="spin" /> Loading orders…
                  </div>
                ) : supplierOrders.data?.length ? (
                  <div className="supplier-order-list">
                    {supplierOrders.data.map((order: any) => (
                      <article className="supplier-order-row" key={order.id}>
                        <strong>Order {order.id}</strong>
                        <span>{order.status ?? "Request"}</span>
                        <p>
                          {order.title ?? order.listingTitle ?? "Bale order"} ·{" "}
                          {order.quantity ?? order.items?.length ?? 0} units
                        </p>
                        <small>
                          {order.paymentStatus ?? "Payment pending"}
                        </small>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="inline-empty">
                    <p>No relevant orders yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </SiteShell>
    );
  }

  if (role === "wholesaler") {
    const rows = wholesaler.data ?? [];
    const totalRetailers = rows.length;
    const activeBales = rows.reduce((t, r) => t + r.activeDeals, 0);
    const sales = rows.reduce((t, r) => t + r.itemsSold, 0);
    const totalProfit = rows.reduce((t, r) => t + r.reportedProfit, 0);
    return (
      <SiteShell>
        <section className="dashboard-page">
          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">Wholesaler workspace</p>
              <h1>
                See the work
                <br />
                <em>moving forward.</em>
              </h1>
              <p>
                Performance shown here is retailer-reported. Retailers control
                whether their business name and results are shared.
              </p>
            </div>
            <div className="dashboard-role-badge">
              <Truck size={17} /> Wholesaler · {account.data.businessName}
            </div>
          </div>
          <div className="metrics-row">
            <Metric
              label="Shared retailers"
              value={String(totalRetailers)}
              icon={<Store size={19} />}
            />
            <Metric
              label="Active bales"
              value={String(activeBales)}
              icon={<Boxes size={19} />}
            />
            <Metric
              label="Items reported sold"
              value={sales.toLocaleString()}
              icon={<ChartNoAxesCombined size={19} />}
            />
            <Metric
              label="Reported profit · NGN"
              value={money(totalProfit)}
              icon={<CircleDollarSign size={19} />}
            />
          </div>
          <div className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Shared retailer performance</p>
                <h2>Who’s building momentum?</h2>
              </div>
              <span className="live-pill">
                <i /> Opt-in reports
              </span>
            </div>
            {wholesaler.isLoading ? (
              <div className="panel-empty">
                <RefreshCw className="spin" /> Loading shared reports…
              </div>
            ) : rows.length ? (
              <div className="performance-table-wrap">
                <table className="performance-table">
                  <thead>
                    <tr>
                      <th>Retailer</th>
                      <th>Location</th>
                      <th>Active bales</th>
                      <th>Items sold</th>
                      <th>Reported sales</th>
                      <th>Reported profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={row.id}>
                        <td>
                          <span className="rank-chip">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="retailer-name-cell">
                            <strong>{row.businessName}</strong>
                            <small>{row.fullName}</small>
                          </span>
                        </td>
                        <td>{row.location}</td>
                        <td>{row.activeDeals}</td>
                        <td>{row.itemsSold.toLocaleString()}</td>
                        <td>{money(row.revenue)}</td>
                        <td
                          className={
                            row.reportedProfit >= 0
                              ? "profit-positive"
                              : "profit-negative"
                          }
                        >
                          {money(row.reportedProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="panel-empty">
                <Store size={26} />
                <h3>No shared retailer reports yet</h3>
                <p>
                  Opt-in retailer results will appear here. Private contact and
                  sign-in details remain hidden.
                </p>
              </div>
            )}
            <p className="table-note">
              Performance ranks by retailer-reported profit. Figures are in NGN
              and are not independently verified.
            </p>
          </div>
          <div className="dashboard-footnote">
            <BadgeCheck size={17} /> Retailers choose whether to share
            performance.
          </div>
        </section>
      </SiteShell>
    );
  }

  const deals = retailer.data?.deals ?? [];
  const reports = retailer.data?.reports ?? [];
  const totalRevenue = reports.reduce((s, r) => s + r.revenue, 0);
  const totalExpenses = reports.reduce((s, r) => s + r.expenses, 0);
  const totalItems = reports.reduce((s, r) => s + r.itemsSold, 0);
  const totalProfit = totalRevenue - totalExpenses;
  function createDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = event.currentTarget;
    const d = new FormData(f);
    const dealType = String(d.get("dealType")) as
      | "own_business"
      | "fixed_return";
    const capital = Number(d.get("capital"));
    if (!Number.isFinite(capital) || capital <= 0) {
      toast.error("Enter a capital amount above zero.");
      return;
    }
    addDeal.mutate({
      label: String(d.get("label")).trim(),
      buyerName: String(d.get("buyerName") ?? "") || undefined,
      dealType,
      capital,
      fixedProfitPercent: dealType === "fixed_return" ? 50 : undefined,
      currency: "NGN",
    });
    f.reset();
  }
  function createReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = event.currentTarget;
    const d = new FormData(f);
    addProgress.mutate({
      dealId: Number(d.get("dealId")),
      itemsSold: Number(d.get("itemsSold")),
      revenue: Number(d.get("revenue")),
      expenses: Number(d.get("expenses")),
      note: String(d.get("note") ?? "") || undefined,
    });
    f.reset();
  }
  function progressFor(order: any, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const d = new FormData(event.currentTarget);
    const itemsSold = Number(d.get("itemsSold")),
      revenue = Number(d.get("revenue")),
      expenses = Number(d.get("expenses"));
    if (
      [itemsSold, revenue, expenses].some(n => !Number.isFinite(n) || n < 0)
    ) {
      toast.error("Progress amounts must be zero or more.");
      return;
    }
    orderProgress.mutate({
      orderId: order.id,
      itemsSold,
      revenue,
      expenses,
      note: String(d.get("note") || "") || undefined,
    });
    (event.currentTarget as HTMLFormElement).reset();
  }
  function sendRemittance(order: any, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = event.currentTarget;
    const d = new FormData(f);
    const amount = Number(d.get("amount"));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a remittance amount above zero.");
      return;
    }
    remittance.mutate({
      orderId: order.id,
      amount,
      note: String(d.get("note") || "") || undefined,
    });
    f.reset();
  }
  return (
    <SiteShell>
      <section className="dashboard-page retailer-dashboard">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">Retailer workspace</p>
            <h1>
              Keep your
              <br />
              <em>progress in view.</em>
            </h1>
            <p>
              Manage eligible funded orders and your existing bale records.
              Updates and remittances are recorded against assigned orders.
            </p>
          </div>
          <div className="dashboard-role-badge">
            <Store size={17} /> Retailer · {account.data.businessName}
          </div>
        </div>
        <div className="metrics-row">
          <Metric
            label="Bales on your books"
            value={String(deals.length)}
            icon={<Boxes size={19} />}
          />
          <Metric
            label="Items sold"
            value={totalItems.toLocaleString()}
            icon={<ChartNoAxesCombined size={19} />}
          />
          <Metric
            label="Reported sales · NGN"
            value={money(totalRevenue)}
            icon={<CircleDollarSign size={19} />}
          />
          <Metric
            label="Reported profit · NGN"
            value={money(totalProfit)}
            icon={<BadgeCheck size={19} />}
          />
        </div>
        <label className="sharing-control">
          <input
            type="checkbox"
            checked={account.data.performanceSharing === "shared"}
            disabled={setSharing.isPending}
            onChange={e => setSharing.mutate({ shared: e.target.checked })}
          />
          <span>
            <strong>Share my progress with wholesalers</strong>
            <small>
              {account.data.performanceSharing === "shared"
                ? "Your business name, location and reported results are visible to signed-in wholesalers."
                : "Your retailer performance stays private. Turn this on to appear in wholesaler comparisons."}
            </small>
          </span>
        </label>
        <div className="dashboard-panel funded-orders-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Funded orders</p>
              <h2>Investment and payout tracking</h2>
            </div>
            <span className="count-pill">
              {funded.data?.length ?? 0} assigned
            </span>
          </div>
          <p className="payout-disclosure">
            Funded orders pay the invested principal plus 50% profit: total
            payout is 150% of investment. Example: {money(100000)} investment →{" "}
            {money(150000)} total payout.
          </p>
          {funded.isLoading ? (
            <div className="panel-empty">
              <RefreshCw className="spin" /> Loading assigned orders…
            </div>
          ) : funded.data?.length ? (
            <div className="funded-order-list">
              {funded.data.map((order: any) => {
                const remitted = (order.remittances ?? []).reduce(
                  (sum: number, r: any) => sum + Number(r.amount),
                  0
                );
                const remaining = Math.max(
                  0,
                  Number(order.totalPayoutAmount) - remitted
                );
                return (
                  <article className="funded-order-card" key={order.id}>
                    <div className="deal-row-top">
                      <span className="deal-row-tag">
                        Assigned funded order
                      </span>
                      <span className="deal-status">
                        <i />
                        {order.status ?? "Eligible"}
                      </span>
                    </div>
                    <h3>{order.orderRef}</h3>
                    <div className="funded-order-lines">
                      {order.lines.map((line: any, index: number) => (
                        <p key={`${line.title}-${index}`}>
                          {line.title} · {line.quantity} bale(s) ·{" "}
                          {money(Number(line.lineAmount))}
                        </p>
                      ))}
                    </div>
                    <div className="funded-order-financials">
                      <span>
                        Investment
                        <strong>{money(Number(order.investmentAmount))}</strong>
                      </span>
                      <span>
                        50% profit
                        <strong>{money(Number(order.profitAmount))}</strong>
                      </span>
                      <span>
                        Total payout (150%)
                        <strong>
                          {money(Number(order.totalPayoutAmount))}
                        </strong>
                      </span>
                    </div>
                    <p className="deal-row-meta">
                      Recorded remittances: {money(remitted)} of{" "}
                      {money(Number(order.totalPayoutAmount))} target · Status
                      is recorded, not verified as paid.
                    </p>
                    {order.progress.length > 0 && (
                      <div className="funded-order-history">
                        <strong>Progress reports</strong>
                        {order.progress.map((entry: any) => (
                          <small key={entry.id}>
                            {new Date(entry.createdAt).toLocaleDateString()} ·{" "}
                            {entry.itemsSold} items sold ·{" "}
                            {money(Number(entry.revenue))} revenue ·{" "}
                            {money(Number(entry.expenses))} expenses
                            {entry.note ? ` · ${entry.note}` : ""}
                          </small>
                        ))}
                      </div>
                    )}
                    {order.remittances.length > 0 && (
                      <div className="funded-order-history">
                        <strong>Remittance records</strong>
                        {order.remittances.map((entry: any) => (
                          <small key={entry.id}>
                            {new Date(entry.createdAt).toLocaleDateString()} ·{" "}
                            {money(Number(entry.amount))} · {entry.status}
                          </small>
                        ))}
                      </div>
                    )}
                    <div className="funded-order-forms">
                      <form
                        className="form-stack compact-form"
                        onSubmit={e => progressFor(order, e)}
                      >
                        <h4>Sales / progress update</h4>
                        <div className="form-row">
                          <label>
                            Items sold
                            <input
                              name="itemsSold"
                              type="number"
                              min="0"
                              step="1"
                              required
                            />
                          </label>
                          <label>
                            Revenue (NGN)
                            <input
                              name="revenue"
                              type="number"
                              min="0"
                              step="1"
                              required
                            />
                          </label>
                        </div>
                        <label>
                          Expenses (NGN)
                          <input
                            name="expenses"
                            type="number"
                            min="0"
                            step="1"
                            required
                          />
                        </label>
                        <label>
                          Note <span className="optional-label">optional</span>
                          <textarea name="note" rows={2} maxLength={500} />
                        </label>
                        <button
                          className="button button-orange"
                          type="submit"
                          disabled={orderProgress.isPending}
                        >
                          Save progress
                        </button>
                      </form>
                      <form
                        className="form-stack compact-form"
                        onSubmit={e => sendRemittance(order, e)}
                      >
                        <h4>Record remittance</h4>
                        <label>
                          Amount (NGN)
                          <input
                            name="amount"
                            type="number"
                            min="1"
                            max={remaining}
                            step="1"
                            required
                          />
                        </label>
                        <label>
                          Note <span className="optional-label">optional</span>
                          <textarea name="note" rows={2} maxLength={500} />
                        </label>
                        <button
                          className="button button-dark"
                          type="submit"
                          disabled={remittance.isPending || remaining <= 0}
                        >
                          Record remittance
                        </button>
                        <small>
                          Recording a remittance logs an off-site transfer; this
                          does not make a payment.
                        </small>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="panel-empty">
              <Boxes size={26} />
              <h3>No assigned funded orders</h3>
              <p>
                Only eligible orders assigned to your retailer account will
                appear here.
              </p>
            </div>
          )}
        </div>
        <div className="retailer-work-grid">
          <div className="dashboard-panel deal-log-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Your bale records</p>
                <h2>Track existing arrangements</h2>
              </div>
              <span className="count-pill">{deals.length} total</span>
            </div>
            {retailer.isLoading ? (
              <div className="panel-empty">
                <RefreshCw className="spin" /> Loading your records…
              </div>
            ) : deals.length ? (
              <div className="deal-list">
                {[...deals]
                  .sort((a, b) => b.id - a.id)
                  .map(deal => {
                    const rs = reports.filter(r => r.dealId === deal.id);
                    const sold = rs.reduce((s, r) => s + r.itemsSold, 0),
                      revenue = rs.reduce((s, r) => s + r.revenue, 0),
                      expenses = rs.reduce((s, r) => s + r.expenses, 0);
                    return (
                      <article className="deal-row" key={deal.id}>
                        <div className="deal-row-top">
                          <span className="deal-row-tag">
                            {dealLabel(deal.dealType)}
                          </span>
                          <span className="deal-status">
                            <i />
                            {deal.status}
                          </span>
                        </div>
                        <h3>{deal.label}</h3>
                        <p className="deal-row-meta">
                          Capital logged: {money(deal.capital)}
                          {deal.buyerName ? ` · Buyer: ${deal.buyerName}` : ""}
                        </p>
                        {deal.dealType === "fixed_return" && (
                          <p className="deal-fixed-note">
                            Agreed fixed return: {deal.fixedProfitPercent}%
                          </p>
                        )}
                        <div className="deal-stats">
                          <span>{sold} items sold</span>
                          <span>{money(revenue)} sales</span>
                          <span>{money(revenue - expenses)} net reported</span>
                        </div>
                        <div className="deal-reports">
                          {rs.length ? (
                            [...rs]
                              .sort(
                                (a, b) =>
                                  new Date(b.reportDate).getTime() -
                                  new Date(a.reportDate).getTime()
                              )
                              .slice(0, 2)
                              .map(r => (
                                <div className="report-line" key={r.id}>
                                  <span>
                                    {new Date(
                                      r.reportDate
                                    ).toLocaleDateString()}
                                  </span>
                                  <span>
                                    +{r.itemsSold} items · {money(r.revenue)}{" "}
                                    sales
                                  </span>
                                  {r.note && <small>{r.note}</small>}
                                </div>
                              ))
                          ) : (
                            <small>No progress updates on this bale yet.</small>
                          )}
                        </div>
                      </article>
                    );
                  })}
              </div>
            ) : (
              <div className="panel-empty">
                <Boxes size={26} />
                <h3>No legacy bale records</h3>
                <p>Existing arrangements and progress will appear here.</p>
              </div>
            )}
          </div>
          <div className="dashboard-side-panels">
            <div className="dashboard-panel compact-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Legacy record</p>
                  <h2>Add a bale</h2>
                </div>
                <PackagePlus size={20} />
              </div>
              <form className="form-stack compact-form" onSubmit={createDeal}>
                <label>
                  Bale / arrangement name
                  <input name="label" required minLength={2} maxLength={120} />
                </label>
                <label>
                  Arrangement
                  <select name="dealType" defaultValue="own_business">
                    <option value="own_business">My own business</option>
                    <option value="fixed_return">
                      Existing fixed-return arrangement
                    </option>
                  </select>
                </label>
                <label>
                  Buyer / partner name{" "}
                  <span className="optional-label">optional</span>
                  <input name="buyerName" maxLength={120} />
                </label>
                <label>
                  Capital involved (NGN)
                  <input
                    name="capital"
                    type="number"
                    min="1"
                    step="1"
                    required
                  />
                </label>
                <p className="panel-helper">
                  New fixed-return records use a 50% profit plus return of
                  capital. This entry does not create or fund an order.
                </p>
                <button
                  className="button button-dark button-wide"
                  type="submit"
                  disabled={addDeal.isPending}
                >
                  Save bale record
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
            <div className="dashboard-panel compact-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Keep it current</p>
                  <h2>Post legacy update</h2>
                </div>
                <ChartNoAxesCombined size={20} />
              </div>
              {deals.length ? (
                <form
                  className="form-stack compact-form"
                  onSubmit={createReport}
                >
                  <label>
                    Bale
                    <select
                      name="dealId"
                      value={selectedDeal || String(deals[0].id)}
                      onChange={e => setSelectedDeal(e.target.value)}
                    >
                      {deals.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="form-row">
                    <label>
                      Items sold
                      <input name="itemsSold" type="number" min="0" required />
                    </label>
                    <label>
                      Sales (NGN)
                      <input name="revenue" type="number" min="0" required />
                    </label>
                  </div>
                  <label>
                    Expenses (NGN)
                    <input name="expenses" type="number" min="0" required />
                  </label>
                  <label>
                    Quick note
                    <input name="note" maxLength={500} />
                  </label>
                  <button
                    className="button button-orange button-wide"
                    type="submit"
                    disabled={addProgress.isPending}
                  >
                    Save progress update
                    <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                <div className="inline-empty">
                  <p>Add a legacy bale record before posting its update.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="dashboard-footnote">
          <BadgeCheck size={17} /> Historical records remain visible, while new
          funded orders use a 50% profit and 150% total payout model.
        </div>
      </section>
    </SiteShell>
  );
}
