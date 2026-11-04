import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Store, Truck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

export default function Register() {
  const [role, setRole] = useState<"retailer" | "wholesaler">("retailer");
  const [share, setShare] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const register = trpc.account.register.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Your account is ready.");
      setLocation("/dashboard");
    },
    onError: (error) => toast.error(error.message),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) {
      toast.error("Your passwords don’t match.");
      return;
    }
    register.mutate({
      email: String(data.get("email")),
      password: String(data.get("password")),
      fullName: String(data.get("fullName")),
      businessName: String(data.get("businessName")),
      phone: String(data.get("phone")),
      location: String(data.get("location")),
      role,
      performanceSharing: role === "retailer" && share,
    });
  }

  return (
    <SiteShell>
      <section className="account-layout">
        <aside className="account-aside">
          <Link href="/" className="back-link"><ArrowLeft size={15} /> Back to the story</Link>
          <p className="eyebrow eyebrow-light">Join the network</p>
          <h1>Put your<br /><em>next move</em><br />in motion.</h1>
          <p>Set up your account to track bale activity, see the partnership options, and keep your business progress in view.</p>
          <div className="aside-note"><span>✳</span>One network. Different ways to grow.</div>
        </aside>
        <div className="account-form-wrap">
          <div className="account-form-heading"><p className="eyebrow">Create your account</p><h2>First, what do you do?</h2><p>Choose the role that best describes your business.</p></div>
          <div className="role-switch" role="group" aria-label="Account type">
            <button type="button" className={role === "retailer" ? "role-option active" : "role-option"} onClick={() => setRole("retailer")}><Store size={18} /><span><strong>Retailer</strong><small>I sell to customers</small></span></button>
            <button type="button" className={role === "wholesaler" ? "role-option active" : "role-option"} onClick={() => setRole("wholesaler")}><Truck size={18} /><span><strong>Wholesaler</strong><small>I back or supply bales</small></span></button>
          </div>
          <form className="form-stack" onSubmit={submit}>
            <div className="form-row"><label>Full name<input name="fullName" autoComplete="name" placeholder="Your name" required minLength={2} maxLength={120} /></label><label>Business name<input name="businessName" autoComplete="organization" placeholder="Your shop or company" required minLength={2} maxLength={160} /></label></div>
            <div className="form-row"><label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@business.com" required maxLength={320} /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" placeholder="Your contact number" required minLength={7} maxLength={48} /></label></div>
            <label>City / location<input name="location" autoComplete="address-level2" placeholder="Where your business operates" required minLength={2} maxLength={160} /></label>
            <div className="form-row"><label>Password<span className="password-wrap"><input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="At least 10 characters" required minLength={10} maxLength={128} /><button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label><label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" placeholder="Enter it again" required minLength={10} maxLength={128} /></label></div>
            {role === "retailer" && <label className="consent-row"><input type="checkbox" checked={share} onChange={(event) => setShare(event.target.checked)} /><span><strong>Share my business progress with participating wholesalers.</strong><small>Optional. If selected, wholesalers can see your business name, location and reported performance. Your email, phone, and login details remain private.</small></span></label>}
            <button className="button button-orange button-wide" type="submit" disabled={register.isPending}>{register.isPending ? "Creating account…" : "Create my account"}<ArrowRight size={17} /></button>
            <p className="form-legal">By creating an account, you confirm that the business information you submit is yours to share.</p>
          </form>
          <p className="form-switch">Already part of the network? <Link href="/login">Sign in <ArrowRight size={14} /></Link></p>
        </div>
      </section>
    </SiteShell>
  );
}
