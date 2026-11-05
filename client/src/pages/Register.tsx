import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Store, Truck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";
type Role = "retailer" | "supplier";
export default function Register() {
  const initialRole = new URLSearchParams(window.location.search).get("role");
  const [role, setRole] = useState<Role>(
    initialRole === "supplier" ? "supplier" : "retailer"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const register = trpc.account.register.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Your account is ready.");
      setLocation("/dashboard");
    },
    onError: error => toast.error(error.message),
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
      fullName: String(
        data.get(role === "retailer" ? "retailerName" : "ceoName")
      ),
      businessName: String(data.get("businessName")),
      location: String(data.get("location")),
      ...(role === "supplier" ? { phone: String(data.get("phone")) } : {}),
      role,
    } as never);
  }
  return (
    <SiteShell>
      <section className="account-layout">
        <aside className="account-aside">
          <Link href="/" className="back-link">
            <ArrowLeft size={15} /> Back to marketplace
          </Link>
          <p className="eyebrow eyebrow-light">Join the marketplace</p>
          <h1>
            Put your
            <br />
            <em>next move</em>
            <br />
            in motion.
          </h1>
          <p>Create a business account to participate in BUY IN BALES.</p>
          <div className="aside-note">
            <span>✳</span>One marketplace. Different ways to grow.
          </div>
        </aside>
        <div className="account-form-wrap">
          <div className="account-form-heading">
            <p className="eyebrow">Create your account</p>
            <h2>Choose your business role</h2>
            <p>Your email address will also be your login email.</p>
          </div>
          <div className="role-switch" role="group" aria-label="Account type">
            <button
              type="button"
              className={
                role === "retailer" ? "role-option active" : "role-option"
              }
              onClick={() => setRole("retailer")}
            >
              <Store size={18} />
              <span>
                <strong>Retailer</strong>
                <small>I sell to customers</small>
              </span>
            </button>
            <button
              type="button"
              className={
                role === "supplier" ? "role-option active" : "role-option"
              }
              onClick={() => setRole("supplier")}
            >
              <Truck size={18} />
              <span>
                <strong>Supplier</strong>
                <small>I publish bale listings</small>
              </span>
            </button>
          </div>
          <form className="form-stack" onSubmit={submit}>
            <label>
              Business name
              <input
                name="businessName"
                autoComplete="organization"
                placeholder={
                  role === "retailer"
                    ? "Your business name"
                    : "Your company name"
                }
                required
                minLength={2}
                maxLength={160}
              />
            </label>
            {role === "retailer" ? (
              <label>
                Retailer name
                <input
                  name="retailerName"
                  autoComplete="name"
                  placeholder="Your name"
                  required
                  minLength={2}
                  maxLength={120}
                />
              </label>
            ) : (
              <label>
                CEO name
                <input
                  name="ceoName"
                  autoComplete="name"
                  placeholder="CEO / company lead name"
                  required
                  minLength={2}
                  maxLength={120}
                />
              </label>
            )}
            <label>
              Physical {role === "retailer" ? "store" : "business"} location
              <input
                name="location"
                autoComplete="street-address"
                placeholder="Street, area, city"
                required
                minLength={2}
                maxLength={160}
              />
            </label>
            <label>
              {role === "supplier"
                ? "Business email / contact email"
                : "Email address"}
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@business.com"
                required
                maxLength={320}
              />
            </label>
            {role === "supplier" && (
              <label>
                Contact phone / WhatsApp
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Phone or WhatsApp number"
                  required
                  minLength={7}
                  maxLength={48}
                />
              </label>
            )}
            <div className="form-row">
              <label>
                Password
                <span className="password-wrap">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 10 characters"
                    required
                    minLength={10}
                    maxLength={128}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>
              <label>
                Confirm password
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter it again"
                  required
                  minLength={10}
                  maxLength={128}
                />
              </label>
            </div>
            <button
              className="button button-orange button-wide"
              type="submit"
              disabled={register.isPending}
            >
              {register.isPending ? "Creating account…" : `Register as ${role}`}
              <ArrowRight size={17} />
            </button>
            <p className="form-legal">
              Your email and password are used to sign in to your account.
            </p>
          </form>
          <p className="form-switch">
            Already registered?{" "}
            <Link href="/login">
              Sign in <ArrowRight size={14} />
            </Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
