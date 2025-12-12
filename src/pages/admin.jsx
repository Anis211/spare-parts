import Dashboard from "@/components/admin/Dashboard";
import Orders from "@/components/admin/Orders";
import Workers from "@/components/admin/Workers";
import Setting from "@/components/admin/Settings";
import AddDeliveryWorker from "@/components/admin/CreateWorker";
import SearchTab from "@/components/admin/SearchTab";
import Category from "@/components/admin/Category";
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  PanelLeft,
  LogOut,
  StickyNote,
  Pickaxe,
  SquareMenu,
  Car,
  TextSearch,
  FileSearch,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import useUser from "@/zustand/user";

const titles = [
  { title: "Dashboard", icon: LayoutDashboard },
  { title: "Orders", icon: Package },
  { title: "Delivery Workers", icon: Users },
  { title: "Search Panel", icon: SquareMenu },
  { title: "Add Worker", icon: Pickaxe },
  { title: "Settings", icon: Settings },
  { title: "Main Page", icon: StickyNote },
  { title: "Log Out", icon: LogOut },
];

export default function Index() {
  const router = useRouter();
  const setUser = useUser((state) => state.setUser);

  const vin = useUser((state) => state.vin);
  const setVin = useUser((state) => state.setVin);
  const clearVin = useUser((state) => state.clearVin);
  const [remove, setRemove] = useState(false);

  const [isRolled, setIsRolled] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [searchChosen, setSearchChosen] = useState(1);

  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const fetchRecentSearches = async () => {
      try {
        const res = await fetch("/api/admin/save?limit=3&vin=none", {
          method: "GET",
        });
        const data = await res.json();
        console.log(
          "Recent Searches Data:",
          data.vinData.map((item) => ({
            vin: item.records[0].user.vin,
            title: item.records[0].user.part,
          }))
        );

        setRecentSearches(
          data.vinData.map((item) => ({
            vin: item.vin,
            title: item.records[0].user.part,
          }))
        );
      } catch (error) {
        console.error("Error fetching recent searches:", error);
      }
    };

    recentSearches.length === 0 ? fetchRecentSearches() : null;
    recentSearches.length === 0 && vin != ""
      ? handleRecentSearchClick(vin)
      : null;
  }, [recentSearches, vin]);

  const handleRecentSearchClick = async (vin) => {
    const save = await fetch(`/api/admin/save?vin=${vin}&limit=4`, {
      method: "GET",
    });
    const data = await save.json();

    setVin(vin);
    setResults(data.vinData.records);
    console.log("Recent Search Clicked:", data);
  };

  return (
    <div className="flex flex-row">
      <motion.div
        initial={isRolled ? { width: "18%" } : { width: "4%" }}
        animate={isRolled ? { width: "4%" } : { width: "18%" }}
        transition={{ duration: 0.4, type: "tween" }}
        className="h-[100vh] bg-[hsl(220_75%_12%)] fixed border-r-2 border-r-[hsl(220_60%_20%)]"
      >
        <div className="flex flex-row gap-2 p-4 border-b-2 border-b-[hsl(220_50%_18%)]">
          <Package className="h-7 w-7 text-[hsl(45_100%_51%)] my-auto" />
          {!isRolled && (
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-[hsl(45_100%_51%)]">
                Carmax
              </h2>
              <p className="text-sm text-[hsl(220_20%_70%)]">Admin Panel</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {!isRolled && (
            <p className="font-inter font-medium text-sm text-[hsl(45_100%_95%)]/70 pt-3 px-5">
              Navigation
            </p>
          )}
          {titles.map((item, index) => (
            <>
              <motion.div
                initial={{ backgroundColor: "hsl(220 75% 12%)" }}
                whileHover={{
                  backgroundColor: "hsl(220 60% 20%)",
                  transition: {
                    duration: 0.6,
                    type: "spring",
                  },
                }}
                key={index}
                className={`flex flex-row gap-2 ${
                  item.title == "Dashboard" && "mt-2"
                } font-regular text-md rounded-lg mx-2 px-3 py-2 ${
                  item.title == "Log Out"
                    ? "text-[hsl(0_100%_75%)]"
                    : activeTab == item.title.split(" ")[0]
                    ? "text-[hsl(45_100%_51%)]"
                    : "text-[hsl(45_100%_95%)]"
                }`}
                onClick={
                  item.title == "Main Page"
                    ? () => router.push("/")
                    : item.title == "Log Out"
                    ? () => {
                        setUser({ id: "incognito" });
                        router.push("/");
                      }
                    : () => setActiveTab(item.title.split(" ")[0])
                }
              >
                <item.icon className="w-5 h-5 my-auto" />
                {!isRolled && <h2 className="font-inter">{item.title}</h2>}
              </motion.div>
              {item.title === "Search Panel" && !isRolled && searchChosen == 1
                ? activeTab == item.title.split(" ")[0] && (
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, type: "spring" }}
                      className="ml-6 mt-2 space-y-1 border-l-2 border-[hsl(222_30%_22%)]/60 pl-3"
                    >
                      {recentSearches.map((item, index) => (
                        <div
                          key={index}
                          onClick={() => handleRecentSearchClick(item.vin)}
                          className="flex items-center gap-2 py-1.5 px-2 rounded text-xs text-[hsl(215_20%_65%)] hover:bg-[hsl(222_47%_18%)]/30 cursor-pointer transition-colors"
                        >
                          <Car className="w-3 h-3 text-[hsl(43_96%_56%)]/70" />
                          <span className="font-mono text-[hsl(43_96%_56%)]/80">
                            {item.vin.slice(0, 6)}...
                          </span>
                          <span className="truncate">{item.title}</span>
                        </div>
                      ))}
                    </motion.div>
                  )
                : ""}
            </>
          ))}
        </div>
      </motion.div>
      <motion.div
        initial={
          isRolled
            ? { width: "82%", left: "18%" }
            : { width: "96%", left: "4%" }
        }
        animate={
          isRolled
            ? { width: "96%", left: "4%" }
            : { width: "82%", left: "18%" }
        }
        transition={{ duration: 0.6, type: "spring" }}
        className="relative flex flex-col"
      >
        <header className="h-16 border-b-2 border-[hsl(220_50%_25%)] bg-[hsl(220_60%_20%)] text-[hsl(45_100%_95%)] flex items-center px-6">
          <PanelLeft
            onClick={() => setIsRolled(!isRolled)}
            className="w-9 h-9 hover:text-black hover:bg-[hsl(45_100%_51%)] transition-colors duration-400 ease-in-out rounded-lg p-2"
          />
          <h1 className="ml-4 text-xl font-bold">
            {
              titles.filter((item) => item.title.split(" ")[0] == activeTab)[0]
                .title
            }
          </h1>
          {activeTab == "Search" && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, type: "spring" }}
              className="flex flex-row ml-7 gap-2"
            >
              <FileSearch
                onClick={() => setSearchChosen(1)}
                className={`w-10 h-10 hover:text-black hover:bg-[hsl(45_100%_51%)] transition-colors duration-400 ease-in-out p-2 rounded-lg ${
                  searchChosen == 1
                    ? "border-b-2 border-b-[hsl(45_100%_51%)] rounded-b-none"
                    : "border-b-2 border-b-transparent"
                }`}
              />
              <TextSearch
                onClick={() => setSearchChosen(2)}
                className={`w-10 h-10 hover:text-black hover:bg-[hsl(45_100%_51%)] transition-colors duration-400 ease-in-out p-2 rounded-lg ${
                  searchChosen == 2
                    ? "border-b-2 border-b-[hsl(45_100%_51%)] rounded-b-none"
                    : "border-b-2 border-b-transparent"
                }`}
              />
            </motion.div>
          )}
          {activeTab == "Search" && vin.length > 0 && (
            <div className="justify-self-end ml-auto flex flex-row gap-2">
              {remove && (
                <motion.button
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                  layout
                  transition={{ duration: 0.3, type: "spring" }}
                  onClick={() => {
                    setVin("");
                    setResults([]);
                  }}
                >
                  <X className="bg-[hsl(0_84%_60%)] text-white p-2 w-8 h-8 rounded-md" />
                </motion.button>
              )}
              <motion.p
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.7, type: "spring" }}
                layout
                onClick={() => {
                  setRemove(!remove);
                }}
                className="font-inter text-white text-md bg-[hsl(220_50%_25%)]/50 px-3 py-1 rounded-lg cursor-default select-none"
              >
                {vin}
              </motion.p>
            </div>
          )}
        </header>
        {activeTab == "Dashboard" && <Dashboard />}
        {activeTab == "Orders" && <Orders />}
        {activeTab == "Delivery" && <Workers />}
        {activeTab == "Settings" && <Setting />}
        {activeTab == "Add" && <AddDeliveryWorker />}
        {activeTab == "Search" && searchChosen == 1 ? (
          <SearchTab results={results} setResults={setResults} />
        ) : activeTab == "Search" && searchChosen == 2 ? (
          <Category />
        ) : (
          ""
        )}
      </motion.div>
    </div>
  );
}
