import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Boxes, ChartNoAxesCombined, CircleDollarSign, PackagePlus, RefreshCw, Store, Truck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

function money(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

function dealLabel(type: string) {
  if (type === "fixed_return") return "Fixed return";
  if (type === "profit_split") return "40 / 60 profit split";
  return "Own-business bale";
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="metric-card"><span className="metric-icon">{icon}</span><span className="metric-label">{label}</span><strong>{value}</strong></div>;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const account = trpc.account.me.useQuery();
  const retailer = trpc.retailer.snapshot.useQuery(undefined, { enabled: account.data?.role === "retailer" });
  const wholesaler = trpc.wholesaler.retailerPerformance.useQuery(undefined, { enabled: account.data?.role === "wholesaler" });
  const [selectedDeal, setSelectedDeal] = useState("");
  const addDeal = trpc.retailer.addDeal.useMutation({
    onSuccess: async () => { toast.success("Bale record added."); await queryClient.invalidateQueries(); },
    onError: (error) => toast.error(error.message),
  });
  const addProgress = trpc.retailer.addProgress.useMutation({
    onSuccess: async () => { toast.success("Progress update saved."); await queryClient.invalidateQueries(); },
    onError: (error) => toast.error(error.message),
  });
  const setSharing = trpc.retailer.setPerformanceSharing.useMutation({
    onSuccess: async () => { toast.success("Your sharing preference was updated."); await queryClient.invalidateQueries(); },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (!account.isLoading && !account.data) setLocation("/login");
  }, [account.isLoading, account.data, setLocation]);
  useEffect(() => {
    const firstDeal = retailer.data?.deals?.[0];
    if (firstDeal && !selectedDeal) setSelectedDeal(String(firstDeal.id));
  }, [retailer.data?.deals, selectedDeal]);

  if (account.isLoading || !account.data) return <SiteShell><div className="page-loading"><RefreshCw className="spin" /> Loading your business view…</div></SiteShell>;

  if (account.data.role === "wholesaler") {
    const rows = wholesaler.data ?? [];
    const totalRetailers = rows.length;
    const activeBales = rows.reduce((total, row) => total + row.activeDeals, 0);
    const sales = rows.reduce((total, row) => total + row.itemsSold, 0);
    const totalProfit = rows.reduce((total, row) => total + row.reportedProfit, 0);
    return (
      <SiteShell>
        <section className="dashboard-page">
          <div className="dashboard-heading"><div><p className="eyebrow">Wholesaler workspace</p><h1>See the work<br /><em>moving forward.</em></h1><p>Performance shown here is retailer-reported. Retailers control whether their business name and results are shared with wholesalers.</p></div><div className="dashboard-role-badge"><Truck size={17} /> Wholesaler · {account.data.businessName}</div></div>
          <div className="metrics-row"><Metric label="Shared retailers" value={String(totalRetailers)} icon={<Store size={19} />} /><Metric label="Active bales" value={String(activeBales)} icon={<Boxes size={19} />} /><Metric label="Items reported sold" value={sales.toLocaleString()} icon={<ChartNoAxesCombined size={19} />} /><Metric label="Reported profit · NGN" value={money(totalProfit)} icon={<CircleDollarSign size={19} />} /></div>
          <div className="dashboard-panel">
            <div className="panel-heading"><div><p className="eyebrow">Shared retailer performance</p><h2>Who’s building momentum?</h2></div><span className="live-pill"><i /> Opt-in reports</span></div>
            {wholesaler.isLoading ? <div className="panel-empty"><RefreshCw className="spin" /> Loading shared reports…</div> : rows.length ? (
              <div className="performance-table-wrap"><table className="performance-table"><thead><tr><th>Retailer</th><th>Location</th><th>Active bales</th><th>Items sold</th><th>Reported sales</th><th>Reported profit</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.id}><td><span className="rank-chip">{String(index + 1).padStart(2, "0")}</span><span className="retailer-name-cell"><strong>{row.businessName}</strong><small>{row.fullName}</small></span></td><td>{row.location}</td><td>{row.activeDeals}</td><td>{row.itemsSold.toLocaleString()}</td><td>{money(row.revenue)}</td><td className={row.reportedProfit >= 0 ? "profit-positive" : "profit-negative"}>{money(row.reportedProfit)}</td></tr>)}</tbody></table></div>
            ) : <div className="panel-empty"><Store size={26} /><h3>No shared retailer reports yet</h3><p>When a retailer opts in to sharing progress, their business will appear here. Their private contact and sign-in details remain hidden.</p></div>}
            <p className="table-note">Performance ranks by retailer-reported profit. Figures are in NGN and are not independently verified.</p>
          </div>
          <div className="dashboard-footnote"><BadgeCheck size={17} /> Retailers choose whether to share performance. Contact details and password information are never shown in this view.</div>
        </section>
      </SiteShell>
    );
  }

  const deals = retailer.data?.deals ?? [];
  const reports = retailer.data?.reports ?? [];
  const totalRevenue = reports.reduce((sum, report) => sum + report.revenue, 0);
  const totalExpenses = reports.reduce((sum, report) => sum + report.expenses, 0);
  const totalItems = reports.reduce((sum, report) => sum + report.itemsSold, 0);
  const totalProfit = totalRevenue - totalExpenses;

  function createDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const dealType = String(data.get("dealType")) as "own_business" | "fixed_return" | "profit_split";
    const fixed = String(data.get("fixedProfitPercent") ?? "");
    addDeal.mutate({
      label: String(data.get("label")),
      buyerName: String(data.get("buyerName") ?? "") || undefined,
      dealType,
      capital: Number(data.get("capital")),
      fixedProfitPercent: dealType === "fixed_return" ? Number(fixed) : undefined,
      currency: "NGN",
    });
    event.currentTarget.reset();
  }

  function createReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    addProgress.mutate({
      dealId: Number(data.get("dealId")),
      itemsSold: Number(data.get("itemsSold")),
      revenue: Number(data.get("revenue")),
      expenses: Number(data.get("expenses")),
      note: String(data.get("note") ?? "") || undefined,
    });
    event.currentTarget.reset();
  }

  return (
    <SiteShell>
      <section className="dashboard-page retailer-dashboard">
        <div className="dashboard-heading"><div><p className="eyebrow">Retailer workspace</p><h1>Keep your<br /><em>progress in view.</em></h1><p>Log each bale and your sales activity as the business moves. Every number below comes from the updates you submit.</p></div><div className="dashboard-role-badge"><Store size={17} /> Retailer · {account.data.businessName}</div></div>
        <div className="metrics-row"><Metric label="Bales on your books" value={String(deals.length)} icon={<Boxes size={19} />} /><Metric label="Items sold" value={totalItems.toLocaleString()} icon={<ChartNoAxesCombined size={19} />} /><Metric label="Reported sales · NGN" value={money(totalRevenue)} icon={<CircleDollarSign size={19} />} /><Metric label="Reported profit · NGN" value={money(totalProfit)} icon={<BadgeCheck size={19} />} /></div>
        <label className="sharing-control"><input type="checkbox" checked={account.data.performanceSharing === "shared"} disabled={setSharing.isPending} onChange={(event) => setSharing.mutate({ shared: event.target.checked })} /><span><strong>Share my progress with wholesalers</strong><small>{account.data.performanceSharing === "shared" ? "Your business name, location and reported results are visible to signed-in wholesalers. Contact and login details stay private." : "Your retailer performance stays private. Turn this on to appear in wholesaler comparisons."}</small></span></label>
        <div className="retailer-work-grid">
          <div className="dashboard-panel deal-log-panel"><div className="panel-heading"><div><p className="eyebrow">Your bale records</p><h2>Track each arrangement</h2></div><span className="count-pill">{deals.length} total</span></div>
            {retailer.isLoading ? <div className="panel-empty"><RefreshCw className="spin" /> Loading your records…</div> : deals.length ? <div className="deal-list">{[...deals].sort((a, b) => b.id - a.id).map((deal) => {
              const dealReports = reports.filter((report) => report.dealId === deal.id);
              const sold = dealReports.reduce((sum, report) => sum + report.itemsSold, 0);
              const revenue = dealReports.reduce((sum, report) => sum + report.revenue, 0);
              const expenses = dealReports.reduce((sum, report) => sum + report.expenses, 0);
              return <article className="deal-row" key={deal.id}><div className="deal-row-top"><span className="deal-row-tag">{dealLabel(deal.dealType)}</span><span className="deal-status"><i /> {deal.status}</span></div><h3>{deal.label}</h3><p className="deal-row-meta">Capital logged: {money(deal.capital)}{deal.buyerName ? ` · Buyer: ${deal.buyerName}` : ""}</p>{deal.dealType === "fixed_return" && <p className="deal-fixed-note">Agreed fixed return: {deal.fixedProfitPercent}%</p>}{deal.dealType === "profit_split" && <p className="deal-fixed-note">Profit share: 40% buyer · 60% retailer</p>}<div className="deal-stats"><span>{sold} items sold</span><span>{money(revenue)} sales</span><span>{money(revenue - expenses)} net reported</span></div><div className="deal-reports">{dealReports.length ? [...dealReports].sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()).slice(0, 2).map((report) => <div className="report-line" key={report.id}><span>{new Date(report.reportDate).toLocaleDateString()}</span><span>+{report.itemsSold} items · {money(report.revenue)} sales</span>{report.note && <small>{report.note}</small>}</div>) : <small>No progress updates on this bale yet.</small>}</div></article>;
            })}</div> : <div className="panel-empty"><Boxes size={26} /><h3>Your bale book starts here</h3><p>Add a bale arrangement to start tracking sales and progress.</p></div>}
          </div>
          <div className="dashboard-side-panels">
            <div className="dashboard-panel compact-panel"><div className="panel-heading"><div><p className="eyebrow">New record</p><h2>Add a bale</h2></div><PackagePlus size={20} /></div><form className="form-stack compact-form" onSubmit={createDeal}><label>Bale / arrangement name<input name="label" placeholder="e.g. Spring mix · Bale 01" required minLength={2} maxLength={120} /></label><label>Who is the bale for?<select name="dealType" defaultValue="own_business"><option value="own_business">My own business</option><option value="fixed_return">Fixed return for bale buyer</option><option value="profit_split">40% buyer · 60% retailer</option></select></label><label>Buyer / partner name <span className="optional-label">optional</span><input name="buyerName" placeholder="Partner’s name" maxLength={120} /></label><label>Capital involved (NGN)<input name="capital" type="number" min="0" step="1" placeholder="0" required /></label><label className="fixed-percent-field">Agreed fixed profit %<input name="fixedProfitPercent" type="number" min="0.01" max="100" step="0.01" placeholder="Set the agreed rate" /></label><button className="button button-dark button-wide" type="submit" disabled={addDeal.isPending}>{addDeal.isPending ? "Saving bale…" : "Save bale record"}<ArrowRight size={16} /></button></form><p className="panel-helper">Only enter a fixed percentage if that is the model you agreed for this bale. Amounts are recorded in NGN.</p></div>
            <div className="dashboard-panel compact-panel"><div className="panel-heading"><div><p className="eyebrow">Keep it current</p><h2>Post an update</h2></div><ChartNoAxesCombined size={20} /></div>{deals.length ? <form className="form-stack compact-form" onSubmit={createReport}><label>Bale<select name="dealId" value={selectedDeal || String(deals[0].id)} onChange={(event) => setSelectedDeal(event.target.value)}>{deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.label}</option>)}</select></label><div className="form-row"><label>Items sold<input name="itemsSold" type="number" min="0" step="1" placeholder="0" required /></label><label>Sales (NGN)<input name="revenue" type="number" min="0" step="1" placeholder="0" required /></label></div><label>Expenses (NGN)<input name="expenses" type="number" min="0" step="1" placeholder="0" required /></label><label>Quick note <span className="optional-label">optional</span><textarea name="note" rows={2} placeholder="A short progress note" maxLength={500} /></label><button className="button button-orange button-wide" type="submit" disabled={addProgress.isPending}>{addProgress.isPending ? "Saving update…" : "Save progress update"}<ArrowRight size={16} /></button></form> : <div className="inline-empty"><p>Add your first bale before posting a progress update.</p></div>}</div>
          </div>
        </div>
        <div className="dashboard-footnote"><BadgeCheck size={17} /> Wholesalers only see your business name, location and performance if you opted in to sharing when you registered.</div>
      </section>
    </SiteShell>
  );
}
