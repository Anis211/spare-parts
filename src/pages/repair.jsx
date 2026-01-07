import {
  Bot,
  Calendar,
  DollarSign,
  Package,
  PanelLeft,
  LogOut,
  StickyNote,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AIAssistant from "@/components/repair/AIAssistant";
import CalendarWorkload from "@/components/repair/CalendarWorkload";
import Earnings from "@/components/repair/Earnings";
import { useState } from "react";
import { useRouter } from "next/router";
import useUser from "@/zustand/user";

const titles = [
  { title: "AI Assistant", icon: Bot },
  { title: "Calendar Workload", icon: Calendar },
  { title: "Earnings", icon: DollarSign },
  { title: "Main Page", icon: StickyNote },
  { title: "Log Out", icon: LogOut },
];

export default function Index() {
  const router = useRouter();
  const setUser = useUser((state) => state.setUser);
  const [activeTab, setActiveTab] = useState("AI");
  const [isRolled, setIsRolled] = useState(false);

  return (
    <div className="flex flex-row">
      {!isRolled ? (
        <motion.div
          initial={{ width: ["60%", "0%"] }}
          animate={{ width: ["0%", "60%"] }}
          exit={{ width: ["60%", "0%"] }}
          transition={{ duration: 0.6, type: "spring", times: [0, 1] }}
          className="fixed h-[100vh] bg-[hsl(222_47%_6%)] border-r-2 border-r-[hsl(222_30%_15%)] z-50"
        >
          <div className="flex flex-row justify-between p-4 border-b-2 border-b-[hsl(222_30%_15%)]">
            <div className="flex flex-row gap-2">
              <Package className="h-7 w-7 text-[hsl(45_100%_51%)] my-auto" />
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-[hsl(45_100%_51%)]">
                  Carmax
                </h2>
                <p className="text-sm text-[hsl(220_20%_70%)]">Worker Panel</p>
              </div>
            </div>
            <button className="text-[hsl(0_84%_60%)] hover:text-[hsl(0_84%_60%)] hover:bg-[hsl(0_84%_60%_/_0.1)]">
              <X onClick={() => setIsRolled(true)} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-inter font-medium text-md text-[hsl(45_100%_95%)]/70 pt-3 px-5">
              Navigation
            </p>
            {titles.map((item, index) => (
              <>
                <motion.div
                  initial={{ backgroundColor: "transparent" }}
                  whileHover={{
                    backgroundColor: "hsl(222 30% 12%)",
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
                      : activeTab == item.title.split(" ")[0] &&
                        item.title != "Shop Sales"
                      ? "text-[hsl(45_100%_51%)]"
                      : "text-[hsl(45_100%_95%)]"
                  }`}
                  onClick={() => {
                    if (item.title == "Main Page") {
                      router.push("/");
                      return;
                    }

                    if (item.title == "Log Out") {
                      setUser({ id: "incognito" });
                      router.push("/");
                      return;
                    }

                    setActiveTab(item.title.split(" ")[0]);
                  }}
                >
                  <item.icon className="w-5 h-5 my-auto" />
                  <h2 className="font-inter">{item.title}</h2>
                </motion.div>
              </>
            ))}
          </div>
        </motion.div>
      ) : null}
      <div className="relative flex flex-col w-[100%]">
        <header className="h-16 border-b-2 border-white/10 bg-[hsl(222_47%_6%)] text-[hsl(45_100%_95%)] flex items-center px-6">
          <PanelLeft
            onClick={() => setIsRolled(!isRolled)}
            className="w-9 h-9 hover:text-black hover:bg-[hsl(45_100%_51%)] transition-colors duration-400 ease-in-out rounded-lg p-2"
          />
          <h1 className="ml-4 text-xl font-bold">
            {activeTab != "Details"
              ? titles.filter(
                  (item) => item.title.split(" ")[0] == activeTab
                )[0].title
              : "Order Details"}
          </h1>
        </header>
        <AnimatePresence>
          {activeTab == "Calendar" && <CalendarWorkload />}
          {activeTab == "Earnings" && <Earnings />}
          {activeTab == "AI" && <AIAssistant />}
        </AnimatePresence>
      </div>
    </div>
  );
}
