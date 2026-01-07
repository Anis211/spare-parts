import { Link2, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/admin/ui/category/button";

export const InfoPanel = ({
  selectedCategory,
  onSearchAnalogs,
  isSearching,
}) => {
  return (
    <div className="bg-[hsl(220_18%_13%)] rounded-xl border border-[hsl(220_15%_22%)] overflow-hidden">
      <div className="px-4 py-3 bg-[hsl(45_100%_50%)]/10 border-b border-[hsl(220_15%_22%)]">
        <h2 className="text-base font-semibold text-[hsl(45_100%_50%)]">
          Информация
        </h2>
      </div>

      <div className="p-6">
        {selectedCategory ? (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(45_100%_50%)]/10 flex items-center justify-center">
                <Link2 className="w-8 h-8 text-[hsl(45_100%_50%)]" />
              </div>
              <h3 className="text-lg font-semibold text-[hsl(45_10%_95%)] mb-1">
                {selectedCategory.name}
              </h3>
              {selectedCategory.nameEn && (
                <p className="text-xs text-[hsl(220_10%_55%)] mb-2">
                  {selectedCategory.nameEn}
                </p>
              )}
              {selectedCategory.count !== undefined && (
                <p className="text-sm text-[hsl(220_10%_55%)]">
                  {selectedCategory.count} подкатегорий
                </p>
              )}
              {selectedCategory.path && (
                <p className="text-xs text-[hsl(220_10%_55%)] mt-2 px-2">
                  {selectedCategory.path}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-[hsl(220_15%_22%)]">
              <Button
                onClick={onSearchAnalogs}
                disabled={isSearching}
                className="w-full bg-[hsl(45_100%_50%)] hover:bg-[hsl(45_100%_50%)]/90 text-[hsl(220_20%_10%)] font-semibold"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Поиск...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Поиск аналогов
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(220_15%_20%)] flex items-center justify-center">
              <Link2 className="w-8 h-8 text-[hsl(220_10%_55%)]" />
            </div>
            <p className="text-sm text-[hsl(220_10%_55%)]">
              Выберите категорию для просмотра информации
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
