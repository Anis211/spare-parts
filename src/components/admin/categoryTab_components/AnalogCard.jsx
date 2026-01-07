import { Package, MapPin, DollarSign, ExternalLink } from "lucide-react";
import { Badge } from "@/components/admin/ui/category/badge";

export const AnalogCard = ({ analog, onClick }) => {
  const totalStock = analog.stockPlaces.reduce(
    (sum, place) => sum + place.quantity,
    0
  );

  return (
    <div
      className="bg-[hsl(220_18%_13%)] rounded-xl border border-[hsl(220_15%_22%)] overflow-hidden hover:border-[hsl(45_100%_50%)]/50 transition-all duration-300 animate-fade-in group cursor-pointer"
      onClick={() => onClick?.(analog)}
    >
      <div className="flex">
        {/* Image */}
        <div className="w-32 h-32 flex-shrink-0 bg-[hsl(220_15%_18%)] overflow-hidden">
          <img
            src={analog.imageUrl}
            alt={analog.partName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className="text-xs border-[hsl(45_100%_50%)]/50 text-[hsl(45_100%_50%)]"
                >
                  {analog.article}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {analog.brandName}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[hsl(45_10%_95%)] truncate">
                  {analog.partName}
                </h3>
                <ExternalLink className="w-3.5 h-3.5 text-[hsl(220_10%_55%)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold text-[hsl(142_70%_45%)] flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {analog.cost.toFixed(2)}
              </p>
              <p className="text-xs text-[hsl(220_10%_55%)]">
                {analog.currency}
              </p>
            </div>
          </div>

          {/* Stock info */}
          <div className="mt-3 pt-3 border-t border-[hsl(220_15%_22%)]">
            <div className="flex items-center gap-2 text-xs text-[hsl(220_10%_55%)] mb-2">
              <Package className="w-3.5 h-3.5" />
              <span>
                Всего на складах:{" "}
                <span className="text-[hsl(45_10%_95%)] font-semibold">
                  {totalStock} шт.
                </span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {analog.stockPlaces.map((place, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 bg-[hsl(220_15%_18%)] rounded-md text-xs"
                >
                  <MapPin className="w-3 h-3 text-[hsl(45_100%_50%)]" />
                  <span className="text-[hsl(220_10%_55%)]">
                    {place.location}:
                  </span>
                  <span className="font-semibold text-[hsl(45_10%_95%)]">
                    {place.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
