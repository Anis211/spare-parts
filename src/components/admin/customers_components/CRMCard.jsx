"use client";
import {
  Car,
  Phone,
  Calendar,
  MessageCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export const CRMCard = ({
  record,
  unreadMessages,
  aiTipsCount,
  activeOrders,
  onClick,
}) => {
  return (
    <div
      className="bg-[hsl(222_40%_9%)]/80 backdrop-blur-xl border-1 border-[hsl(222_30%_18%)]/50 shadow-lg rounded-xl p-5 cursor-pointer hover:border-[hsl(43_96%_56%)] transition-all duration-300 animate-slide-up"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, hsl(43 96% 56%), hsl(38 92% 50%))",
            }}
          >
            <span className="text-lg font-bold text-[hsl(222_47%_6%)]">
              {record.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-[hsl(40_20%_95%)]">
              {record.name}
            </h3>
            <div className="flex items-center gap-1 text-sm text-[hsl(220_15%_55%)]">
              <Phone className="w-3 h-3" />
              {record.phone}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          {unreadMessages > 0 && (
            <span
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
              style={{
                backgroundColor: "hsl(43 96% 56% / 0.2)",
                color: "hsl(43 96% 56%)",
              }}
            >
              <MessageCircle className="w-3 h-3" />
              {unreadMessages}
            </span>
          )}
          {aiTipsCount > 0 && (
            <span
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
              style={{
                backgroundColor: "hsl(38 92% 50% / 0.2)",
                color: "hsl(38 92% 50%)",
              }}
            >
              <Sparkles className="w-3 h-3" />
              {aiTipsCount}
            </span>
          )}
        </div>
      </div>

      {/* Vehicle Info */}
      <div
        className="flex items-center gap-2 p-3 rounded-lg mb-4"
        style={{
          backgroundColor: "hsl(222 30% 14% / 0.5)",
          color: "hsl(40 20% 95%)",
        }}
      >
        <Car className="w-5 h-5 text-[hsl(43_96%_56%)]" />
        <div className="flex-1">
          <p className="text-sm font-medium">
            {record.year} {record.make} {record.model}
          </p>
          <p className="font-mono text-xs text-[hsl(220_15%_55%)]">
            {record.vin}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div
          className="text-center p-2 rounded-lg"
          style={{ backgroundColor: "hsl(222 30% 14%)" }}
        >
          <p className="text-lg font-bold text-[hsl(43_96%_56%)]">
            ${record.totalSpent.toFixed(0)}
          </p>
          <p className="text-xs text-[hsl(220_15%_55%)]">Total Spent</p>
        </div>
        <div
          className="text-center p-2 rounded-lg"
          style={{ backgroundColor: "hsl(222 30% 14%)" }}
        >
          <p className="text-lg font-bold text-[hsl(38_92%_50%)]">
            {activeOrders}
          </p>
          <p className="text-xs text-[hsl(220_15%_55%)]">Active Orders</p>
        </div>
        <div
          className="text-center p-2 rounded-lg"
          style={{ backgroundColor: "hsl(222 30% 14%)" }}
        >
          <p className="text-lg font-bold text-[hsl(40_20%_95%)]">
            {record.lastVisit.split("-")[1]}/{record.lastVisit.split("-")[2]}
          </p>
          <p className="text-xs text-[hsl(220_15%_55%)]">Last Visit</p>
        </div>
      </div>

      {/* Next Appointment */}
      {record.nextAppointment && (
        <div
          className="flex items-center gap-2 p-2 rounded-lg mb-4"
          style={{
            backgroundColor: "hsl(142 76% 36% / 0.1)",
            border: "1px solid hsl(142 76% 36% / 0.3)",
            color: "hsl(142 76% 36%)",
          }}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-sm">
            Next appointment: {record.nextAppointment}
          </span>
        </div>
      )}

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-3"
        style={{
          borderTop: "1px solid hsl(222 30% 18%)",
        }}
      >
        <span className="text-xs text-[hsl(220_15%_55%)]">
          Customer since {record.createdAt}
        </span>
        <ChevronRight className="w-4 h-4 text-[hsl(220_15%_55%)]" />
      </div>
    </div>
  );
};

export default CRMCard;
