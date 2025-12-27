import {
  MapPin,
  DollarSign,
  Truck,
  ExternalLink,
  Package,
  Tag,
  Check,
} from "lucide-react";
import { Button } from "@/components/admin/ui/results/button";
import { Card } from "@/components/admin/ui/results/card";
import { Badge } from "@/components/admin/ui/results/badge";
import { motion } from "framer-motion";

const formatDeliveryDate = (dateStr) => {
  if (!dateStr) return "N/A";

  if (dateStr.includes("T")) {
    // ISO format
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } else if (dateStr.match(/^\d{14}$/)) {
    // Format: YYYYMMDDHHMMSS
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}.${month}.${year}`;
  }

  return dateStr;
};

export const AnalogResultCard = ({ part, isSelected, onToggleSelect }) => {
  const sourceName = part.sources[0] || "Unknown";
  const percentage = 88;

  return (
    <Card className="bg-[hsl(220_75%_12%)] border-[hsl(217_26%_25%)] overflow-hidden">
      <div className="grid grid-cols-3 gap-0">
        {/* Part Data Section */}
        <div className="p-6 border-b lg:border-b-0 lg:border-r border-[hsl(217_26%_25%)]">
          <div className="flex flex-row justify-between">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-[hsl(38_92%_50%)]" />
              <h3 className="text-[hsl(38_92%_50%)] font-semibold text-lg">
                Part Data
              </h3>
            </div>
            {onToggleSelect && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggleSelect(part.article)}
                className={`h-8 w-8 flex items-center justify-center p-1 rounded-lg border-2 border-[hsl(38_92%_50%)] ${
                  isSelected(part.article)
                    ? "bg-[hsl(38_92%_50%)]"
                    : "bg-transparent"
                }`}
              >
                {isSelected(part.article) && <Check className="text-black" />}
              </motion.button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[hsl(215_20%_65%)]" />
              <span className="text-[hsl(210_40%_98%)] font-medium">
                {part.brand}
              </span>
            </div>

            <div>
              <p className="text-[hsl(215_20%_65%)] text-sm">Name</p>
              <p className="text-[hsl(210_40%_98%)]">{part.name}</p>
            </div>

            <div className="flex items-center gap-2">
              {/* --destructive: 0 84% 60% */}
              <Tag className="w-4 h-4 text-[hsl(0_84%_60%)]" />
              <span className="text-[hsl(210_40%_98%)] font-mono text-sm">
                {part.article}
              </span>
            </div>
          </div>

          <Button className="w-full mt-6 bg-[hsl(38_92%_50%)] hover:bg-[hsl(38_92%_50%_/_0.9)] text-[hsl(217_33%_10%)] font-semibold">
            Go to the Source
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Stocks Data Section */}
        <div className="p-6 border-b lg:border-b-0 lg:border-r border-[hsl(217_26%_25%)]">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-[hsl(38_92%_50%)]" />
            <h3 className="text-[hsl(38_92%_50%)] font-semibold text-lg">
              Stocks Data ({sourceName})
            </h3>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar pr-1">
            {part.stocks.map((stock, index) => (
              <div
                key={stock.place}
                className={`space-y-2 ${
                  index !== 0 ? "pt-4 border-t border-[hsl(217_26%_25%)]" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[hsl(0_84%_60%)] mt-0.5 flex-shrink-0" />
                  <span className="text-[hsl(210_40%_98%)]">{stock.place}</span>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[hsl(38_92%_50%)] flex-shrink-0" />
                  <span className="text-[hsl(210_40%_98%)] font-semibold">
                    {stock.partPrice.toLocaleString()} ₸
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <Truck className="w-4 h-4 text-[hsl(38_92%_50%)] mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-[hsl(215_20%_65%)]">Delivery:</p>
                    <p className="text-[hsl(210_40%_98%)]">
                      {formatDeliveryDate(stock?.delivery?.start)}
                      {stock?.delivery?.end &&
                        stock?.delivery?.end !== stock?.delivery?.start &&
                        ` - ${formatDeliveryDate(stock?.delivery?.end)}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Images Section */}
        <div className="p-6">
          <div className="flex flex-row justify-between">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-[hsl(38_92%_50%)]" />
              <h3 className="text-[hsl(38_92%_50%)] font-semibold text-lg">
                Images
              </h3>
            </div>
            <div
              className={`h-[8%] text-sm text-black font-inter font-semibold flex items-center justify-center hover:bg-[hsl(220_70%_25%)]/80 hover:text-white/95 transition-colors duration-150 rounded-full px-3 py-1 ${
                percentage > 80
                  ? "bg-[hsl(140_70%_50%)]/90"
                  : percentage < 80 && percentage > 50
                  ? "bg-[hsl(45_100%_55%)]/90"
                  : "bg-[hsl(0_70%_55%)]/90 text-white/85"
              } `}
            >
              78% Match
            </div>
          </div>

          {part.pictures.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto scrollbar pr-1">
              {part.pictures.map((picture, index) => (
                <div
                  key={index}
                  className="aspect-square bg-[hsl(217_33%_10%)] rounded-lg overflow-hidden border border-[hsl(217_26%_25%)] hover:border-[hsl(38_92%_50%)] transition-colors"
                >
                  <img
                    src={picture}
                    alt={`${part.name} - Image ${index + 1}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%231e2d44'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%236b7280' font-family='sans-serif' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 bg-[hsl(217_33%_10%)] rounded-lg border border-[hsl(217_26%_25%)]">
              <p className="text-[hsl(215_20%_65%)]">No Images Available</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-3 bg-[hsl(217_26%_22%_/_0.5)] border-t border-[hsl(217_26%_25%)]">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[hsl(215_20%_65%)]">Source:</span>
          <Badge
            variant="secondary"
            className="bg-[hsl(38_92%_50%_/_0.2)] text-[hsl(38_92%_50%)] hover:bg-[hsl(38_92%_50%_/_0.3)]"
          >
            {sourceName}
          </Badge>
          {part.guid && (
            <>
              <span className="text-[hsl(215_20%_65%)] ml-4">GUID:</span>
              <span className="text-[hsl(215_20%_65%)] font-mono text-xs">
                {part.guid}
              </span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
