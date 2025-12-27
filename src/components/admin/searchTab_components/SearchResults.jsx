import {
  Search,
  PanelBottomClose,
  PanelBottomOpen,
  Trash,
  GitCompareArrows,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import WaveMenu from "./Loader";
import { AnalogResults } from "./AnalogResults";
import useUser from "@/zustand/user";

export default function SearchResults({
  results,
  setResults,
  wraped,
  setWraped,
  isLoading,
  selectedIds,
  setSelectedIds,
  handleRemove,
  setRecentSearches,
}) {
  const setVin = useUser((state) => state.setVin);
  const vin = useUser((state) => state.vin);

  const handleResultRemove = async (resultToRemove) => {
    if (results.length == 1) {
      setRecentSearches((prev) =>
        prev.length > 1 ? prev.filter((search) => search.vin != vin) : []
      );
      setVin("");
    }

    const filteredResults = results.filter(
      (result) => result !== resultToRemove
    );
    setResults(filteredResults);

    let readyIds = [];
    const filtered = resultToRemove.items.analogs.filter(
      (analog) => analog.sources[0] == "shatem"
    );

    for (let i = 0; i < filtered.length; i++) {
      filtered[i].pictures.map((picture) =>
        readyIds.push(picture.split("images/")[1])
      );
    }
    console.log("Image Ids to Delete: ", readyIds);

    const res = await fetch("/api/images/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: readyIds,
      }),
    });
    const response = await res.json();
    console.log("Delete Result Images Response:", response);

    const result = await fetch("/api/admin/save", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: resultToRemove, length: results.length }),
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
            className="mx-auto my-2"
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
            className="flex flex-col gap-3 border-[hsl(220_50%_25%)] bg-[hsl(222_47%_9%)] rounded-lg px-5 pt-6 pb-8"
          >
            <div className="max-h-[7vw] flex flex-col gap-6">
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
                {result.user.userImages.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{
                      scale: 0.97,
                      transition: { duration: 0.7, type: "spring" },
                    }}
                    onClick={() => handleAnalyzeImage(result)}
                    className="flex flex-row gap-1 rounded-lg ring-1 ring-white px-3 py-2"
                  >
                    <GitCompareArrows className="text-white" />
                    <p className="text-white text-md font-inter font-medium">
                      Compare
                    </p>
                  </motion.button>
                )}
              </div>
              <div className="flex flex-row justify-between gap-6">
                <p className="text-white text-lg font-inter font-normal">
                  {result.user.part +
                    " по следующему VIN номеру " +
                    result.user.vin}
                </p>
                {result.user.userImages.length > 0 && (
                  <img
                    src={result.user.userImages[0]}
                    alt="input image"
                    className="w-30 h-30 rounded-lg object-cover relative bottom-14"
                  />
                )}
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
