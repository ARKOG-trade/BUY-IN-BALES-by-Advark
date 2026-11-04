import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowUpRight, Menu, Package, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";

export function BrandMark() {
  return (
    <Link href="/" className="brand-lockup" aria-label="BUY IN BALES home">
      <span className="brand-icon"><Package size={18} strokeWidth={2.2} /></span>
      <span className="brand-name">BUY IN BALES<span className="brand-by">by Advark</span></span>
    </Link>
  );
}

export default function SiteShell({ children, hideFooter = false }: { children: React.ReactNode; hideFooter?: boolean }) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const account = trpc.account.me.useQuery();
  const logout = trpc.account.logout.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      setOpen(false);
      setLocation("/");
    },
  });
  const closeMenu = () => setOpen(false);

  return (
    <div className="site-frame">
      <header className="site-header">
        <div className="header-inner">
          <BrandMark />
          <nav className={`main-nav ${open ? "is-open" : ""}`} aria-label="Main navigation">
            <Link href="/" onClick={closeMenu}>How it works</Link>
            <Link href="/partners" onClick={closeMenu}>Supplier partnerships</Link>
            {account.data ? (
              <>
                <Link href="/dashboard" onClick={closeMenu}>My dashboard</Link>
                <button className="nav-text-button" onClick={() => logout.mutate()} disabled={logout.isPending}>
                  {logout.isPending ? "Signing out…" : "Sign out"}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={closeMenu}>Sign in</Link>
                <Link href="/register" className="button button-small button-dark nav-join" onClick={closeMenu}>Join the network <ArrowUpRight size={15} /></Link>
              </>
            )}
          </nav>
          <button className="menu-toggle" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
      <main>{children}</main>
      {!hideFooter && (
        <footer className="site-footer">
          <div className="footer-main">
            <div><BrandMark /><p>Good bales. Local hustle.<br />A better way to move okrika.</p></div>
            <div className="footer-links"><Link href="/">How it works</Link><Link href="/partners">Partner with us</Link><Link href="/register">Create an account</Link></div>
            <div className="footer-note">BUY IN BALES by Advark<br /><span>Built for business in motion.</span></div>
          </div>
          <div className="footer-bottom"><span>© {new Date().getFullYear()} BUY IN BALES by Advark</span><span>Every bale has a next chapter.</span></div>
        </footer>
      )}
    </div>
  );
}
