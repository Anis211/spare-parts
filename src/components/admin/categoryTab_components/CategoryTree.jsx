import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TreeNode = ({ category, level, onSelect, selectedId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedId === category.id;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    onSelect(category);
  };

  return (
    <div>
      <button
        onClick={handleSelect}
        className={cn(
          "w-full flex items-center gap-2 py-2 px-3 rounded-lg transition-all duration-200 group",
          isSelected
            ? "bg-[hsl(45_100%_50%)]/15 text-[hsl(45_100%_50%)]"
            : "hover:bg-[hsl(220_15%_18%)] text-[hsl(45_10%_95%)]/80 hover:text-[hsl(45_10%_95%)]"
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        <span
          onClick={handleToggle}
          className="flex items-center justify-center w-5 h-5"
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-[hsl(220_10%_55%)]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[hsl(220_10%_55%)]" />
            )
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(220_10%_55%)]/50" />
          )}
        </span>

        {hasChildren ? (
          isExpanded ? (
            <FolderOpen
              className={cn(
                "w-4 h-4",
                isSelected
                  ? "text-[hsl(45_100%_50%)]"
                  : "text-[hsl(45_100%_50%)]/70"
              )}
            />
          ) : (
            <Folder
              className={cn(
                "w-4 h-4",
                isSelected
                  ? "text-[hsl(45_100%_50%)]"
                  : "text-[hsl(45_100%_50%)]/70"
              )}
            />
          )
        ) : (
          <FileText className="w-4 h-4 text-[hsl(220_10%_55%)]" />
        )}

        <span className="flex-1 text-left text-sm font-medium truncate">
          {category.name}
        </span>

        {category.count !== undefined && (
          <span
            className={cn(
              "px-2 py-0.5 text-xs font-semibold rounded-full",
              isSelected
                ? "bg-[hsl(45_100%_50%)] text-[hsl(220_20%_10%)]"
                : "bg-[hsl(220_15%_20%)] text-[hsl(220_10%_55%)]"
            )}
          >
            {category.count}
          </span>
        )}
      </button>

      {hasChildren && isExpanded && (
        <div className="animate-fade-in">
          {category.children.map((child) => (
            <TreeNode
              key={child.id}
              category={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoryTree = ({ categories, onSelectCategory, selectedId }) => {
  return (
    <div className="bg-[hsl(220_18%_13%)] rounded-xl border border-[hsl(220_15%_22%)] overflow-hidden">
      <div className="px-4 py-3 bg-[hsl(45_100%_50%)]/10 border-b border-[hsl(220_15%_22%)]">
        <h2 className="text-base font-semibold text-[hsl(45_100%_50%)]">
          Дерево категорий
        </h2>
      </div>
      <div className="p-2 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
        {categories.map((category) => (
          <TreeNode
            key={category.id}
            category={category}
            level={0}
            onSelect={onSelectCategory}
            selectedId={selectedId}
          />
        ))}
      </div>
    </div>
  );
};
