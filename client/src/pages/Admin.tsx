import {
  RefreshCw,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  CircleDollarSign,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

function money(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function Admin() {
  const queryClient = useQueryClient();
  // This endpoint enforces the existing Manus OAuth admin gate. Do not infer admin
  // access from client-side account data.
  const dashboard = (trpc as any).admin.dashboard.useQuery();
  const approveRetailer = (trpc as any).admin.approveRetailer.useMutation({
    onSuccess: async (_: unknown, input: { approved: boolean }) => {
      toast.success(
        input.approved ? "Retailer approved." : "Retailer rejected."
      );
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const confirmPayment = (trpc as any).admin.confirmManualPayment.useMutation({
    onSuccess: async (_: unknown, input: { confirmed: boolean }) => {
      toast.success(
        input.confirmed
          ? "Off-site payment recorded as confirmed."
          : "Payment confirmation cleared."
      );
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const errorMessage = String(dashboard.error?.message ?? "");
  const denied =
    dashboard.isError &&
    /unauthor|forbidden|admin|sign.?in|unauthenticated/i.test(errorMessage);
  const data = dashboard.data as
    | { pendingRetailers?: any[]; pendingOrders?: any[] }
    | undefined;

  return (
    <SiteShell>
      <section className="admin-page dashboard-page">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>
              Review, then
              <br />
              <em>record clearly.</em>
            </h1>
            <p>
              Approve retailer access and keep an auditable record of off-site
              payment confirmations.
            </p>
          </div>
          <div className="dashboard-role-badge">
            <ShieldCheck size={17} /> Admin workspace
          </div>
        </div>
        {dashboard.isLoading ? (
          <div className="page-loading">
            <RefreshCw className="spin" /> Checking administrator access…
          </div>
        ) : denied ? (
          <div className="admin-access-denied">
            <XCircle size={28} />
            <h2>Administrator access required</h2>
            <p>
              This area is restricted to accounts authorized through Manus
              OAuth. Sign in with an approved administrator account, then try
              again.
            </p>
          </div>
        ) : dashboard.isError ? (
          <div className="admin-access-denied">
            <XCircle size={28} />
            <h2>Couldn’t load admin records</h2>
            <p>
              {errorMessage ||
                "The administrator service is temporarily unavailable."}
            </p>
          </div>
        ) : (
          <>
            <div className="admin-review-grid">
              <section className="dashboard-panel admin-review-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Retailer applications</p>
                    <h2>Pending retailer approvals</h2>
                  </div>
                  <span className="count-pill">
                    {data?.pendingRetailers?.length ?? 0} pending
                  </span>
                </div>
                {data?.pendingRetailers?.length ? (
                  <div className="admin-record-list">
                    {data.pendingRetailers.map((retailer: any) => (
                      <article
                        className="admin-record"
                        key={retailer.accountId ?? retailer.id}
                      >
                        <div>
                          <span className="deal-row-tag">
                            Retailer application
                          </span>
                          <h3>{retailer.businessName ?? "Retailer"}</h3>
                          <p>
                            {retailer.fullName ?? retailer.name ?? ""}
                            {retailer.location ? ` · ${retailer.location}` : ""}
                          </p>
                          {retailer.email && <small>{retailer.email}</small>}
                          {retailer.createdAt && (
                            <small>
                              Submitted{" "}
                              {new Date(
                                retailer.createdAt
                              ).toLocaleDateString()}
                            </small>
                          )}
                        </div>
                        <div className="admin-record-actions">
                          <button
                            type="button"
                            className="button button-orange"
                            disabled={approveRetailer.isPending}
                            onClick={() =>
                              approveRetailer.mutate({
                                accountId: retailer.accountId ?? retailer.id,
                                approved: true,
                              })
                            }
                          >
                            <CheckCircle2 size={15} /> Approve
                          </button>
                          <button
                            type="button"
                            className="button button-light"
                            disabled={approveRetailer.isPending}
                            onClick={() =>
                              approveRetailer.mutate({
                                accountId: retailer.accountId ?? retailer.id,
                                approved: false,
                              })
                            }
                          >
                            <XCircle size={15} /> Reject
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="panel-empty">
                    <CheckCircle2 size={25} />
                    <h3>No pending retailers</h3>
                    <p>
                      New retailer applications awaiting review will appear
                      here.
                    </p>
                  </div>
                )}
              </section>
              <section className="dashboard-panel admin-review-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Order requests</p>
                    <h2>Payment pending</h2>
                  </div>
                  <span className="count-pill">
                    {data?.pendingOrders?.length ?? 0} orders
                  </span>
                </div>
                <p className="admin-payment-note">
                  <CircleDollarSign size={17} /> Checkout records an order
                  request only. No online payment is processed here.
                </p>
                {data?.pendingOrders?.length ? (
                  <div className="admin-record-list">
                    {data.pendingOrders.map((order: any) => (
                      <article
                        className="admin-record"
                        key={order.orderId ?? order.id}
                      >
                        <div>
                          <span className="deal-row-tag">
                            {order.paymentStatus ?? "Payment pending"}
                          </span>
                          <h3>
                            {order.title ??
                              order.listingTitle ??
                              `Order ${order.orderId ?? order.id}`}
                          </h3>
                          <p>
                            {order.businessName ??
                              order.retailerName ??
                              "Retailer"}
                            {order.supplierName
                              ? ` · Supplier: ${order.supplierName}`
                              : ""}
                          </p>
                          <p className="deal-row-meta">
                            {order.quantity != null
                              ? `${order.quantity} units · `
                              : ""}
                            {order.amount != null
                              ? money(Number(order.amount))
                              : order.total != null
                                ? money(Number(order.total))
                                : "Amount not provided"}
                            {order.createdAt
                              ? ` · ${new Date(order.createdAt).toLocaleDateString()}`
                              : ""}
                          </p>
                          <small>
                            Confirming records an off-site payment only; it
                            never charges or transfers funds.
                          </small>
                        </div>
                        <div className="admin-record-actions">
                          <button
                            type="button"
                            className="button button-dark"
                            disabled={confirmPayment.isPending}
                            onClick={() =>
                              confirmPayment.mutate({
                                orderId: order.orderId ?? order.id,
                                confirmed: true,
                              })
                            }
                          >
                            <CheckCircle2 size={15} /> Mark off-site payment
                            confirmed
                          </button>
                          <button
                            type="button"
                            className="button button-light"
                            disabled={confirmPayment.isPending}
                            onClick={() =>
                              confirmPayment.mutate({
                                orderId: order.orderId ?? order.id,
                                confirmed: false,
                              })
                            }
                          >
                            Clear confirmation
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="panel-empty">
                    <CircleDollarSign size={25} />
                    <h3>No pending order requests</h3>
                    <p>
                      Orders returned to this authorized admin account will
                      appear here.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </section>
    </SiteShell>
  );
}
