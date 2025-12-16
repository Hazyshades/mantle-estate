import type { City } from "~backend/city/list";
import CityCard from "./CityCard";

interface CityGridProps {
  cities: City[];
  balance: number;
  onTradeComplete: () => void;
}

export default function CityGrid({ cities, balance, onTradeComplete }: CityGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cities.map((city) => (
        <CityCard key={city.id} city={city} balance={balance} onTradeComplete={onTradeComplete} />
      ))}
    </div>
  );
}
