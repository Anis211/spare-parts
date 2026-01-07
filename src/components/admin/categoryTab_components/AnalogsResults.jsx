import { X, Package } from "lucide-react";
import { Button } from "@/components/admin/ui/category/button";
import { AnalogCard } from "./AnalogCard";

export const AnalogsResults = ({
  analogs,
  category,
  onClose,
  onSelectAnalog,
}) => {
  return (
    <div className="bg-[hsl(220_18%_13%)] rounded-xl border border-[hsl(220_15%_22%)] overflow-hidden animate-fade-in">
      <div className="px-4 py-3 bg-[hsl(142_70%_45%)]/10 border-b border-[hsl(220_15%_22%)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-[hsl(142_70%_45%)]" />
          <div>
            <h2 className="text-base font-semibold text-[hsl(45_10%_95%)]">
              Найденные аналоги
            </h2>
            <p className="text-xs text-[hsl(220_10%_55%)]">
              Категория: {category.name} • {analogs.length} результатов
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-[hsl(0_70%_50%)]/10 hover:text-[hsl(0_70%_50%)]"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar space-y-3">
        {analogs.length > 0 ? (
          analogs.map((analog) => (
            <AnalogCard
              key={analog.id}
              analog={analog}
              onClick={onSelectAnalog}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-[hsl(220_10%_55%)] mb-3" />
            <p className="text-[hsl(220_10%_55%)]">Аналоги не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
};
