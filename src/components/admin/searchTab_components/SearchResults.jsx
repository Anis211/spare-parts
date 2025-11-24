import {
  Search,
  ListCheck,
  PanelBottomClose,
  PanelBottomOpen,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Carousel from "./ImageCarousel";
import WaveMenu from "./Loader";

export default function SearchResults({
  results,
  wraped,
  setWraped,
  isLoading,
}) {
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
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.8, type: "spring", delay: 0.8 }}
            className="flex flex-col gap-3 border-[hsl(220_50%_25%)] bg-[hsl(220_60%_20%)] rounded-lg px-7 py-6"
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

            <div className="border-b-1 border-b-white w-full mx-auto my-6" />

            <AnimatePresence>
              {!wraped[index] && (
                <motion.div
                  initial={{ opacity: 0, height: "0%" }}
                  animate={{ opacity: 1, height: "100%" }}
                  exit={{ opacity: 0, height: "0%" }}
                  transition={{ duration: 0.4, type: "spring" }}
                  className="flex flex-col gap-3"
                >
                  <div className="flex flex-row gap-2 items-center">
                    <ListCheck className="text-[hsl(45_100%_51%)]" />
                    <h2 className="text-white text-2xl font-inter font-bold">
                      Analog Results
                    </h2>
                  </div>
                  {result.items.analogs.map((analog, index) => (
                    <div
                      key={index}
                      className="flex flex-row flex-wrap gap-[2%] bg-[hsl(220_75%_12%)] px-5 py-4 rounded-lg"
                    >
                      <div className="flex flex-col w-[28%] gap-3">
                        <h2 className="text-[hsl(45_100%_51%)] text-center border-[hsl(220_50%_25%)] bg-[hsl(220_60%_20%)] rounded-lg px-3 py-2 text-xl font-inter font-medium">
                          Part Data
                        </h2>
                        <div className="border-[hsl(220_50%_25%)] bg-[hsl(220_60%_20%)] rounded-lg px-3 py-6">
                          {[
                            `🏷 ${analog.brand}`,
                            `📦 ${analog.name}`,
                            `🔖 ${analog.article}`,
                          ].map((text, index) => (
                            <p
                              key={index}
                              className="text-white text-md font-normal font-inter ml-3"
                            >
                              {text}
                            </p>
                          ))}
                        </div>
                        <motion.a
                          initial={{ opacity: 0.9 }}
                          whileHover={{ scale: 1.02, opacity: 1 }}
                          href={"/admin"}
                          className="bg-[hsl(45_100%_51%)] text-[hsl(220_70%_15%)] text-md text-center font-inter font-medium px-3 py-2 rounded-lg cursor-pointer "
                        >
                          Go to the Source
                        </motion.a>
                      </div>

                      <div className="flex flex-col gap-3 w-[30%]">
                        <h2 className="text-[hsl(45_100%_51%)] text-center border-[hsl(220_50%_25%)] bg-[hsl(220_60%_20%)] rounded-lg px-3 py-2 text-xl font-inter font-medium">
                          {`Stocks Data ( ${
                            analog.sources[0].charAt(0).toUpperCase() +
                            analog.sources[0].slice(1)
                          } )`}
                        </h2>
                        <div className="border-[hsl(220_50%_25%)] bg-[hsl(220_60%_20%)] rounded-lg px-3 py-6">
                          {analog.stocks.map((stock, index) => (
                            <div key={index} className="flex flex-col gap-1">
                              {[
                                `📍Адрес: ${stock.place}`,
                                `🏷 Цена: ${stock.partPrice} ₸`,
                                `🚚 Доставка: ${stock.delivery.start}`,
                              ].map((text, index) => (
                                <p
                                  key={index}
                                  className="text-white text-md font-normal font-inter ml-3"
                                >
                                  {text}
                                </p>
                              ))}
                              {index + 1 != analog.stocks.length && (
                                <div className="border-b-1 border-b-white my-4" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 w-[38%]">
                        <h2 className="text-[hsl(45_100%_51%)] text-center border-[hsl(220_50%_25%)] bg-[hsl(220_60%_20%)] rounded-lg px-3 py-2 text-xl font-inter font-medium">
                          Images
                        </h2>
                        {analog.pictures.length > 0 ? (
                          <Carousel
                            items={analog.pictures}
                            baseWidth={450}
                            autoplay={true}
                            autoplayDelay={3000}
                            pauseOnHover={true}
                            loop={true}
                            round={false}
                          />
                        ) : (
                          <p className="text-white text-md text-center border-[hsl(220_50%_25%)] bg-[hsl(220_60%_20%)] rounded-lg px-3 py-2">
                            No Images Availabe
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
