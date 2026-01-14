import { ClerkProvider, SignedIn, SignedOut, SignIn, useUser } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/ThemeProvider";
import Dashboard from "./components/Dashboard";
import CityDetailPage from "./pages/CityDetailPage";
import SettingsPage from "./pages/SettingsPage";
import MintDepositPage from "./pages/MintDepositPage";
import WithdrawPage from "./pages/WithdrawPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import LandingPage from "./pages/LandingPage";
import LiquidityPoolsPage from "./pages/LiquidityPoolsPage";

const PUBLISHABLE_KEY = "pk_test_dmFsdWVkLWJhZGdlci0zNy5jbGVyay5hY2NvdW50cy5kZXYk";

// Component for displaying documentation Docusaurus through iframe
function DocsFrame() {
  return (
    <div className="w-full h-screen">
      <iframe
        src="/docs/intro/"
        className="w-full h-full border-0"
        title="Documentation"
      />
    </div>
  );
}

function AppInner() {
  const { user } = useUser();

  return (
    <TooltipProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-foreground">
          <SignedOut>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/docs/*" element={<DocsFrame />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </SignedOut>
          <SignedIn>
            <Routes>
              <Route path="/home-value-index/:cityCode" element={<CityDetailPage />} />
              <Route path="/markets" element={user ? <Dashboard userId={user.id} /> : <Navigate to="/" />} />
              <Route path="/positions" element={user ? <Dashboard userId={user.id} /> : <Navigate to="/" />} />
              <Route path="/history" element={user ? <Dashboard userId={user.id} /> : <Navigate to="/" />} />
              <Route path="/liquidity" element={user ? <LiquidityPoolsPage /> : <Navigate to="/" />} />
              <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/" />} />
              <Route path="/mint-deposit" element={user ? <MintDepositPage /> : <Navigate to="/" />} />
              <Route path="/withdraw" element={user ? <WithdrawPage /> : <Navigate to="/" />} />
              <Route path="/blog" element={user ? <BlogPage /> : <Navigate to="/" />} />
              <Route path="/blog/:slug" element={user ? <BlogPostPage /> : <Navigate to="/" />} />
              <Route path="/docs/*" element={<DocsFrame />} />
              <Route path="/" element={user ? <Dashboard userId={user.id} /> : <Navigate to="/" />} />
            </Routes>
          </SignedIn>
          <Toaster />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </ClerkProvider>
  );
}
