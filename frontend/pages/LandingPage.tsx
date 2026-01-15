import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, 
  TrendingUp, 
  Shield, 
  Zap, 
  Globe, 
  ArrowRight,
  Check,
  BarChart3,
  Users,
  DollarSign,
  Lock,
  Layers,
  Coins,
  Activity
} from "lucide-react";
import { useClerk } from "@clerk/clerk-react";

export default function LandingPage() {
  const { openSignIn } = useClerk();

  // Force light theme on landing page
  useEffect(() => {
    const root = document.documentElement;
    // Save current theme state
    const hadDarkClass = root.classList.contains("dark");
    
    // Remove dark class for light theme
    root.classList.remove("dark");
    
    // Monitor changes and remove dark class if it appears
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          if (root.classList.contains("dark")) {
            root.classList.remove("dark");
          }
        }
      });
    });
    
    // Observe class changes on root element
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });
    
    // Restore original theme and stop observing on unmount
    return () => {
      observer.disconnect();
      if (hadDarkClass) {
        root.classList.add("dark");
      }
    };
  }, []);

  const stats = [
    { label: "Global Markets", value: "18", icon: Globe },
    { label: "Trading Fee", value: "0.01%", icon: DollarSign },
    { label: "Network", value: "Mantle", icon: Shield },
    { label: "Price Data", value: "Real", icon: BarChart3 },
  ];

  const features = [
    {
      icon: TrendingUp,
      title: "Perpetual Futures",
      description: "Take long or short positions on city-specific real estate price indices without expiration dates. Trade 18 major global markets."
    },
    {
      icon: Layers,
      title: "Automated Market Makers",
      description: "Trade with confidence using AMM-based liquidity pools. Each market has isolated liquidity, ensuring risk separation."
    },
    {
      icon: Zap,
      title: "Fast & Low-Cost Trading",
      description: "Built on Mantle Network for high-speed, low-cost transactions. Trade 24/7 with instant execution and minimal fees."
    },
    {
      icon: Shield,
      title: "Smart Contract Security",
      description: "Your funds are protected by audited smart contracts on the Mantle Network. Transparent, secure, and trustless."
    },
    {
      icon: Building2,
      title: "Real-Time Price Data",
      description: "Prices based on real estate indices (Zillow Home Value Index) with real-time updates and transparent pricing."
    },
    {
      icon: Coins,
      title: "Yield Opportunities",
      description: "Earn yield by providing liquidity to markets. Generate passive income from trading fees while supporting the platform."
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/images/logos/Mantle-estate.png" 
                                //src="/images/logos/main-logo.png" 

                alt="Mantle Estate Logo" 
                className="h-15 w-15 rounded-full"
              />
              <span className="text-xl font-bold">Mantle Estate</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <a href="/docs/intro/" target="_blank" rel="noopener noreferrer">Docs</a>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/blog">Blog</Link>
              </Button>
              <Button onClick={() => openSignIn()}>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary))/0.1,transparent_50%)]" />
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap className="h-4 w-4" />
              Trade Real Estate without the hassle or complications
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
              Invest in the Global
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Real Estate Market
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Mantle Estate is a decentralized exchange built on Mantle Network that offers perpetual futures 
              tied to real estate price indices, enabling you to invest in real estate markets without owning physical property.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" onClick={() => openSignIn()} className="text-lg px-8 py-6">
                Start Trading
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
                <a href="/docs/intro/" target="_blank" rel="noopener noreferrer">Docs</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <stat.icon className="h-8 w-8 mx-auto text-primary mb-4" />
                <div className="text-3xl sm:text-4xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold">Why Mantle Estate?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A decentralized exchange built for real estate derivatives. 18 global markets. Perpetual futures. 
              Isolated liquidity pools. Dynamic risk management. Built on Mantle Network.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold">Why Traders Choose Mantle Estate</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Trade real estate derivatives without the barriers of traditional property investment. 
              Access global markets, take long or short positions, and manage risk with advanced tools.
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Traditional Real Estate */}
              <Card className="border-border">
                <CardContent className="p-6 space-y-6">
                  <h3 className="text-2xl font-bold">Traditional Real Estate</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Fees</div>
                      <div className="text-lg">5-6% of value</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Liquidity</div>
                      <div className="text-lg">Low (months)</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Minimum Entry</div>
                      <div className="text-lg">$50K+</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Availability</div>
                      <div className="text-lg">Business hours</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Short Positions</div>
                      <div className="text-lg">Not available</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mantle Estate */}
              <Card className="border-primary border-2 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Mantle Estate
                  </span>
                </div>
                <CardContent className="p-6 space-y-6 pt-10">
                  <h3 className="text-2xl font-bold">Mantle Estate</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Fees</div>
                      <div className="text-lg font-semibold text-primary">0.01-0.03%</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Liquidity</div>
                      <div className="text-lg font-semibold text-primary">AMM Pools</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Markets</div>
                      <div className="text-lg font-semibold text-primary">18 Cities</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Contract Type</div>
                      <div className="text-lg font-semibold text-primary">Perpetual Futures</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Availability</div>
                      <div className="text-lg font-semibold text-primary">24/7</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Short Positions</div>
                      <div className="text-lg font-semibold text-primary flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        Available
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Yield Opportunities</div>
                      <div className="text-lg font-semibold text-primary flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        Liquidity Mining
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-4" onClick={() => openSignIn()}>
                    Start Trading
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Other DeFi Platforms */}
              <Card className="border-border">
                <CardContent className="p-6 space-y-6">
                  <h3 className="text-2xl font-bold">Other DeFi Platforms</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Fees</div>
                      <div className="text-lg">0.5-1%</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Liquidity</div>
                      <div className="text-lg">Pool dependent</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Minimum Entry</div>
                      <div className="text-lg">$1K+</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Availability</div>
                      <div className="text-lg">24/7</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Real Estate Markets</div>
                      <div className="text-lg">Limited or None</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Contract Type</div>
                      <div className="text-lg">Various</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold">How Mantle Estate Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A decentralized exchange powered by perpetual futures and automated market makers
            </p>
          </div>
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Perpetual Futures</h3>
                <p className="text-muted-foreground">
                  Trade perpetual futures tied to city-specific real estate price indices. 
                  No expiration dates - hold positions as long as you want.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Isolated Liquidity Pools</h3>
                <p className="text-muted-foreground">
                  Each market has its own isolated liquidity pool. Risk and performance of one market 
                  don't affect others, ensuring better capital efficiency.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Real-Time Pricing</h3>
                <p className="text-muted-foreground">
                  Prices are determined by automated market makers using real-time data from 
                  Zillow Home Value Index, ensuring fair and transparent pricing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How to Start Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold">How to Get Started</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start trading synthetic real estate perpetual futures in a few simple steps
            </p>
          </div>
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">1. Connect Wallet</h3>
              <p className="text-muted-foreground">
                Connect your Mantle wallet or create a new account via Clerk authentication
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">2. Deposit Funds</h3>
              <p className="text-muted-foreground">
                Deposit USDC to the platform via our secure deposit smart contract on Mantle Network
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">3. Trade Perpetual Futures</h3>
              <p className="text-muted-foreground">
                Choose from 18 global cities, open long or short perpetual positions on real estate indices, and track your performance
              </p>
            </div>
          </div>
          <div className="text-center mt-12">
            <Button size="lg" onClick={() => openSignIn()} className="text-lg px-8 py-6">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <Card className="border-primary/50 bg-gradient-to-r from-primary/5 via-background to-primary/5">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-4xl sm:text-5xl font-bold">
                Ready to Invest in Global Real Estate Markets?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join traders using Mantle Estate to trade perpetual futures on real estate price indices. 
                Access 18 global markets, take long or short positions, and earn yield through liquidity provision.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button size="lg" onClick={() => openSignIn()} className="text-lg px-8 py-6">
                  Start Trading
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
                  <a href="/docs/intro/" target="_blank" rel="noopener noreferrer">Docs</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  //src="/images/logos/main-logo.png" 
                  src="/images/logos/Mantle-estate.png" 
                  alt="Mantle Estate Logo" 
                  className="h-12 w-12 rounded-full"
                />
                <span className="text-lg font-bold">Mantle Estate</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Decentralized exchange for perpetual futures on real estate price indices. 
                Built on Mantle Network.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><a href="/docs/intro/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Documentation</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2026 Mantle Estate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

