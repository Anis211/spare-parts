import { ShoppingCart, X, Trash2 } from "lucide-react";
import { Button } from "@/components/admin/ui/results/list/button";
import { Card } from "@/components/admin/ui/results/list/card";
import { ScrollArea } from "@/components/admin/ui/results/list/scroll-area";
import { AnimatePresence, motion } from "framer-motion";

export const SelectedAnalogsSidebar = ({
  selectedParts,
  onRemove,
  onClear,
  setOpenList,
}) => {
  const totalPrice = selectedParts.reduce((sum, part) => {
    const minPrice = Math.min(...part.stocks.map((s) => s.partPrice));
    return sum + minPrice;
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.6, type: "spring" }}
      className="fixed left-[74%] top-[8%] w-[25%] backdrop-blur-md border-1 border-white/25 bg-[hsl(220_60%_20%)]/65 rounded-lg max-h-[70vh] flex flex-col"
    >
      <div className="p-6 border-b-2 border-white/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-row items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[hsl(38_92%_50%)]" />
            <h2 className="text-xl font-bold text-[hsl(210_40%_98%)]">
              Selected Analogs
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpenList(false)}
            className="text-[hsl(0_84%_60%)] hover:text-[hsl(0_84%_60%)] hover:bg-[hsl(0_84%_60%_/_0.1)]"
          >
            <X />
          </Button>
          {selectedParts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-[hsl(0_84%_60%)] hover:text-[hsl(0_84%_60%)] hover:bg-[hsl(0_84%_60%_/_0.1)]"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-[hsl(215_20%_65%)]">
          {selectedParts.length} {selectedParts.length === 1 ? "item" : "items"}{" "}
          selected
        </p>
      </div>

      <ScrollArea className="flex-1 overflow-y-scroll scrollbar">
        {selectedParts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <ShoppingCart className="w-12 h-12 text-[hsl(215_20%_65%_/_0.3)] mb-3" />
            <p className="text-[hsl(215_20%_65%)]">No analogs selected</p>
            <p className="text-sm text-[hsl(215_20%_65%)] mt-1">
              Select items from the list to add them here
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <AnimatePresence>
              {selectedParts.map((part) => {
                const minPrice = Math.min(
                  ...part.stocks.map((s) => s.partPrice)
                );
                const minStock = part.stocks.find(
                  (s) => s.partPrice === minPrice
                );

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.4, type: "spring" }}
                    key={part.article}
                  >
                    <Card
                      key={part.article}
                      className="p-4 bg-[hsl(217_33%_10%)] border-[hsl(217_26%_25%)] relative"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(part.article)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 text-[hsl(215_20%_65%)] hover:text-[hsl(0_84%_60%)]"
                      >
                        <X className="w-4 h-4" />
                      </Button>

                      <div className="pr-8">
                        <div className="flex items-start gap-3 mb-2">
                          {part.pictures[0] ? (
                            <div className="w-16 h-16 bg-[hsl(217_26%_17%)] rounded border border-[hsl(217_26%_25%)] overflow-hidden flex-shrink-0">
                              <img
                                src={part.pictures[0]}
                                alt={part.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%231e2d44'/%3E%3C/svg%3E";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-[hsl(217_26%_17%)] rounded border border-[hsl(217_26%_25%)] flex-shrink-0" />
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[hsl(38_92%_50%)] text-sm">
                              {part.brand}
                            </p>
                            <p className="text-xs text-[hsl(210_40%_98%)] line-clamp-2">
                              {part.name}
                            </p>
                            <p className="text-xs text-[hsl(215_20%_65%)] font-mono mt-1">
                              {part.article}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-[hsl(217_26%_25%)]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[hsl(215_20%_65%)]">
                              Best Price:
                            </span>
                            <span className="text-sm font-bold text-[hsl(38_92%_50%)]">
                              {minPrice.toLocaleString()} ₸
                            </span>
                          </div>
                          {minStock && (
                            <p className="text-xs text-[hsl(215_20%_65%)] mt-1">
                              {minStock.place}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {selectedParts.length > 0 && (
        <div className="p-6 border-t border-[hsl(217_26%_25%)] bg-[hsl(217_26%_22%_/_0.5)]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[hsl(210_40%_98%)] font-semibold">Total</span>
            <span className="text-2xl font-bold text-[hsl(38_92%_50%)]">
              {totalPrice.toLocaleString()} ₸
            </span>
          </div>
          <Button className="w-full bg-[hsl(38_92%_50%)] hover:bg-[hsl(38_92%_50%_/_0.9)] text-[hsl(217_33%_10%)] font-semibold">
            Save For Later
          </Button>
        </div>
      )}
    </motion.div>
  );
};
