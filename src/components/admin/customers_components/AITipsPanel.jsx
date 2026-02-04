"use client";
import {
  Sparkles,
  TrendingUp,
  Wrench,
  Bell,
  AlertTriangle,
  ClockArrowUp,
} from "lucide-react";
import { motion } from "framer-motion";

// Tip type config → using HSL directly
const tipConfig = {
  upsell: {
    icon: TrendingUp,
    color: "hsl(142 76% 36%)", // --success
    bgColor: "hsl(142 76% 36% / 0.1)", // bg-success/10
    borderColor: "hsl(142 76% 36% / 0.3)", // border-success/30
  },
  maintenance: {
    icon: Wrench,
    color: "hsl(199 89% 48%)", // --info
    bgColor: "hsl(199 89% 48% / 0.1)", // bg-info/10
    borderColor: "hsl(199 89% 48% / 0.3)", // border-info/30
  },
  followup: {
    icon: Bell,
    color: "hsl(43 96% 56%)", // --primary
    bgColor: "hsl(43 96% 56% / 0.1)", // bg-primary/10
    borderColor: "hsl(43 96% 56% / 0.3)", // border-primary/30
  },
  warning: {
    icon: AlertTriangle,
    color: "hsl(0 72% 51%)", // --destructive
    bgColor: "hsl(0 72% 51% / 0.1)", // bg-destructive/10
    borderColor: "hsl(0 72% 51% / 0.3)", // border-destructive/30
  },
};

// Priority badge styles
const priorityBadge = {
  low: {
    bg: "hsl(222 30% 14%)",
    text: "hsl(220 15% 55%)",
  },
  medium: {
    bg: "hsl(38 92% 50% / 0.2)", // warning/20
    text: "hsl(38 92% 50%)",
  },
  high: {
    bg: "hsl(0 72% 51% / 0.2)", // destructive/20
    text: "hsl(0 72% 51%)",
  },
};

export const AITipsPanel = ({ tips, onDismiss, handleClick }) => {
  if (tips.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.6, type: "spring" }}
      className="bg-[hsl(222_40%_9%)]/80 backdrop-blur-xl border border-[hsl(222_30%_18%)]/50 shadow-lg rounded-xl p-5 animate-fade-in"
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, hsl(43 96% 56%), hsl(38 92% 50%))",
          }}
        >
          <Sparkles className="w-4 h-4 text-[hsl(222_47%_6%)]" />
        </div>
        <div>
          <h3 className="font-semibold text-[hsl(40_20%_95%)]">
            AI Expert Tips
          </h3>
          <p className="text-xs text-[hsl(220_15%_55%)]">
            Smart recommendations for this customer
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="self-end ml-12 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, hsl(43 96% 56%), hsl(38 92% 50%))",
          }}
          onClick={handleClick}
        >
          <ClockArrowUp className="w-4 h-4 text-[hsl(222_47%_6%)]" />
        </motion.button>
      </div>

      <div className="space-y-3">
        {tips.map((tip, index) => {
          const config = tipConfig[tip.type] || tipConfig.followup;
          const Icon = config.icon;

          const priorityStyle =
            priorityBadge[tip.priority] || priorityBadge.low;

          return (
            <div
              key={tip.id}
              className="p-4 rounded-lg transition-all duration-200 hover:scale-[1.02] animate-slide-up"
              style={{
                backgroundColor: config.bgColor,
                border: `1px solid ${config.borderColor}`,
                animationDelay: `${index * 50}ms`,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: "hsl(222 47% 6% / 0.5)", // bg-background/50
                    color: config.color,
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-[hsl(40_20%_95%)] text-sm">
                      {tip.title}
                    </h4>
                    <span
                      className="px-2 py-0.5 text-xs rounded-full font-medium"
                      style={{
                        backgroundColor: priorityStyle.bg,
                        color: priorityStyle.text,
                      }}
                    >
                      {tip.priority}
                    </span>
                  </div>
                  <p className="text-sm text-[hsl(220_15%_55%)]">
                    {tip.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default AITipsPanel;
