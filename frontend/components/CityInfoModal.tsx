import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2 } from "lucide-react";
import { getCityInfo } from "@/data/cityInfo";
import type { City } from "~backend/city/list";

interface CityInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: City | null;
}

export default function CityInfoModal({ isOpen, onClose, city }: CityInfoModalProps) {
  if (!city) return null;

  const cityInfo = getCityInfo(city.name);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-primary/20 p-2">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-2xl">{city.name}</DialogTitle>
          </div>
          <DialogDescription>
            City information and housing market overview
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* City Information */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">City Overview</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Location:</span> {city.name}, {city.country}</p>
              <p><span className="font-medium text-foreground">Current Price:</span> ${city.indexPriceUsd.toFixed(2)} per sqm</p>
              <p><span className="font-medium text-foreground">Market Price:</span> ${city.marketPriceUsd.toFixed(2)} per sqm</p>
            </div>
          </div>

          {/* Housing Trend Summary */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Housing Market Trend (Last Year)</h3>
            <div className="bg-muted rounded-lg p-4">
              {cityInfo ? (
                <p className="text-sm leading-relaxed text-foreground">
                  {cityInfo.trendSummary}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Housing market trend information is not available for this city.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
