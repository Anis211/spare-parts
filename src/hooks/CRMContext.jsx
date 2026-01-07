"use client";
import { createContext, useContext, useState } from "react";
import {
  mockCRMRecords,
  mockMessages,
  mockRepairWorks,
  mockAITips,
} from "@/data/mockData";

const CRMContext = createContext(undefined);

export const CRMProvider = ({ children }) => {
  const [records, setRecords] = useState(mockCRMRecords);
  const [messages, setMessages] = useState(mockMessages);
  const [repairWorks] = useState(mockRepairWorks);
  const [aiTips] = useState(mockAITips);

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
