import SearchForm from "./searchTab_components/SearchFrom";
import SearchResults from "./searchTab_components/SearchResults";
import { useState, useEffect } from "react";
import { SelectedAnalogsSidebar } from "./searchTab_components/SelectedAnalogs";
import { ListChecks } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function SearchTab({ results, setResults, setRecentSearches }) {
  const [wraped, setWraped] = useState({});

  const [isLoading, setIsLoading] = useState(false);
  const [openList, setOpenList] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedParts, setSelectedParts] = useState([]);

  useEffect(() => {
    const wrap = () => {
      let answer = {};
      results.map((r, i) => (answer[i] = true));

      setWraped(answer);
      console.log(answer);
    };

    results.length > 0 && wrap();
  }, [results]);

  useEffect(() => {
    setSelectedParts((prev) => [
      ...prev,
      ...results.flatMap((res) =>
        res.items.analogs.filter(
          (part) =>
            selectedIds.includes(part.article) &&
            !prev.some((p) => p.article === part.article)
        )
      ),
    ]);

    setTimeout(() => {
      console.log("Selected Parts Updated:", selectedParts);
      console.log("Selected IDs:", selectedIds);
    }, 1000);
  }, [selectedIds]);

  const handleRemove = (partId) => {
    setSelectedIds((prev) => prev.filter((id) => id !== partId));
    setSelectedParts((prev) => prev.filter((part) => part.article !== partId));
  };

  const handleClear = () => {
    setSelectedIds([]);
    setSelectedParts([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, type: "spring" }}
      className="flex flex-col gap-3"
    >
      <SearchForm
        results={results}
        setResults={setResults}
        setRecentSearches={setRecentSearches}
        setIsLoading={setIsLoading}
      />
      <div className="flex flex-row">
        <AnimatePresence>
          {!openList && results.length > 0 && (
            <motion.button
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4, type: "spring" }}
              layout
              whileTap={{ scale: 0.9 }}
              onClick={() => setOpenList(true)}
              className="fixed left-[95%] top-[9%] w-12 h-12 z-30 p-1 rounded-xl bg-[hsl(220_75%_12%)]/65 border-1 border-white/45 text-white hover:bg-[hsl(38_92%_50%)] hover:text-[hsl(220_75%_12%)] transition-colors flex items-center justify-center"
            >
              <ListChecks className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>
        <SearchResults
          results={results}
          setResults={setResults}
          wraped={wraped}
          setWraped={setWraped}
          isLoading={isLoading}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          handleRemove={handleRemove}
          setRecentSearches={setRecentSearches}
        />
        <AnimatePresence>
          {results.length > 0 && openList ? (
            <SelectedAnalogsSidebar
              selectedParts={selectedParts}
              onRemove={handleRemove}
              onClear={handleClear}
              setOpenList={setOpenList}
            />
          ) : (
            ""
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
