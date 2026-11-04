import { FormEvent } from "react";
import { ArrowRight, Globe2, Mail, MapPin, PackageOpen, Phone, Send, Store, Truck } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

export default function Partners() {
  const queryClient = useQueryClient();
  const account = trpc.account.me.useQuery();
  const directory = trpc.partners.directory.useQuery(undefined, { enabled: Boolean(account.data) });
  const submitInquiry = trpc.partners.submit.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Thanks — your partnership enquiry has been received.");
      document.querySelector<HTMLFormElement>("#partnership-form")?.reset();
    },
    onError: (error) => toast.error(error.message),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    submitInquiry.mutate({
      requesterType: String(data.get("requesterType")) as "supplier" | "retailer",
      corridor: String(data.get("corridor")) as "china" | "london" | "local",
      directoryVisibility: data.get("listInDirectory") === "on" ? "listed" : "private",
      contactName: String(data.get("contactName")),
      companyName: String(data.get("companyName")),
      email: String(data.get("email")),
      phone: String(data.get("phone")),
      message: String(data.get("message")),
    });
  }

  return (
    <SiteShell>
      <section className="partner-hero">
        <div className="partner-hero-copy"><p className="eyebrow">The partnership lane</p><h1>Good supply.<br /><em>Local sense.</em></h1><p>Connect international sourcing with the retailers who know their neighborhoods. BUY IN BALES helps suppliers and local sellers find one another and start a real conversation.</p><a className="button button-orange" href="#connect">Start a conversation <ArrowRight size={17} /></a></div>
        <div className="partner-map-art"><div className="map-orbit orbit-one" /><div className="map-orbit orbit-two" /><div className="map-center"><Globe2 size={39} /><span>ONE<br />NETWORK</span></div><div className="map-point point-china"><i />CHINA</div><div className="map-point point-london"><i />LONDON</div><div className="map-point point-local"><i />LOCAL RETAIL</div><span className="route-line route-a" /><span className="route-line route-b" /><span className="route-line route-c" /></div>
      </section>
      <section className="partner-corridors">
        <div className="corridor-card"><span className="corridor-index">01 / SOURCE</span><div className="corridor-icon"><PackageOpen size={23} /></div><h2>Suppliers in China</h2><p>Tell retailers what you source, how you work, and where a local selling partnership could fit.</p></div>
        <div className="corridor-card corridor-card-highlight"><span className="corridor-index">02 / CONNECT</span><div className="corridor-icon"><Globe2 size={23} /></div><h2>Suppliers in London</h2><p>Share your supply lane and partnership idea. Businesses can opt into the member directory to connect directly.</p></div>
        <div className="corridor-card"><span className="corridor-index">03 / SELL LOCAL</span><div className="corridor-icon"><Store size={23} /></div><h2>Retailers on the ground</h2><p>Let suppliers know what your store needs and connect with sourcing businesses that choose to be listed.</p></div>
      </section>

      <section className="directory-section">
        <div className="directory-heading"><div><p className="eyebrow">The member directory</p><h2>Find your next<br /><em>business link.</em></h2></div><p>Only businesses that choose “List my contact card” appear here. Contact details are shared with signed-in BUY IN BALES members only.</p></div>
        {account.isLoading ? <div className="directory-empty">Checking member access…</div> : !account.data ? (
          <div className="directory-gate"><div><Truck size={23} /><h3>For the member network</h3><p>Sign in to browse businesses that have opted in to direct contact, or create an account to join the network.</p></div><div className="directory-actions"><Link href="/login" className="button button-dark">Sign in <ArrowRight size={15} /></Link><Link href="/register" className="text-link text-link-ink">Create account <ArrowRight size={14} /></Link></div></div>
        ) : directory.isLoading ? <div className="directory-empty">Loading listed businesses…</div> : directory.data?.length ? (
          <div className="directory-grid">{directory.data.map((business) => <article className="directory-card" key={business.id}><div className="directory-card-top"><span className="deal-row-tag">{business.requesterType === "supplier" ? "SUPPLIER" : "RETAILER"} · {business.corridor.toUpperCase()}</span><span className="directory-date">Joined {new Date(business.createdAt).toLocaleDateString()}</span></div><h3>{business.companyName}</h3><p className="directory-contact-name">{business.contactName}</p><p className="directory-description">{business.message}</p><div className="directory-contact-links"><a href={`mailto:${encodeURIComponent(business.email)}?subject=${encodeURIComponent(`Partnership with ${business.companyName}`)}`}><Mail size={14} /> Email</a><a href={`tel:${encodeURIComponent(business.phone)}`}><Phone size={14} /> Call</a></div></article>)}</div>
        ) : <div className="directory-empty"><Globe2 size={25} /><h3>No businesses have listed yet</h3><p>Start the directory by sending an enquiry and opting in to share your contact card with members.</p></div>}
      </section>

      <section className="connect-section" id="connect">
        <div className="connect-intro"><p className="eyebrow eyebrow-light">Make the introduction</p><h2>Let’s find the<br /><em>right fit.</em></h2><p>Send a partnership note. If you opt in, your business contact card becomes visible to signed-in members so they can contact you directly.</p><div className="connect-location"><MapPin size={17} /> China · London · Local retail</div></div>
        <form id="partnership-form" className="connect-form" onSubmit={submit}>
          <div className="form-row"><label>I’m a<select name="requesterType" defaultValue="supplier"><option value="supplier">Supplier</option><option value="retailer">Retailer</option></select></label><label>My connection is to<select name="corridor" defaultValue="china"><option value="china">China supply</option><option value="london">London supply</option><option value="local">Local retail</option></select></label></div>
          <div className="form-row"><label>Contact name<input name="contactName" placeholder="Your full name" required minLength={2} maxLength={120} /></label><label>Company / business<input name="companyName" placeholder="Business name" required minLength={2} maxLength={160} /></label></div>
          <div className="form-row"><label>Email<input type="email" name="email" placeholder="you@business.com" required maxLength={320} /></label><label>Phone<input type="tel" name="phone" placeholder="Contact number" required minLength={7} maxLength={48} /></label></div>
          <label>What kind of partnership are you looking for?<textarea name="message" rows={4} placeholder="Share what you source or sell, and what a good partnership could look like…" required minLength={10} maxLength={1000} /></label>
          <label className="consent-row consent-dark"><input type="checkbox" name="listInDirectory" /><span><strong>List my contact card in the member directory.</strong><small>Optional. This shares your business name, contact name, email, phone, location lane and message with signed-in members. Leave unchecked to send a private enquiry only.</small></span></label>
          <button className="button button-orange" type="submit" disabled={submitInquiry.isPending}>{submitInquiry.isPending ? "Sending…" : "Send partnership enquiry"}<Send size={16} /></button>
          <p className="form-legal form-legal-light">Submitting an enquiry does not confirm a partnership or guarantee a response time. Directory contacts are supplied by the businesses themselves.</p>
        </form>
      </section>
    </SiteShell>
  );
}
