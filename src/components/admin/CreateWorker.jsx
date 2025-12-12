"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function AddDeliveryWorker() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [id, setId] = useState(null);

  const generateId = (e) => {
    e.preventDefault();
    const last4 = phone.replace(/\D/g, "").slice(-4);
    const rand = Math.floor(1000 + Math.random() * 9000);
    setId(`DW-${name.substring(0, 3).toUpperCase()}${last4}${rand}`);
  };

  const handleCreateWorker = async () => {
    try {
      const response = await fetch("api/worker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          phone: phone,
          id: id,
        }),
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, type: "spring" }}
      className="p-6"
    >
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-6 space-y-4 bg-[hsl(220_60%_20%)]">
        <h3 className="text-lg font-semibold text-[hsl(45_100%_95%)]">
          Add Delivery Worker
        </h3>

        <form onSubmit={generateId} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[hsl(45_100%_95%)] mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border text-[hsl(45_100%_95%)] border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Mike Johnson"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(45_100%_95%)] mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 text-[hsl(45_100%_95%)] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="+1 555 123 4567"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Generate Worker ID
          </button>
        </form>

        {id && (
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-600">Generated ID: </span>
              <span className="font-semibold text-gray-900">{id}</span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(id)}
              className="ml-4 px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
            >
              Copy
            </button>
          </div>
        )}
        <button
          onClick={handleCreateWorker}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Create Worker Account
        </button>
      </div>
    </motion.section>
  );
}
