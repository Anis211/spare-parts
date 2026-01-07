export const Statistics = ({ mainCategories, totalCategories }) => {
  return (
    <div className="bg-[hsl(220_18%_13%)] rounded-xl border border-[hsl(220_15%_22%)] overflow-hidden">
      <div className="px-4 py-3 bg-[hsl(220_15%_18%)] border-b border-[hsl(220_15%_22%)]">
        <h2 className="text-base font-semibold text-[hsl(45_10%_95%)]">
          Статистика
        </h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-[hsl(200_80%_55%)]">
              {mainCategories}
            </p>
            <p className="text-xs text-[hsl(220_10%_55%)] uppercase tracking-wide mt-1">
              основных категорий
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[hsl(45_100%_50%)]">
              {totalCategories}
            </p>
            <p className="text-xs text-[hsl(220_10%_55%)] uppercase tracking-wide mt-1">
              всего категорий
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
