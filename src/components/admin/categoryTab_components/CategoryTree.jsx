import { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
} from "lucide-react";

// --- Color Palette (from your :root) ---
const COLORS = {
  background: "hsl(222 47% 11%)",
  foreground: "hsl(48 96% 89%)",
  primary: "hsl(45 93% 47%)",
  primaryForeground: "hsl(222 47% 11%)",
  secondary: "hsl(222 47% 18%)",
  muted: "hsl(222 30% 20%)",
  mutedForeground: "hsl(220 15% 60%)",
  border: "hsl(222 30% 25%)",
  treeLine: "hsl(222 30% 30%)",
  treeHover: "hsl(222 47% 16%)",
  goldSoft: "hsl(45 80% 55%)",
};

// --- Helper: Build tree from flat list (ID-based) ---
function buildTree(categories) {
  const map = new Map();
  const roots = [];

  categories.forEach((cat) => {
    map.set(cat.STR_ID, { category: cat, children: [] });
  });

  categories.forEach((cat) => {
    const node = map.get(cat.STR_ID);
    if (cat.STR_ID_PARENT === null) {
      roots.push(node);
    } else {
      const parent = map.get(cat.STR_ID_PARENT);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return roots;
}

// --- Helper: Get display name per node (same as breadcrumb) ---
function getDisplayName(category, displayMode = "auto") {
  if (displayMode === "node") {
    return category.STR_NODE_NAME;
  } else if (displayMode === "path") {
    return category.STR_PATH.split(" > ").pop() || category.STR_NODE_NAME;
  } else {
    // auto: use STR_PATH segment if it contains Cyrillic
    const lastPath = category.STR_PATH.split(" > ").pop() || "";
    return /[а-яА-ЯёЁ]/.test(lastPath) ? lastPath : category.STR_NODE_NAME;
  }
}

// --- TreeNodeItem ---
function TreeNodeItem({
  node,
  level,
  onSelect,
  categories,
  displayMode = "auto",
}) {
  const [isExpanded, setIsExpanded] = useState(level === 0); // Expand roots by default
  const hasChildren = node.children.length > 0;
  const displayName = getDisplayName(node.category, displayMode);

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onSelect?.(node.category);
  };

  // Text color by level (matches your original intent)
  const levelColors = [
    COLORS.primary, // L0: gold
    COLORS.goldSoft, // L1: soft gold
    COLORS.foreground, // L2: light
    COLORS.mutedForeground, // L3+: muted
  ];
  const textColor = levelColors[Math.min(level, levelColors.length - 1)];

  return (
    <div className="animate-fade-in">
      <div
        onClick={handleToggle}
        className="flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-all duration-200 group"
        style={{
          paddingLeft: `${level * 20 + 12}px`,
          backgroundColor: level === 0 ? COLORS.secondary : "transparent",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.treeHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor =
            level === 0 ? COLORS.secondary : "transparent";
        }}
      >
        {/* Expand/Collapse Icon */}
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown
                className="w-4 h-4 transition-transform"
                style={{ color: COLORS.primary }}
              />
            ) : (
              <ChevronRight
                className="w-4 h-4 transition-colors"
                style={{ color: COLORS.mutedForeground }}
              />
            )
          ) : (
            <span
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: COLORS.mutedForeground }}
            />
          )}
        </span>

        {/* Folder/File Icon */}
        <span className="flex-shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen
                className="w-4 h-4"
                style={{ color: COLORS.primary }}
              />
            ) : (
              <Folder className="w-4 h-4" style={{ color: COLORS.goldSoft }} />
            )
          ) : (
            <FileText
              className="w-4 h-4"
              style={{ color: COLORS.mutedForeground }}
            />
          )}
        </span>

        {/* Node Name */}
        <span
          className="text-sm truncate"
          style={{ color: textColor, fontWeight: level === 0 ? 500 : "normal" }}
        >
          {displayName}
        </span>

        {/* Children count badge */}
        {hasChildren && (
          <span
            className="ml-auto text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "hsla(45, 93%, 47%, 0.2)",
              color: COLORS.primary,
            }}
          >
            {node.children.length}
          </span>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="relative">
          <div
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${level * 20 + 22}px`,
              backgroundColor: COLORS.treeLine,
            }}
          />
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.category.STR_ID}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              categories={categories}
              displayMode={displayMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- CategoryTree Export ---
export function CategoryTree({
  categories,
  onSelect,
  displayMode = "auto", // "node" | "path" | "auto"
}) {
  const tree = useMemo(() => buildTree(categories), [categories]);

  return (
    <div className="space-y-1">
      {tree.map((node) => (
        <TreeNodeItem
          key={node.category.STR_ID}
          node={node}
          level={0}
          onSelect={onSelect}
          categories={categories}
          displayMode={displayMode}
        />
      ))}
    </div>
  );
}
