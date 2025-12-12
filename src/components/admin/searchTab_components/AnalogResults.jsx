import { List } from "lucide-react";
import { AnalogResultCard } from "./AnalogResultCard";

export const AnalogResults = ({
  parts,
  selectedIds,
  setSelectedIds,
  handleRemove,
}) => {
  const handleToggleSelect = (partId) => {
    selectedIds.includes(partId)
      ? handleRemove(partId)
      : setSelectedIds((prev) => [...prev, partId]);
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <List className="w-6 h-6 text-[hsl(38_92%_50%)]" />

        <h2 className="text-2xl font-bold text-[hsl(210_40%_98%)]">
          Analog Results
        </h2>
      </div>

      <div className="space-y-6">
        {parts.map((part, index) => (
          <AnalogResultCard
            key={index}
            part={part}
            onToggleSelect={handleToggleSelect}
            isSelected={(partId) => selectedIds.includes(partId)}
          />
        ))}
      </div>

      {parts.length === 0 && (
        <div className="text-center py-12 text-[hsl(215_20%_65%)]">
          No analog results found
        </div>
      )}
    </div>
  );
};
