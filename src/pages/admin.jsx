import Dashboard from "@/components/admin/Dashboard";
import Orders from "@/components/admin/Orders";
import Workers from "@/components/admin/Workers";
import Setting from "@/components/admin/Settings";
import AddDeliveryWorker from "@/components/admin/CreateWorker";
import SearchTab from "@/components/admin/SearchTab";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/router";
import useUser from "@/zustand/user";

export default function Index() {
  const router = useRouter();
  const setUser = useUser((state) => state.setUser);

  const [isRolled, setIsRolled] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");

  return (
    <div className="flex flex-row">
      <motion.div
        initial={isRolled ? { width: "18%" } : { width: "4%" }}
        animate={isRolled ? { width: "4%" } : { width: "18%" }}
        transition={{ duration: 0.6, type: "spring" }}
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
          {[
            { title: "Dashboard", icon: LayoutDashboard },
            { title: "Orders", icon: Package },
            { title: "Delivery Workers", icon: Users },
            { title: "Search Panel", icon: SquareMenu },
            { title: "Add Worker", icon: Pickaxe },
            { title: "Settings", icon: Settings },
            { title: "Main Page", icon: StickyNote },
            { title: "Log Out", icon: LogOut },
          ].map((item, index) => (
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
          <h1 className="ml-4 text-xl font-bold">Admin Panel</h1>
        </header>
        {activeTab == "Dashboard" && <Dashboard />}
        {activeTab == "Orders" && <Orders />}
        {activeTab == "Delivery" && <Workers />}
        {activeTab == "Settings" && <Setting />}
        {activeTab == "Add" && <AddDeliveryWorker />}
        {activeTab == "Search" && <SearchTab />}
      </motion.div>
    </div>
  );
}
