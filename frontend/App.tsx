import { ClerkProvider, SignedIn, SignedOut, SignIn, useUser } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/ThemeProvider";
import Dashboard from "./components/Dashboard";
import CityDetailPage from "./pages/CityDetailPage";
import SettingsPage from "./pages/SettingsPage";

const PUBLISHABLE_KEY = "pk_test_dmFsdWVkLWJhZGdlci0zNy5jbGVyay5hY2NvdW50cy5kZXYk";

function AppInner() {
  const { user } = useUser();

  return (
    <TooltipProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-foreground">
          <SignedOut>
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-white via-slate-50 to-slate-100">
              <div className="w-full max-w-md space-y-6 flex flex-col items-center">
                <div className="text-center space-y-3 w-full">
                  <div className="flex justify-center">
                    <img 
                      src="/images/logos/main-logo.png" 
                      alt="Index Estate Logo" 
                      className="h-26 w-auto"
                    />
                  </div>
                  <p className="text-muted-foreground text-xl">
                    Trade synthetic real estate assets from cities worldwide
                  </p>
                </div>
                <div className="w-full flex justify-center">
                  <SignIn routing="hash" signUpUrl="#/sign-up" />
                </div>
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
