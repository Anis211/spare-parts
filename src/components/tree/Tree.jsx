import { useState, useEffect } from "react";

// Helper: Build tree from STR_PATH
const buildTreeFromPaths = (data) => {
  const root = { children: {} };

  data.forEach((item) => {
    const parts = item.STR_PATH.split(" > ");
    let currentNode = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (!currentNode.children[part]) {
        currentNode.children[part] = {
          name: part,
          children: {},
        };
      }

      currentNode = currentNode.children[part];
    }

    // Store full item at the deepest node
    currentNode.item = item;
  });

  // Flatten object-based children to array
  const flatten = (node) => {
    const items = Object.values(node.children).map((child) => ({
      ...child,
      children: flatten(child),
    }));

    return items;
  };

  return flatten(root);
};

const TreeNode = ({ node, level = 1 }) => {
  const [isOpen, setIsOpen] = useState(level === 0); // Open level 1 by default
  const hasChildren = node.children?.length > 0;

  return (
    <div style={{ marginLeft: `${(level - 1) * 10}px` }}>
      <div
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        style={{
          cursor: hasChildren ? "pointer" : "default",
          fontWeight: level === 1 ? "semibold" : "normal",
        }}
      >
        {hasChildren ? (isOpen ? "▼" : "▶") : "—"} {node.name}
      </div>

      {hasChildren && isOpen && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.name} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const ExpandableTreeFromPath = ({ data }) => {
  const tree = buildTreeFromPaths(data);

  return (
    <div className="mt-6">
      {tree.map((node, index) => (
        <>
          <TreeNode key={node.name} node={node} level={1} />
          <div key={index} className="border-b-1 border-b-white my-2 w-full" />
        </>
      ))}
    </div>
  );
};

export default ExpandableTreeFromPath;
