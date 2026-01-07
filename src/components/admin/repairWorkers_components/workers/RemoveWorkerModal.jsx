"use client";
import { useState } from "react";
import { format } from "date-fns";
import { UserMinus, Calendar, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin/ui/repair/dialog";
import { Button } from "@/components/admin/ui/repair/button";
import { Label } from "@/components/admin/ui/repair/label";
import { Textarea } from "@/components/admin/ui/repair/textarea";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/admin/ui/repair/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/admin/ui/repair/popover";
import { cn } from "@/lib/utils";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

export function RemoveWorkerModal({ open, onClose, worker, onRemove }) {
  const [deletionType, setDeletionType] = useState("temporary");
  const [reason, setReason] = useState("");
  const [returnDate, setReturnDate] = useState(undefined);

  const handleSubmit = () => {
    onRemove(
      worker.id,
      deletionType,
      reason,
      returnDate ? returnDate.toISOString() : undefined
    );
    setDeletionType("temporary");
    setReason("");
    setReturnDate(undefined);
    onClose();
  };

  const balance = worker.totalEarned - worker.totalPaid;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md"
        style={{
          backgroundColor: "hsl(222 47% 14%)", // --card
          borderColor: "hsl(222 30% 22%)", // --border
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserMinus
              className="w-5 h-5"
              style={{ color: "hsl(0 84% 60%)" }} // --destructive
            />
            <span style={{ color: "hsl(0 84% 60%)" }}>Remove Worker</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Worker Info */}
          <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{ backgroundColor: "hsl(222 47% 18% / 0.5)" }} // --secondary/50
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
              style={{
                backgroundColor: "hsl(38 92% 50% / 0.2)", // --primary/20
                color: "hsl(38 92% 50%)", // --primary
              }}
            >
              {worker.name ? worker.name.charAt(0).toUpperCase() : "?"}
            </div>
            <div>
              <p
                className="font-medium"
                style={{ color: "hsl(210 40% 98%)" }} // --foreground
              >
                {worker.name}
              </p>
              <p
                className="text-sm"
                style={{ color: "hsl(215 20% 65%)" }} // --muted-foreground
              >
                {worker.specialty}
              </p>
            </div>
          </div>

          {/* Balance Warning */}
          {balance > 0 && (
            <div
              className="flex items-start gap-2 p-3 rounded-lg border"
              style={{
                backgroundColor: "hsl(38 92% 50% / 0.1)", // --primary/10
                borderColor: "hsl(38 92% 50% / 0.2)", // --primary/20
              }}
            >
              <AlertTriangle
                className="w-5 h-5 shrink-0 mt-0.5"
                style={{ color: "hsl(38 92% 50%)" }} // --primary
              />
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "hsl(38 92% 50%)" }}
                >
                  Outstanding Balance
                </p>
                <p className="text-xs" style={{ color: "hsl(215 20% 65%)" }}>
                  This worker has ${balance.toLocaleString()} unpaid balance.
                </p>
              </div>
            </div>
          )}

          {/* Deletion Type */}
          <div className="space-y-3">
            <Label htmlFor="deletion-type">Removal Type</Label>
            <RadioGroup
              value={deletionType}
              onValueChange={setDeletionType}
              className="grid grid-cols-2 gap-3"
            >
              {/* Temporary */}
              <label
                className={cn(
                  "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all",
                  deletionType === "temporary"
                    ? "border-[hsl(38_92%_50%)] bg-[hsl(38_92%_50%)]/[0.1]"
                    : "border-[hsl(222_30%_22%)] hover:border-[hsl(215_20%_65%)]"
                )}
              >
                <RadioGroupItem
                  value="temporary"
                  id="temporary"
                  style={{
                    backgroundColor:
                      deletionType === "temporary"
                        ? "hsl(38 92% 50%)"
                        : "hsl(222 47% 14%)",
                    borderColor: "hsl(222 30% 22%)",
                  }}
                />
                <div>
                  <span
                    className="font-medium block"
                    style={{ color: "hsl(210 40% 98%)" }}
                  >
                    Temporary
                  </span>
                  <p className="text-xs" style={{ color: "hsl(215 20% 65%)" }}>
                    On leave / vacation
                  </p>
                </div>
              </label>

              {/* Permanent */}
              <label
                className={cn(
                  "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all",
                  deletionType === "permanent"
                    ? "border-[hsl(0_84%_60%)] bg-[hsl(0_84%_60%)]/[0.1]"
                    : "border-[hsl(222_30%_22%)] hover:border-[hsl(215_20%_65%)]"
                )}
              >
                <RadioGroupItem
                  value="permanent"
                  id="permanent"
                  style={{
                    backgroundColor:
                      deletionType === "permanent"
                        ? "hsl(0 84% 60%)"
                        : "hsl(222 47% 14%)",
                    borderColor: "hsl(222 30% 22%)",
                  }}
                />
                <div>
                  <span
                    className="font-medium block"
                    style={{ color: "hsl(210 40% 98%)" }}
                  >
                    Permanent
                  </span>
                  <p className="text-xs" style={{ color: "hsl(215 20% 65%)" }}>
                    No longer working
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Return Date (only for temporary) */}
          {deletionType === "temporary" && (
            <div className="space-y-2">
              <Label htmlFor="return-date">Expected Return Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !returnDate && "text-muted-foreground"
                    )}
                    style={{
                      backgroundColor: "hsl(222 47% 18%)", // --secondary
                      color: returnDate
                        ? "hsl(210 40% 98%)"
                        : "hsl(215 20% 65%)",
                      borderColor: "hsl(222 30% 22%)",
                    }}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {returnDate ? format(returnDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 pointer-events-auto"
                  align="start"
                  style={{
                    backgroundColor: "hsl(222 47% 14%)",
                    border: "1px solid hsl(222 30% 22%)",
                  }}
                >
                  <DayPicker
                    animate
                    mode="single"
                    selected={returnDate}
                    onSelect={setReturnDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                    className="pointer-events-auto p-4"
                    classNames={{
                      months: "text-white",
                      nav_button: cn(
                        "h-7 w-7 p-0 opacity-50 hover:opacity-100",
                        "bg-white border border-[hsl(222_30%_22%)]",
                        "text-[hsl(210_40%_98%)] hover:bg-[hsl(222_47%_14%)] hover:text-[hsl(210_40%_98%)]",
                        "rounded-md"
                      ),
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for removal..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              rows={3}
              style={{
                backgroundColor: "hsl(222 47% 18%)", // --secondary
                color: "hsl(210 40% 98%)",
                borderColor: "hsl(222 30% 22%)",
              }}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            style={{
              color: "hsl(210 40% 98%)",
              backgroundColor: "transparent",
              borderColor: "hsl(222 30% 22%)",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            style={{
              backgroundColor:
                deletionType === "permanent"
                  ? "hsl(0 84% 60%)" // --destructive
                  : "hsl(38 92% 50%)", // --primary
              color:
                deletionType === "permanent"
                  ? "hsl(210 40% 98%)" // --destructive-foreground
                  : "hsl(222 47% 11%)", // --primary-foreground
            }}
          >
            {deletionType === "permanent"
              ? "Remove Permanently"
              : "Remove Temporarily"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
