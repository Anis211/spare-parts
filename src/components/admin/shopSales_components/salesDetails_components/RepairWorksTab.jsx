"use client";
import {
  Wrench,
  Clock,
  User,
  AlertCircle,
  ClipboardList,
  CircleOff,
} from "lucide-react";
import { StatusBadge } from "@/components/admin/shopSales_components/salesDetails_components/StatusBadge";
import { motion } from "framer-motion";

export const RepairWorksTab = ({
  currentRepairs,
  historyRepairs,
  futureRepairNotes,
  partsNeededNotes,
}) => {
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

        <div
          className={`${
            partsNeededNotes.length > 0
              ? "grid grid-cols-2 gap-4"
              : "flex justify-center"
          }`}
        >
          {partsNeededNotes.length > 0 ? (
            partsNeededNotes.map((note) => (
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
            ))
          ) : (
            <div className="flex flex-row gap-2 items-center justify-center py-8 text-[hsl(220_10%_55%)] text-center">
              <CircleOff className="h-8 w-8 mb-4" />
              <h3 className="text-lg font-semibold mb-4">
                No parts needed for current work available
              </h3>
            </div>
          )}
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
          {futureRepairNotes.length > 0 ? (
            futureRepairNotes.map((note) => (
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
            ))
          ) : (
            <div className="flex flex-row gap-2 items-center justify-center py-8 text-[hsl(220_10%_55%)] text-center">
              <CircleOff className="h-8 w-8 mb-4" />
              <h3 className="text-lg font-semibold mb-4">
                No future repair notes available
              </h3>
            </div>
          )}
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
