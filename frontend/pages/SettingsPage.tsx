import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Settings as SettingsIcon, User, Bell, Shield, Palette, Ruler, Copy, Check } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUser } from "@clerk/clerk-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUnitPreference } from "@/lib/useUnitPreference";
import { useBackend } from "@/lib/useBackend";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { unitType, setUnitType } = useUnitPreference();
  const backend = useBackend();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadWalletAddress = async () => {
      try {
        const response = await backend.user.getUserInfo();
        setWalletAddress(response.walletAddress);
      } catch (error) {
        console.error("Error loading wallet address:", error);
      } finally {
        setIsLoadingWallet(false);
      }
    };

    loadWalletAddress();
  }, [backend]);

  const handleCopyAddress = async () => {
    if (!walletAddress) return;
    
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please try again",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar />
      
      <div className="lg:ml-64 transition-all duration-300">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-sm">
          <div className="container mx-auto px-4 py-5 flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/15 p-3 text-primary">
                <SettingsIcon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm leading-none font-medium text-muted-foreground uppercase tracking-[0.12em]">Settings</p>
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">Settings</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Account Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Account</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
                    <AvatarFallback>
                      {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{user?.fullName || "User"}</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.emailAddresses[0]?.emailAddress || "No email"}
                    </p>
                    {!isLoadingWallet && walletAddress && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground font-mono">
                          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyAddress();
                          }}
                          title="Copy full address"
                        >
                          {copied ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                    {!isLoadingWallet && !walletAddress && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        Wallet address not connected
                      </p>
                    )}
                  </div>
                </div>
                <Separator />
                <p className="text-sm text-muted-foreground">
                  Manage your account settings and profile information.
                </p>
              </CardContent>
            </Card>

            {/* Appearance Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Appearance</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Theme</p>
                    <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                  </div>
                  <ThemeToggle />
                </div>
                <Separator />
                <p className="text-sm text-muted-foreground">
                  Customize the appearance of the application.
                </p>
              </CardContent>
            </Card>

            {/* Notifications Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Notifications</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure your notification preferences. Notification settings will be available soon.
                </p>
              </CardContent>
            </Card>

            {/* Units Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Units</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Area Units</p>
                    <p className="text-sm text-muted-foreground">Choose your preferred area measurement unit</p>
                    <p className="text-sm font-medium text-primary mt-1">
                      Currently selected: <span className="font-semibold">{unitType === "sqm" ? "Square meters (Sqm)" : "Square feet (Sqft)"}</span>
                    </p>
                  </div>
                  <ToggleGroup 
                    type="single" 
                    value={unitType}
                    onValueChange={(value) => {
                      if (value && (value === "sqft" || value === "sqm")) {
                        setUnitType(value);
                      }
                    }}
                    variant="outline"
                    className="border-gray-200 dark:border-slate-700"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem value="sqft" aria-label="Square feet">
                          Sqft
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Square feet</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem value="sqm" aria-label="Square meters">
                          Sqm
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Square meters</p>
                      </TooltipContent>
                    </Tooltip>
                  </ToggleGroup>
                </div>
                <Separator />
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manage your security settings and privacy preferences. Security settings will be available soon.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

