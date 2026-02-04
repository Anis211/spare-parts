"use client";
import { createContext, useContext, useState, useEffect } from "react";

const CRMContext = createContext(undefined);

export const CRMProvider = ({ children }) => {
  const [records, setRecords] = useState([]);
  const [messages, setMessages] = useState({});
  const [repairWorks, setRepairWorks] = useState({});
  const [aiTips, setAiTips] = useState({});

  useEffect(() => {
    const find = async () => {
      const newRecords = [];
      const newRepairWorks = {};
      const newAiTips = {};
      const chatHistories = {};

      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limitl: 0, limitr: 10 }),
      });
      const data = await response.json();

      for (const record of data.users) {
        newRecords.push({
          id: record.chatId.id,
          phone: record.phone,
          name: record.name,
          totalSpent: record.totalSpent,
          createdAt: record.createdAt?.split("T")[0],
          vin: record.car.vin || "",
          make: record.car.make || "",
          model: record.car.model || "",
          year: record.car.year || null,
          vehicleNotes: record.lastNote,
          lastVisit: record.lastVisit?.split("T")[0],
          nextAppointment: record.nextAppointment,
        });

        if (record.aiTips.length > 0) {
          newAiTips[record.chatId.id] = record.aiTips.map((tip) => ({
            id: tip.id,
            type: tip.type,
            title: tip.title,
            description: tip.description,
            priority: tip.priority,
            createdAt: tip.date?.split("T")[0],
          }));
        }

        newRepairWorks[record.chatId.id] = record.repairWorks.map((work) => {
          let items = [];

          for (const item of work.repairItems) {
            items = [...items, ...item.items];
          }

          return {
            id: work.id,
            description: work.description,
            status: work.status,
            cost: 442.5,
            arrivalDate: work.arrivalDate?.split("T")[0],
            completionDate: work.completedDate?.split("T")[0],
            assignedWorker: work.assignedWorker.name,
            repairItems: items,
          };
        });

        const res = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: record.chatId.id }),
        });
        const history = await res.json();
        console.log("History: ", history);

        chatHistories[record.chatId.id] =
          history.chat?.map((message) => ({
            content: message.text,
            sender: message.metadata?.role === "user" ? "customer" : "shop",
            timestamp: message.metadata?.createdAt.split("T")[0],
          })) || [];
      }

      setAiTips(newAiTips);
      setRepairWorks(newRepairWorks);
      setMessages(chatHistories);
      setRecords(newRecords);
    };

    records.length == 0 && find();
  }, [records]);

  const addRecord = (record) => {
    const newRecord = {
      ...record,
      id: `crm-${Date.now()}`,
      totalSpent: 0,
      createdAt: new Date().toISOString().split("T")[0],
      lastVisit: new Date().toISOString().split("T")[0],
    };
    setRecords((prev) => [newRecord, ...prev]);
  };

  const addMessage = (message) => {
    const newMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const value = {
    records,
    messages,
    repairWorks,
    aiTips,
    setAiTips,
    addRecord,
    addMessage,
  };

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error("useCRM must be used within CRMProvider");
  }
  return context;
};
