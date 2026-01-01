import { ClerkProvider, SignedIn, SignedOut, SignIn, useUser } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/ThemeProvider";
import Dashboard from "./components/Dashboard";
import CityDetailPage from "./pages/CityDetailPage";
import SettingsPage from "./pages/SettingsPage";
import { Building2 } from "lucide-react";

const PUBLISHABLE_KEY = "pk_test_dmFsdWVkLWJhZGdlci0zNy5jbGVyay5hY2NvdW50cy5kZXYk";

function AppInner() {
  const { user } = useUser();

  return (
    <TooltipProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-foreground">
          <SignedOut>
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-white via-slate-50 to-slate-100">
              <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">Real Estate Trading</h1>
                  <p className="text-muted-foreground text-xl">
                    Trade synthetic real estate assets from cities worldwide
                  </p>
                </div>
                <SignIn routing="hash" signUpUrl="#/sign-up" />
              </div>
            </div>
          </SignedOut>
          <SignedIn>
            <Routes>
              <Route path="/home-value-index/:cityCode" element={<CityDetailPage />} />
              <Route path="/markets" element={user ? <Dashboard userId={user.id} /> : <Navigate to="/" />} />
              <Route path="/positions" element={user ? <Dashboard userId={user.id} /> : <Navigate to="/" />} />
              <Route path="/history" element={user ? <Dashboard userId={user.id} /> : <Navigate to="/" />} />
              <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/" />} />
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
