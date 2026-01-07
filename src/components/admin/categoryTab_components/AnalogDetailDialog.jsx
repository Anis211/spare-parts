import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/category/dialog";
import { Badge } from "@/components/admin/ui/category/badge";
import { Separator } from "@/components/admin/ui/category/separator";
import {
  Package,
  MapPin,
  DollarSign,
  Tag,
  Building2,
  Hash,
  Image,
} from "lucide-react";

export const AnalogDetailDialog = ({ analog, open, onOpenChange }) => {
  if (!analog) return null;

  const totalStock = analog.stockPlaces.reduce(
    (sum, place) => sum + place.quantity,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[hsl(220_18%_13%)] border-[hsl(220_15%_22%)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[hsl(45_10%_95%)] flex items-center gap-2">
            <Package className="w-5 h-5 text-[hsl(45_100%_50%)]" />
            Детали аналога
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-[hsl(220_15%_18%)] border border-[hsl(220_15%_22%)]">
              <img
                src={analog.imageUrl}
                alt={analog.partName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-[hsl(220_10%_55%)]">
              <Image className="w-3.5 h-3.5" />
              <span>Фото товара</span>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            {/* Article */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-[hsl(220_10%_55%)] uppercase tracking-wide">
                <Hash className="w-3.5 h-3.5" />
                Артикул
              </div>
              <Badge
                variant="outline"
                className="text-sm border-[hsl(45_100%_50%)]/50 text-[hsl(45_100%_50%)] font-mono"
              >
                {analog.article}
              </Badge>
            </div>

            {/* Part Name */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-[hsl(220_10%_55%)] uppercase tracking-wide">
                <Tag className="w-3.5 h-3.5" />
                Наименование
              </div>
              <p className="text-[hsl(45_10%_95%)] font-semibold">
                {analog.partName}
              </p>
            </div>

            {/* Brand */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-[hsl(220_10%_55%)] uppercase tracking-wide">
                <Building2 className="w-3.5 h-3.5" />
                Бренд
              </div>
              <Badge variant="secondary" className="text-sm">
                {analog.brandName}
              </Badge>
            </div>

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-[hsl(220_10%_55%)] uppercase tracking-wide">
                <DollarSign className="w-3.5 h-3.5" />
                Стоимость
              </div>
              <p className="text-2xl font-bold text-[hsl(142_70%_45%)]">
                {analog.cost.toLocaleString("ru-RU")} {analog.currency}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Stock Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(45_10%_95%)]">
              <Package className="w-4 h-4 text-[hsl(45_100%_50%)]" />
              Наличие на складах
            </div>
            <Badge className="bg-[hsl(45_100%_50%)] text-[hsl(220_20%_10%)]">
              Всего: {totalStock} шт.
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {analog.stockPlaces.map((place, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-[hsl(220_15%_18%)] rounded-lg border border-[hsl(220_15%_22%)]"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[hsl(45_100%_50%)]" />
                  <span className="text-sm text-[hsl(45_10%_95%)]">
                    {place.location}
                  </span>
                </div>
                <Badge variant="outline" className="font-mono">
                  {place.quantity} шт.
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
