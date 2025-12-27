import { useState } from "react";
import { Input } from "../ui/search_input";
import { Button } from "../ui/history/button";
import {
  ChevronDown,
  Phone,
  Search,
  Trash2,
  Link,
  Calendar,
  TabletSmartphone,
  PencilLine,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import useUser from "@/zustand/user";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

function safeParseDate(dateOrStr) {
  if (!dateOrStr) return new Date(NaN);

  if (dateOrStr instanceof Date) {
    return isNaN(dateOrStr) ? new Date(NaN) : dateOrStr;
  }

  const str = String(dateOrStr).trim();
  const normalized = str.replace(/\+00:00$/, "Z");

  const date = new Date(normalized);
  return isNaN(date) ? new Date(NaN) : date;
}

function groupRequestsByDate(requests) {
  const groups = new Map();

  requests.forEach((request) => {
    const date = safeParseDate(request.createdAt);

    if (isNaN(date)) {
      console.warn("Skipping invalid date:", request.createdAt, request);
      return;
    }
    const dateKey = format(date, "yyyy-MM-dd");

    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey).push(request);
  });
  return groups;
}

function getDateLabel(dateKey) {
  const date = new Date(dateKey);
  if (isToday(date)) return "Сегодня";
  if (isYesterday(date)) return "Вчера";
  return format(date, "d MMMM yyyy", { locale: ru });
}

export function VinCard({
  vinHistory,
  vin,
  index,
  setActiveTab,
  setResults,
  results,
}) {
  const groupedRequests = groupRequestsByDate(vinHistory.requests);
  const setVin = useUser((state) => state.setVin);
  const [isExpanded, setIsExpanded] = useState(index === 0);

  const [phone, setPhone] = useState(vinHistory.phone);
  const [phoneBar, setPhoneBar] = useState("");
  const [changePhone, setChangePhone] = useState(false);

  const handlePhoneChange = async () => {
    setPhone(phoneBar);
    setChangePhone(false);

    try {
      const response = await fetch("api/admin/change_phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vin: vinHistory.vin,
          phone: phoneBar,
        }),
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error Changing Phone Number:", error);
    }
    setPhoneBar("");
  };

  const handleDeleteResult = async (requests, request) => {
    try {
      const response = await fetch("api/admin/save", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          result: results.find(
            (result) =>
              result.user.part == request.partName && result.user.vin == vin
          ),
          phone: requests.indexOf(request),
        }),
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error Changing Phone Number:", error);
    }
  };

  const linkResults = async (request) => {
    if (!request) {
      console.log("Wrong Request Param!");
      return;
    }

    try {
      const vin = request.query.split("номеру")[1].trim();

      const res = await fetch(`/api/admin/save?vin=${vin}&limit=10`, {
        method: "GET",
      });
      const results = await res.json();

      setResults(results.vinData.records);
      setVin(vin);
      setActiveTab("Search");
      console.log(results.vinData.records);
    } catch (err) {
      console.error("Error While Link to Result");
      return;
    }
  };

  return (
    <div
      className="animate-fade-in rounded-xl overflow-hidden bg-[hsl(222_47%_9%)] border-[hsl(220_50%_25%)]"
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 transition-colors"
        style={{
          backgroundColor: "transparent",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "hsl(213 35% 18% / 0.3)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{
              backgroundColor: "hsl(38 92% 55% / 0.1)",
            }}
          >
            <Search className="h-5 w-5" style={{ color: "hsl(38 92% 55%)" }} />
          </div>
          <div className="text-left">
            <h3
              className="font-mono text-sm font-semibold"
              style={{ color: "hsl(210 40% 98%)" }}
            >
              {vinHistory.vin}
            </h3>
            {phone.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <Phone
                  className="h-3.5 w-3.5"
                  style={{ color: "hsl(215 20% 65%)" }}
                />
                <span className="text-xs" style={{ color: "hsl(215 20% 65%)" }}>
                  {phone}
                </span>
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setChangePhone(!changePhone)}
          >
            {phone.length > 0 ? (
              <PencilLine className="w-6 h-6 text-white" />
            ) : (
              <TabletSmartphone className="w-6 h-6 text-white" />
            )}
          </motion.button>

          <AnimatePresence>
            {changePhone && (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.7, type: "spring" }}
                className="w-[25vw] relative flex gap-2"
              >
                <div className="relative flex-1">
                  <Input
                    placeholder="Write client's phone number..."
                    value={phoneBar}
                    onChange={(e) => setPhoneBar(e.target.value)}
                    className="border-1 border-[hsl(222_30%_18%)] focus:border-[hsl(38_92%_55%)] bg-[hsl(222_47%_9%)] focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-white uppercase font-mono tracking-wider placeholder:text-white"
                  />
                </div>
                <Button
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  style={{
                    backgroundColor: "hsl(38 92% 55%)",
                    color: "hsl(213 50% 10%)",
                    borderColor: "hsl(38 92% 55%)",
                  }}
                  onClick={() => handlePhoneChange()}
                >
                  <PencilLine className="h-7 w-7" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs"
            style={{ color: "hsl(215 20% 65%)" }} // --muted-foreground
          >
            {vinHistory.requests.length} запрос
            {vinHistory.requests.length === 1
              ? ""
              : vinHistory.requests.length < 5
              ? "а"
              : "ов"}
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
            style={{
              color: "hsl(215 20% 65%)", // --muted-foreground
            }}
          />
        </div>
      </button>

      {/* Content */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div
            className="p-4 space-y-4"
            style={{
              borderTop: "1px solid hsl(213 30% 22%)", // --border
            }}
          >
            {Array.from(groupedRequests.entries()).map(
              ([dateKey, requests]) => (
                <div key={dateKey} className="space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar
                      className="h-3.5 w-3.5"
                      style={{ color: "hsl(215 20% 65%)" }}
                    />
                    <span style={{ color: "hsl(215 20% 65%)" }}>
                      {getDateLabel(dateKey)}
                    </span>
                  </div>
                  <div className="space-y-2 pl-5">
                    {requests.map((request) => (
                      <div
                        key={request.id}
                        className="group flex items-start justify-between gap-4 rounded-lg p-3 transition-colors bg-[hsl(220_75%_12%)]/65"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Search
                              className="h-4 w-4 shrink-0"
                              style={{ color: "hsl(38 92% 55%)" }} // --primary
                            />
                            <span
                              className="font-medium text-sm truncate"
                              style={{ color: "hsl(210 40% 98%)" }} // --foreground
                            >
                              {request.partName}
                            </span>
                          </div>
                          <p
                            className="text-xs line-clamp-2"
                            style={{ color: "hsl(215 20% 65%)" }} // --muted-foreground
                          >
                            {request.query}
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "hsl(215 20% 65% / 0.6)" }} // --muted-foreground/60
                          >
                            {format(request.createdAt, "HH:mm")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-1.5 rounded-md transition-colors"
                            style={{
                              backgroundColor: "transparent",
                            }}
                            onClick={() => linkResults(request)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "hsl(213 40% 20%)"; // hover:bg-secondary
                              e.currentTarget.querySelector("svg").style.color =
                                "hsl(210 40% 98%)"; // hover:text-foreground
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                              e.currentTarget.querySelector("svg").style.color =
                                "hsl(215 20% 65%)"; // text-muted-foreground
                            }}
                          >
                            <Link
                              className="h-4 w-4"
                              style={{ color: "hsl(215 20% 65%)" }}
                            />
                          </button>
                          <button
                            className="p-1.5 rounded-md transition-colors"
                            style={{
                              backgroundColor: "transparent",
                            }}
                            onClick={() =>
                              handleDeleteResult(requests, request)
                            }
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "hsl(0 62% 30% / 0.1)";
                              e.currentTarget.querySelector("svg").style.color =
                                "hsl(0 62% 30%)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                              e.currentTarget.querySelector("svg").style.color =
                                "hsl(215 20% 65%)"; // text-muted-foreground
                            }}
                          >
                            <Trash2
                              className="h-4 w-4"
                              style={{ color: "hsl(215 20% 65%)" }}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
