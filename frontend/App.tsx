import { ClerkProvider, SignedIn, SignedOut, SignIn, useUser } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "./components/Dashboard";
import { Building2 } from "lucide-react";

const PUBLISHABLE_KEY = "pk_test_dmFsdWVkLWJhZGdlci0zNy5jbGVyay5hY2NvdW50cy5kZXYk";

function AppInner() {
  const { user } = useUser();

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-bold">Real Estate Trading</h1>
              <p className="text-muted-foreground">
                Trade synthetic real estate assets from cities worldwide
              </p>
            </div>
            <SignIn routing="hash" signUpUrl="#/sign-up" />
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        {user && <Dashboard userId={user.id} />}
      </SignedIn>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AppInner />
    </ClerkProvider>
  );
}
