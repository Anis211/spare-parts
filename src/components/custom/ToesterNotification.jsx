// components/ToastNotification.js
import React from "react";
import { motion } from "motion/react";

const ToastNotification = ({ text }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 60 }}
      transition={{ duration: 0.6, type: "spring" }}
      className="fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up"
      style={{
        animation: "fadeInUp 0.3s ease-out",
      }}
    >
      <div className="flex items-center">
        <i className="fas fa-check-circle mr-2"></i>
        <span>{text}</span>
      </div>
    </motion.div>
  );
};

export default ToastNotification;
