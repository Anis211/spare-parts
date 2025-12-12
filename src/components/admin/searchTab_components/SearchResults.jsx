import { Search, PanelBottomClose, PanelBottomOpen, Trash } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import WaveMenu from "./Loader";
import { AnalogResults } from "./AnalogResults";

export default function SearchResults({
  results,
  setResults,
  wraped,
  setWraped,
  isLoading,
  selectedIds,
  setSelectedIds,
  handleRemove,
}) {
  const handleResultRemove = async (resultToRemove) => {
    const filteredResults = results.filter(
      (result) => result !== resultToRemove
    );
    setResults(filteredResults);

    const result = await fetch("/api/admin/save", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: resultToRemove }),
    });
    const data = await result.json();
    console.log("Delete Result Response:", data);
  };
  return (
    <div className="flex flex-col gap-2 mx-5 w-full">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="mx-auto my-6"
          >
            <WaveMenu />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {results.map((result, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.8, type: "spring", delay: 0.8 }}
            className="flex flex-col gap-3 border-[hsl(220_50%_25%)] bg-[hsl(220_60%_20%)] rounded-lg px-5 pt-6 pb-8"
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-row gap-2 items-center">
                <Search className="text-[hsl(45_100%_51%)]" />
                <h2 className="text-white text-2xl font-inter font-bold">
                  User Query
                </h2>
                <AnimatePresence>
                  {!wraped[index] ? (
                    <motion.div
                      whileTap={{
                        opacity: 0,
                        transition: { duration: 0.7, type: "spring" },
                      }}
                      onClick={() =>
                        setWraped((prev) => ({ ...prev, [index]: true }))
                      }
                    >
                      <PanelBottomClose className="text-[hsl(45_100%_51%)]" />
                    </motion.div>
                  ) : (
                    <motion.div
                      whileTap={{
                        opacity: 0,
                        transition: { duration: 0.7, type: "spring" },
                      }}
                      onClick={() =>
                        setWraped((prev) => ({ ...prev, [index]: false }))
                      }
                    >
                      <PanelBottomOpen className="text-[hsl(45_100%_51%)]" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{
                    scale: 0.9,
                    transition: { duration: 0.7, type: "spring" },
                  }}
                  onClick={() => handleResultRemove(result)}
                >
                  <Trash className="text-[hsl(0_84%_60%)]" />
                </motion.button>
              </div>
              <div className="flex flex-row gap-6">
                {result.user.image != null && (
                  <img
                    src={result.user.image}
                    alt="input image"
                    className="w-30 h-30 rounded-lg object-cover"
                  />
                )}
                <p className="text-white text-lg font-inter font-normal">
                  {result.user.part +
                    " по следующему VIN номеру " +
                    result.user.vin}
                </p>
              </div>
            </div>

            <AnimatePresence>
              {!wraped[index] && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, type: "spring" }}
                  className="border-b-1 border-b-white w-full mx-auto my-6"
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!wraped[index] && (
                <motion.div
                  initial={{ opacity: 0, height: "0%" }}
                  animate={{ opacity: 1, height: "100%" }}
                  exit={{ opacity: 0, height: "0%" }}
                  transition={{ duration: 0.4, type: "spring" }}
                  className="flex flex-col gap-3"
                >
                  <AnalogResults
                    parts={result.items.analogs}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    handleRemove={handleRemove}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
