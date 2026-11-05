import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Package } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const login = trpc.account.login.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("You’re signed in.");
      setLocation("/dashboard");
    },
    onError: error => toast.error(error.message),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    login.mutate({
      email: String(data.get("email")),
      password: String(data.get("password")),
    });
  }

  return (
    <SiteShell>
      <section className="account-layout login-layout">
        <aside className="account-aside login-aside">
          <Link href="/" className="back-link">
            <ArrowLeft size={15} /> Back to marketplace
          </Link>
          <p className="eyebrow eyebrow-light">Your business, in view</p>
          <h1>
            Pick up
            <br />
            where your
            <br />
            <em>bale left off.</em>
          </h1>
          <p>
            Sign in to keep your retailer progress or supplier listings moving.
          </p>
          <div className="aside-note">
            <Package size={18} /> Your activity stays with your account.
          </div>
        </aside>
        <div className="account-form-wrap login-form-wrap">
          <div className="account-form-heading">
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in to your account</h2>
            <p>Use the email and password you registered with.</p>
          </div>
          <form className="form-stack" onSubmit={submit}>
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@business.com"
                required
                maxLength={320}
              />
            </label>
            <label>
              Password
              <span className="password-wrap">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  required
                  maxLength={128}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
            <button
              className="button button-orange button-wide"
              type="submit"
              disabled={login.isPending}
            >
              {login.isPending ? "Signing in…" : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="form-switch">
            New to the marketplace?{" "}
            <Link href="/register">
              Create an account <ArrowRight size={14} />
            </Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
