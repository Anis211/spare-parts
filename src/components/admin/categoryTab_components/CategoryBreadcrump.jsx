import { useMemo } from "react";
import { ChevronRight } from "lucide-react";

// --- Colors (from your theme) ---
const COLORS = {
  foreground: "hsl(48 96% 89%)",
  primary: "hsl(45 93% 47%)",
  mutedForeground: "hsl(220 15% 60%)",
};

// 📦 Pass full categories list + current category
export function CategoryBreadcrumb({
  category,
  categories,
  displayMode = "auto",
}) {
  const pathParts = useMemo(() => {
    if (!category || !categories?.length) return [];

    // Build map for O(1) lookup
    const map = new Map(categories.map((cat) => [cat.STR_ID, cat]));

    // Traverse up to root
    const parts = [];
    let current = category;

    while (current) {
      // 🔍 Decide display name per node
      let displayName;
      if (displayMode === "node") {
        displayName = current.STR_NODE_NAME;
      } else if (displayMode === "path") {
        displayName =
          current.STR_PATH.split(" > ").pop() || current.STR_NODE_NAME;
      } else {
        // auto: if STR_PATH contains Cyrillic, prefer path segment (likely RU)
        const lastPathSegment = current.STR_PATH.split(" > ").pop() || "";
        if (/[а-яА-ЯёЁ]/.test(lastPathSegment)) {
          displayName = lastPathSegment;
        } else {
          displayName = current.STR_NODE_NAME;
        }
      }

      parts.unshift(displayName);
      current = current.STR_ID_PARENT ? map.get(current.STR_ID_PARENT) : null;
    }

    return parts;
  }, [category, categories, displayMode]);

  if (pathParts.length === 0) return null;

  return (
    <div className="flex items-center gap-1 text-sm flex-wrap">
      {pathParts.map((part, index) => {
        const isLast = index === pathParts.length - 1;

        return (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight
                className="w-3 h-3"
                style={{ color: COLORS.mutedForeground }}
              />
            )}
            <span
              className={isLast ? "" : "cursor-pointer"}
              style={{
                color: isLast ? COLORS.primary : COLORS.mutedForeground,
                fontWeight: isLast ? "500" : "normal",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isLast) {
                  e.target.style.color = COLORS.foreground;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLast) {
                  e.target.style.color = COLORS.mutedForeground;
                }
              }}
            >
              {part}
            </span>
          </span>
        );
      })}
    </div>
  );
}
