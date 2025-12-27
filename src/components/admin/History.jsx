import { useState, useMemo } from "react";
import { History } from "lucide-react";
import { VinCard } from "@/components/admin/history_components/VinCard";
import { SearchHeader } from "@/components/admin/history_components/SearchHeader";
import { motion } from "framer-motion";

const SearchHistory = ({ vinHistory, setResults, results, setActiveTab }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim() || vinHistory == null) return vinHistory;

    const query = searchQuery.toLowerCase();
    return vinHistory.filter(
      (item) =>
        item.vin.toLowerCase().includes(query) ||
        (item.phone && item.phone.includes(query))
    );
  }, [searchQuery]);

  const totalRequests = vinHistory?.reduce(
    (acc, item) => acc + item.requests.length,
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, type: "spring" }}
      className="min-h-screen flex w-full"
    >
      <main className="flex-1 flex flex-col">
        {/* Content */}
        <div
          className="flex-1 p-6 overflow-auto scrollbar-thin bg-transparent"
          style={{
            color: "hsl(210 40% 98%)",
          }}
        >
          <SearchHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {filteredHistory?.length === 0 || vinHistory == null ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
                style={{
                  backgroundColor: "hsl(213 35% 18% / 0.5)",
                }}
              >
                <History
                  className="h-8 w-8"
                  style={{ color: "hsl(215 20% 65%)" }}
                />
              </div>
              <h3
                className="text-lg font-medium mb-1"
                style={{ color: "hsl(210 40% 98%)" }}
              >
                No results found
              </h3>
              <p style={{ color: "hsl(215 20% 65%)" }} className="text-sm">
                Try adjusting your search query
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory?.map((vinHistory, index) => (
                <VinCard
                  key={vinHistory.vin}
                  vin={vinHistory.vin}
                  vinHistory={vinHistory}
                  index={index}
                  setResults={setResults}
                  results={results}
                  setActiveTab={setActiveTab}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </motion.div>
  );
};

export default SearchHistory;
