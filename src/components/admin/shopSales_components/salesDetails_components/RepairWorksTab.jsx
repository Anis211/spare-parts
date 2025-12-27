"use client";
import { Wrench, Clock, User, AlertCircle, ClipboardList } from "lucide-react";
import { StatusBadge } from "@/components/admin/shopSales_components/salesDetails_components/StatusBadge";
import { motion } from "framer-motion";

const currentRepairs = [
  {
    id: 1,
    name: "Engine Diagnostics",
    master: {
      name: "Alex Rodriguez",
      phone: "+1 (555) 987-6543",
      avatar: "AR",
    },
    status: "in-progress",
    startDate: "Dec 18, 2025",
    estimatedEnd: "Dec 22, 2025",
    notes:
      "Checking engine codes and performance metrics. Found some irregularities in cylinder 3.",
  },
  {
    id: 2,
    name: "Brake System Inspection",
    master: { name: "Mike Johnson", phone: "+1 (555) 123-4567", avatar: "MJ" },
    status: "pending",
    startDate: "Dec 20, 2025",
    estimatedEnd: "Dec 21, 2025",
    notes: "Waiting for brake pads delivery to proceed.",
  },
];

const historyRepairs = [
  {
    id: 3,
    name: "Oil Change",
    master: {
      name: "Carlos Martinez",
      phone: "+1 (555) 456-7890",
      avatar: "CM",
    },
    status: "completed",
    startDate: "Dec 10, 2025",
    completedDate: "Dec 10, 2025",
    cost: 85.0,
  },
  {
    id: 4,
    name: "Tire Rotation",
    master: {
      name: "Alex Rodriguez",
      phone: "+1 (555) 987-6543",
      avatar: "AR",
    },
    status: "completed",
    startDate: "Dec 08, 2025",
    completedDate: "Dec 08, 2025",
    cost: 45.0,
  },
  {
    id: 5,
    name: "Air Filter Replacement",
    master: { name: "Mike Johnson", phone: "+1 (555) 123-4567", avatar: "MJ" },
    status: "completed",
    startDate: "Dec 05, 2025",
    completedDate: "Dec 05, 2025",
    cost: 35.5,
  },
];

const futureRepairNotes = [
  {
    id: 1,
    master: "Alex Rodriguez",
    note: "Recommend transmission fluid change in next 5,000 miles",
    priority: "medium",
    date: "Dec 18, 2025",
  },
  {
    id: 2,
    master: "Mike Johnson",
    note: "Front brake rotors showing wear - consider replacement soon",
    priority: "high",
    date: "Dec 15, 2025",
  },
  {
    id: 3,
    master: "Carlos Martinez",
    note: "Serpentine belt starting to show cracks, schedule replacement",
    priority: "low",
    date: "Dec 10, 2025",
  },
];

const partsNeededNotes = [
  {
    id: 1,
    master: "Alex Rodriguez",
    parts: ["Spark Plug Set (4pc)", "Ignition Coil"],
    repair: "Engine Diagnostics",
  },
  {
    id: 2,
    master: "Mike Johnson",
    parts: ["Front Brake Pads", "Brake Fluid DOT 4"],
    repair: "Brake System Inspection",
  },
];

export const RepairWorksTab = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.7, type: "spring" }}
      className="space-y-8"
    >
      {/* Current Repair Works */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[hsl(36_100%_50%_/_10%)]">
            <Wrench className="h-5 w-5 text-[hsl(36_100%_50%)]" />
          </div>
          <h2 className="text-2xl font-bold text-[hsl(220_10%_95%)]">
            Current Repair Works
          </h2>
        </div>

        <div className="grid gap-4">
          {currentRepairs.map((repair, index) => (
            <div
              key={repair.id}
              className="bg-[hsl(222_47%_9%)] border-2 border-[hsl(220_15%_18%)] rounded-xl p-5 hover:border-[hsl(36_100%_50%)]/70 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-xl text-[hsl(220_10%_95%)]">
                      {repair.name}
                    </h3>
                    <StatusBadge status={repair.status} />
                  </div>

                  <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-[hsl(220_15%_15%_/_50%)]">
                    <div className="w-10 h-10 rounded-full bg-[hsl(36_100%_50%_/_20%)] flex items-center justify-center text-[hsl(36_100%_50%)] font-semibold text-md">
                      {repair.master.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-[hsl(220_10%_95%)]">
                        {repair.master.name}
                      </p>
                      <p className="text-md text-[hsl(220_10%_55%)]">
                        {repair.master.phone}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-md mb-4">
                    <div>
                      <span className="text-[hsl(220_10%_55%)]">
                        Start Date
                      </span>
                      <p className="font-medium text-[hsl(220_10%_95%)]">
                        {repair.startDate}
                      </p>
                    </div>
                    <div>
                      <span className="text-[hsl(220_10%_55%)]">
                        Est. Completion
                      </span>
                      <p className="font-medium text-[hsl(220_10%_95%)]">
                        {repair.estimatedEnd}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[hsl(220_15%_15%_/_50%)] border border-[hsl(220_15%_18%_/_50%)]">
                    <p className="text-md text-[hsl(220_10%_55%)]">
                      <span className="font-medium text-[hsl(220_10%_95%)]">
                        Notes:{" "}
                      </span>
                      {repair.notes}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Master Notes for Parts Needed */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[hsl(38_92%_50%_/_10%)]">
            <ClipboardList className="h-5 w-5 text-[hsl(38_92%_50%)]" />
          </div>
          <h2 className="text-2xl font-bold text-[hsl(220_10%_95%)]">
            Parts Needed for Current Work
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {partsNeededNotes.map((note) => (
            <div
              key={note.id}
              className="bg-[hsl(222_47%_9%)] border-1 border-[hsl(220_15%_18%)] rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-[hsl(220_10%_55%)]" />
                <span className="text-md font-medium text-[hsl(220_10%_95%)]">
                  {note.master}
                </span>
              </div>
              <p className="text-md text-[hsl(220_10%_55%)] mb-3">
                For: {note.repair}
              </p>
              <div className="flex flex-wrap gap-2">
                {note.parts.map((part, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg bg-[hsl(222_30%_15%)] text-md text-[hsl(220_10%_95%)]"
                  >
                    {part}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Future Repair Notes */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[hsl(199_89%_48%_/_10%)]">
            <AlertCircle className="h-5 w-5 text-[hsl(199_89%_48%)]" />
          </div>
          <h2 className="text-2xl font-bold text-[hsl(220_10%_95%)]">
            Recommended Future Repairs
          </h2>
        </div>

        <div className="space-y-3">
          {futureRepairNotes.map((note) => (
            <div
              key={note.id}
              className="bg-[hsl(222_47%_9%)] border-1 border-[hsl(220_15%_18%)] rounded-xl p-4 flex items-start gap-4"
            >
              <div
                className="w-2 h-2 rounded-full mt-2"
                style={{
                  backgroundColor:
                    note.priority === "high"
                      ? "hsl(0 72% 51%)" // --destructive
                      : note.priority === "medium"
                      ? "hsl(38 92% 50%)" // --warning
                      : "hsl(142 71% 45%)", // --success
                }}
              />
              <div className="flex-1">
                <p className="text-[hsl(220_10%_95%)]">{note.note}</p>
                <div className="flex items-center gap-4 mt-2 text-md text-[hsl(220_10%_55%)]">
                  <span>By: {note.master}</span>
                  <span>{note.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Repair History */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-[hsl(220_15%_18%)]">
            <Clock className="h-5 w-5 text-[hsl(220_10%_55%)]" />
          </div>
          <h2 className="text-xl font-semibold text-[hsl(220_10%_95%)]">
            Repair History
          </h2>
        </div>

        <div className="bg-[hsl(222_47%_9%)] border-1 border-[hsl(220_15%_18%)] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(220_15%_18%)]">
                <th className="text-left p-4 text-md font-medium text-[hsl(220_10%_55%)]">
                  Work
                </th>
                <th className="text-left p-4 text-md font-medium text-[hsl(220_10%_55%)]">
                  Master
                </th>
                <th className="text-left p-4 text-md font-medium text-[hsl(220_10%_55%)] hidden md:table-cell">
                  Date
                </th>
                <th className="text-left p-4 text-md font-medium text-[hsl(220_10%_55%)]">
                  Cost
                </th>
                <th className="text-left p-4 text-md font-medium text-[hsl(220_10%_55%)]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {historyRepairs.map((repair) => (
                <tr
                  key={repair.id}
                  className="border-b border-[hsl(220_15%_18%_/_50%)] hover:bg-[hsl(222_30%_15%)] transition-colors"
                >
                  <td className="p-4 text-md font-medium text-[hsl(220_10%_95%)]">
                    {repair.name}
                  </td>
                  <td className="p-4 text-md text-[hsl(220_10%_95%)]">
                    {repair.master.name}
                  </td>
                  <td className="p-4 text-md text-[hsl(220_10%_55%)] hidden md:table-cell">
                    {repair.completedDate}
                  </td>
                  <td className="p-4 text-md text-[hsl(36_100%_50%)] font-medium">
                    ${repair.cost.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={repair.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
};
