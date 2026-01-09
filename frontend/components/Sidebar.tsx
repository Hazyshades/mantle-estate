import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Building2,
  TrendingUp,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  positionsCount?: number;
  onTabChange?: (tab: "markets" | "positions" | "history") => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ positionsCount = 0, onTabChange, collapsed: collapsedProp, onCollapsedChange }: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use controlled state if provided, otherwise use internal state
  const collapsed = collapsedProp !== undefined ? collapsedProp : internalCollapsed;
  const setCollapsed = (value: boolean) => {
    if (onCollapsedChange) {
      onCollapsedChange(value);
    } else {
      setInternalCollapsed(value);
    }
  };

  const menuItems = [
    {
      id: "markets",
      label: "Markets",
      icon: Building2,
      imageSrc: "/images/logos/markets.png",
      path: "/",
      badge: null,
    },
    {
      id: "positions",
      label: "Positions",
      icon: TrendingUp,
      path: "/positions",
      badge: positionsCount > 0 ? positionsCount : null,
    },
    {
      id: "history",
      label: "History",
      icon: History,
      path: "/history",
      badge: null,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/settings",
      badge: null,
    },
  ];

  const isActive = (path: string, id: string) => {
    if (path === "/" || id === "markets") {
      return location.pathname === "/" || location.pathname === "/markets";
    }
    if (id === "positions") {
      return location.pathname === "/positions";
    }
    if (id === "history") {
      return location.pathname === "/history";
    }
    if (id === "settings") {
      return location.pathname === "/settings";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      aria-label="Sidebar navigation"
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-sidebar-foreground">Trading</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto h-8 w-8"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4" aria-label="Main navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.id);
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "settings") {
                    // Settings has its own page
                    navigate("/settings");
                  } else if (item.id === "markets") {
                    // Navigate to markets (or home)
                    navigate("/markets");
                  } else {
                    // Positions, History use tabs in Dashboard
                    // Navigate to the appropriate route - Dashboard will sync the tab via useEffect
                    navigate(item.path);
                  }
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground",
                  collapsed && "justify-center"
                )}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge !== null && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

