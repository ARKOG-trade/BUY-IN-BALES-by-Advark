import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MarketplaceCartProvider } from "./contexts/MarketplaceCartContext";
import Admin from "./pages/Admin";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import PartnerWithRetailer from "./pages/PartnerWithRetailer";
import Partners from "./pages/Partners";
import Register from "./pages/Register";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/partners" component={Partners} />
      <Route path="/cart" component={Cart} />
      <Route path="/partner-with-retailer" component={PartnerWithRetailer} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <MarketplaceCartProvider>
            <Toaster />
            <Router />
          </MarketplaceCartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
