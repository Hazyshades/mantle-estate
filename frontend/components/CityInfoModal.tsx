import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, ArrowUp, Square, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { getCityDetails, getCityMapIframeUrl } from "@/data/cityDetails";
import { getCityImages } from "@/data/cityImages";
import type { City } from "~backend/city/list";

interface CityInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: City | null;
}

export default function CityInfoModal({ isOpen, onClose, city }: CityInfoModalProps) {
  const [imageErrors, setImageErrors] = useState<{ sights: boolean; outdoors: boolean }>({ sights: false, outdoors: false });
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  
  if (!city) return null;

  const cityDetails = getCityDetails(city.name);
  const cityImages = getCityImages(city.name);
  const mapIframeUrl = getCityMapIframeUrl(city.name);

  const sightsImages = cityImages?.sights || [];
  const outdoorsImages = cityImages?.outdoors || [];
  
  // Get current images for both cards based on pair index
  const currentSightsImage = sightsImages.length > 0 
    ? sightsImages[Math.min(currentPairIndex, sightsImages.length - 1)] 
    : null;
  const currentOutdoorsImage = outdoorsImages.length > 0 
    ? outdoorsImages[Math.min(currentPairIndex, outdoorsImages.length - 1)] 
    : null;
  
  // Calculate max pairs (maximum of both arrays)
  const maxPairs = Math.max(sightsImages.length, outdoorsImages.length);
  const hasMultiplePairs = maxPairs > 1;

  // Format city location (e.g., "Illinois, US")
  const getLocationText = () => {
    const parts = city.name.split(",");
    if (parts.length > 1) {
      const state = parts[1].trim();
      return `${state}, ${city.country}`;
    }
    return city.country;
  };

  // Format population with commas
  const formatPopulation = (pop: number) => {
    return pop.toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 text-white border-slate-700">
        <DialogHeader className="space-y-4">
          {/* Header with title and location */}
          <div className="space-y-1">
            <DialogTitle className="text-3xl font-bold">{city.name.split(",")[0]}</DialogTitle>
            <DialogDescription className="text-blue-400 text-base">
              {getLocationText()}
            </DialogDescription>
          </div>

          {/* Statistics */}
          {cityDetails && (
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-400 uppercase">Population</span>
                </div>
                <span className="text-lg font-semibold">{formatPopulation(cityDetails.population)}</span>
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUp className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-400 uppercase">Elevation</span>
                </div>
                <span className="text-lg font-semibold">{cityDetails.elevation}</span>
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1">
                  <Square className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-400 uppercase">Area</span>
                </div>
                <span className="text-lg font-semibold">{cityDetails.area}</span>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* City Images with Unified Carousel */}
          {cityImages && (sightsImages.length > 0 || outdoorsImages.length > 0) && (
            <div className="relative px-8">
              <div className="grid grid-cols-2 gap-3">
                {/* Sights Card */}
                {sightsImages.length > 0 && currentSightsImage && !imageErrors.sights && (
                  <div className="relative rounded-lg overflow-hidden h-48 group">
                    <img
                      src={currentSightsImage}
                      alt={`${city.name} sights`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={() => {
                        console.error(`Failed to load sights image for ${city.name}:`, currentSightsImage);
                        setImageErrors(prev => ({ ...prev, sights: true }));
                      }}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="text-white font-semibold text-sm">Sights</span>
                    </div>
                  </div>
                )}
                {imageErrors.sights && (
                  <div className="relative rounded-lg overflow-hidden h-48 bg-slate-800 flex items-center justify-center">
                    <span className="text-slate-400 text-sm">Sights image failed to load</span>
                  </div>
                )}
                
                {/* Outdoors Card */}
                {outdoorsImages.length > 0 && currentOutdoorsImage && !imageErrors.outdoors && (
                  <div className="relative rounded-lg overflow-hidden h-48 group">
                    <img
                      src={currentOutdoorsImage}
                      alt={`${city.name} outdoors`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={() => {
                        console.error(`Failed to load outdoors image for ${city.name}:`, currentOutdoorsImage);
                        setImageErrors(prev => ({ ...prev, outdoors: true }));
                      }}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="text-white font-semibold text-sm">Outdoors</span>
                    </div>
                  </div>
                )}
                {imageErrors.outdoors && (
                  <div className="relative rounded-lg overflow-hidden h-48 bg-slate-800 flex items-center justify-center">
                    <span className="text-slate-400 text-sm">Outdoors image failed to load</span>
                  </div>
                )}
              </div>

              {/* Unified Carousel Controls - positioned inside the container */}
              {hasMultiplePairs && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPairIndex((prev) => (prev === 0 ? maxPairs - 1 : prev - 1));
                    }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 rounded-full p-2 transition-colors z-10 shadow-lg"
                  >
                    <ChevronLeft className="h-5 w-5 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPairIndex((prev) => (prev === maxPairs - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 rounded-full p-2 transition-colors z-10 shadow-lg"
                  >
                    <ChevronRight className="h-5 w-5 text-white" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Map */}
          {mapIframeUrl && (
            <div className="w-full h-64 rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
              <iframe
                src={mapIframeUrl}
                className="w-full h-full border-0"
                title={`Map showing ${city.name}`}
                loading="lazy"
                allowFullScreen
              />
            </div>
          )}

          {/* About Section */}
          {cityDetails && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">About</h3>
              <p className="text-sm leading-relaxed text-slate-300">
                {cityDetails.description}
              </p>
            </div>
          )}

          {/* Housing Trend Summary */}
          {cityDetails && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Housing Market Trend (Last Year)</h3>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-sm leading-relaxed text-slate-300">
                  {cityDetails.trendSummary}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

