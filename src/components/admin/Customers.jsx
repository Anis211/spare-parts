"use client";
import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Users,
  Sparkles,
  MessageCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/admin/ui/customers/button";
import { Input } from "@/components/admin/ui/customers/input";
import { CRMCard } from "@/components/admin/customers_components/CRMCard";
import { AITipsPanel } from "@/components/admin/customers_components/AITipsPanel";
import { MessageHistory } from "@/components/admin/customers_components/MessageHistory";
import { StatusBadge } from "@/components/admin/ui/customers/statusBadge";
import { useCRM } from "@/hooks/CRMContext";
import useUser from "@/zustand/user";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

export const Customers = ({ setActiveTab }) => {
  const setVin = useUser((state) => state.setVin);
  const { records, messages, repairWorks, aiTips } = useCRM();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showAITips, setShowAITips] = useState(true);

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return records;
    const query = searchQuery.toLowerCase();
    return records.filter(
      (record) =>
        record.name.toLowerCase().includes(query) ||
        record.phone.includes(query) ||
        record.vin.toLowerCase().includes(query) ||
        record.make.toLowerCase().includes(query) ||
        record.model.toLowerCase().includes(query)
    );
  }, [searchQuery, records]);

  const getUnreadMessages = (recordId) =>
    messages.filter(
      (m) => m.crmRecordId === recordId && !m.read && m.sender === "customer"
    ).length;

  const getAITipsCount = (recordId) =>
    aiTips.filter((t) => t.crmRecordId === recordId).length;

  const getActiveOrders = (recordId) =>
    repairWorks.filter(
      (r) => r.crmRecordId === recordId && r.status !== "completed"
    ).length;

  const selectedMessages = selectedRecord
    ? messages.filter((m) => m.crmRecordId === selectedRecord.id)
    : [];

  const selectedTips = selectedRecord
    ? aiTips.filter((t) => t.crmRecordId === selectedRecord.id)
    : [];

  const selectedRepairs = selectedRecord
    ? repairWorks.filter((r) => r.crmRecordId === selectedRecord.id)
    : [];

  // Summary stats
  const totalUnread = messages.filter(
    (m) => !m.read && m.sender === "customer"
  ).length;
  const totalTips = aiTips.length;
  const highPriorityTips = aiTips.filter((t) => t.priority === "high").length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="gold"
          onClick={() => setActiveTab("Add")}
          className="bg-[hsl(43_96%_56%)] hover:bg-[hsl(43_96%_50%)] text-[hsl(222_47%_6%)]"
        >
          <Plus className="w-4 h-4" />
          Add Record
        </Button>
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring" }}
        className="grid grid-cols-4 gap-4 mb-6"
      >
        <div className="bg-[hsl(222_40%_9%)]/80 backdrop-blur-xl border border-[hsl(222_30%_18%)]/50 shadow-lg rounded-xl p-4 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: "hsl(222 30% 14%)",
              color: "hsl(40 20% 95%)",
            }}
          >
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[hsl(40_20%_95%)]">
              {records.length}
            </p>
            <p className="text-sm text-[hsl(220_15%_55%)]">Total Customers</p>
          </div>
        </div>

        <div className="bg-[hsl(222_40%_9%)]/80 backdrop-blur-xl border border-[hsl(222_30%_18%)]/50 shadow-lg rounded-xl p-4 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: "hsl(43 96% 56% / 0.2)",
              color: "hsl(43_96%_56%)",
            }}
          >
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[hsl(43_96%_56%)]">
              {totalUnread}
            </p>
            <p className="text-sm text-[hsl(220_15%_55%)]">Unread Messages</p>
          </div>
        </div>

        <div className="bg-[hsl(222_40%_9%)]/80 backdrop-blur-xl border border-[hsl(222_30%_18%)]/50 shadow-lg rounded-xl p-4 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: "hsl(38 92% 50% / 0.2)",
              color: "hsl(38 92% 50%)",
            }}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[hsl(38_92%_50%)]">
              {totalTips}
            </p>
            <p className="text-sm text-[hsl(220_15%_55%)]">AI Tips Available</p>
          </div>
        </div>

        <div className="bg-[hsl(222_40%_9%)]/80 backdrop-blur-xl border border-[hsl(222_30%_18%)]/50 shadow-lg rounded-xl p-4 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: "hsl(0 72% 51% / 0.2)",
              color: "hsl(0 72% 51%)",
            }}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[hsl(0_72%_51%)]">
              {highPriorityTips}
            </p>
            <p className="text-sm text-[hsl(220_15%_55%)]">High Priority</p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(220_15%_55%)]" />
          <Input
            placeholder="Search by name, phone, VIN, or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[hsl(222_47%_6%)] border-[hsl(222_30%_18%)] text-[hsl(40_20%_95%)] placeholder:text-[hsl(220_15%_55%)]"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="border-[hsl(222_30%_18%)] text-[hsl(40_20%_95%)]"
        >
          <Filter className="w-5 h-5" />
        </Button>
        <Button
          variant={showAITips ? "default" : "outline"}
          onClick={() => setShowAITips(!showAITips)}
          className={cn(
            showAITips
              ? "bg-[hsl(43_96%_56%)] hover:bg-[hsl(43_96%_50%)] text-[hsl(222_47%_6%)] gold-glow"
              : "bg-transparent border-[hsl(222_30%_18%)] text-[hsl(40_20%_95%)] hover:bg-[hsl(222_30%_14%)]"
          )}
        >
          <Sparkles className="w-4 h-4" />
          AI Tips
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* CRM Records List */}
        <div className="col-span-2 space-y-4">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-4"
          >
            {filteredRecords.map((record, index) => (
              <motion.div
                variants={item}
                key={record.id}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CRMCard
                  record={record}
                  unreadMessages={getUnreadMessages(record.id)}
                  aiTipsCount={getAITipsCount(record.id)}
                  activeOrders={getActiveOrders(record.id)}
                  onClick={() => {
                    setSelectedRecord(record);
                    setVin(record.vin);
                  }}
                />
              </motion.div>
            ))}
          </motion.div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[hsl(220_15%_55%)]">
                No records found matching your search.
              </p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="space-y-6">
          <AnimatePresence>
            {selectedRecord ? (
              <>
                {/* Selected Record Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, type: "spring" }}
                  className="bg-[hsl(222_40%_9%)]/80 backdrop-blur-xl border border-[hsl(222_30%_18%)]/50 shadow-lg rounded-xl p-5 animate-fade-in"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, hsl(43 96% 56%), hsl(38 92% 50%))",
                      }}
                    >
                      <span className="text-xl font-bold text-[hsl(222_47%_6%)]">
                        {selectedRecord.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[hsl(40_20%_95%)]">
                        {selectedRecord.name}
                      </h2>
                      <p className="text-sm text-[hsl(220_15%_55%)]">
                        {selectedRecord.phone}
                      </p>
                    </div>
                  </div>

                  <div
                    className="p-3 rounded-lg mb-4"
                    style={{ backgroundColor: "hsl(222 30% 14%)" }}
                  >
                    <p className="text-sm font-medium text-[hsl(40_20%_95%)]">
                      {selectedRecord.year} {selectedRecord.make}{" "}
                      {selectedRecord.model}
                    </p>
                    <p className="font-mono text-xs text-[hsl(43_96%_56%)]">
                      {selectedRecord.vin}
                    </p>
                  </div>

                  {selectedRecord.vehicleNotes && (
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: "hsl(38 92% 50% / 0.1)",
                        border: "1px solid hsl(38 92% 50% / 0.3)",
                        color: "hsl(40 20% 95%)",
                      }}
                    >
                      <p className="text-xs text-[hsl(220_15%_55%)] mb-1">
                        Worker Notes
                      </p>
                      <p className="text-sm">{selectedRecord.vehicleNotes}</p>
                    </div>
                  )}
                </motion.div>

                {/* Repair History */}
                {selectedRepairs.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    className="bg-[hsl(222_40%_9%)]/80 backdrop-blur-xl border border-[hsl(222_30%_18%)]/50 shadow-lg rounded-xl p-5 animate-fade-in"
                  >
                    <h3 className="font-semibold text-[hsl(40_20%_95%)] mb-3">
                      Repair Orders
                    </h3>
                    <div className="space-y-2">
                      {selectedRepairs.map((repair) => (
                        <div
                          key={repair.id}
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: "hsl(222 30% 14%)" }}
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="text-sm font-medium text-[hsl(40_20%_95%)]">
                                {repair.description}
                              </p>
                              <p className="text-xs text-[hsl(220_15%_55%)]">
                                {repair.arrivalDate}
                              </p>
                            </div>
                            <div className="text-right">
                              <StatusBadge status={repair.status} />
                              <p className="text-sm font-medium text-[hsl(43_96%_56%)] mt-1">
                                ${repair.cost}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* AI Tips for Selected Record */}
                {showAITips && selectedTips.length > 0 && (
                  <AITipsPanel tips={selectedTips} />
                )}

                {/* Messages */}
                <MessageHistory messages={selectedMessages} />
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="bg-[hsl(222_40%_9%)]/80 backdrop-blur-xl border border-[hsl(222_30%_18%)]/50 shadow-lg rounded-xl p-8 text-center"
              >
                <Users className="w-12 h-12 text-[hsl(220_15%_55%)] mx-auto mb-4" />
                <p className="text-[hsl(220_15%_55%)]">
                  Select a customer to view details
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Customers;
