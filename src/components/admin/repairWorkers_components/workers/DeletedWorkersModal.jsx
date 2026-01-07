"use client";
import { format } from "date-fns";
import { UserCheck, Trash2, Clock, Ban, Calendar, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/repair/dialog";
import { Button } from "@/components/admin/ui/repair/button";
import { Badge } from "@/components/admin/ui/repair/badge";
import { ScrollArea } from "@/components/admin/ui/repair/scroll-area";

export function DeletedWorkersModal({
  open,
  onClose,
  deletedWorkers,
  onRestore,
  onPermanentDelete,
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-2xl max-h-[85vh]"
        style={{
          backgroundColor: "hsl(222 47% 14%)", // --card
          borderColor: "hsl(222 30% 22%)", // --border
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2
              className="w-5 h-5"
              style={{ color: "hsl(215 20% 65%)" }} // --muted-foreground
            />
            <span style={{ color: "hsl(210 40% 98%)" }}>
              Removed Workers Archive
            </span>
            <Badge
              variant="secondary"
              className="ml-2"
              style={{
                backgroundColor: "hsl(222 47% 18%)", // --secondary
                color: "hsl(210 40% 98%)", // --secondary-foreground
                border: "none",
              }}
            >
              {deletedWorkers.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {deletedWorkers.length === 0 ? (
            <div
              className="text-center py-12"
              style={{ color: "hsl(215 20% 65% / 0.5)" }} // --muted-foreground/50
            >
              <User className="w-12 h-12 mx-auto mb-3" />
              <p className="mb-1">No removed workers</p>
              <p className="text-sm opacity-70">
                Workers you remove will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletedWorkers.map((deleted) => {
                const balance =
                  deleted.worker.totalEarned - deleted.worker.totalPaid;

                return (
                  <div
                    key={deleted.worker.id}
                    className="p-4 rounded-lg space-y-3"
                    style={{
                      backgroundColor: "hsl(222 47% 18% / 0.3)", // --secondary/30
                      borderColor: "hsl(222 30% 22%)", // --border
                      borderStyle: "solid",
                      borderWidth: "1px",
                    }}
                  >
                    {/* Worker Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                          style={{
                            backgroundColor: "hsl(222 30% 20%)", // --muted
                            color: "hsl(215 20% 65%)", // --muted-foreground
                          }}
                        >
                          {deleted.worker.name
                            ? deleted.worker.name.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                        <div>
                          <p
                            className="font-medium"
                            style={{ color: "hsl(210 40% 98%)" }} // --foreground
                          >
                            {deleted.worker.name}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: "hsl(215 20% 65%)" }} // --muted-foreground
                          >
                            {deleted.worker.specialty}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-0"
                        style={{
                          backgroundColor:
                            deleted.deletionType === "temporary"
                              ? "hsl(38 92% 50% / 0.1)" // --primary/10
                              : "hsl(0 84% 60% / 0.1)", // --destructive/10
                          color:
                            deleted.deletionType === "temporary"
                              ? "hsl(38 92% 50%)" // --primary
                              : "hsl(0 84% 60%)", // --destructive
                        }}
                      >
                        {deleted.deletionType === "temporary" ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            <span>Temporary</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3 mr-1" />
                            <span>Permanent</span>
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p style={{ color: "hsl(215 20% 65%)" }}>Removed On</p>
                        <p
                          className="font-medium"
                          style={{ color: "hsl(210 40% 98%)" }}
                        >
                          {format(new Date(deleted.deletedAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "hsl(215 20% 65%)" }}>Balance</p>
                        <p
                          className="font-medium"
                          style={{
                            color:
                              balance > 0
                                ? "hsl(38 92% 50%)"
                                : "hsl(142 76% 36%)", // primary/success
                          }}
                        >
                          ${balance.toLocaleString()}
                        </p>
                      </div>
                      {deleted.expectedReturnDate && (
                        <div className="col-span-2">
                          <p
                            className="flex items-center gap-1"
                            style={{ color: "hsl(215 20% 65%)" }}
                          >
                            <Calendar className="w-3 h-3" /> Expected Return
                          </p>
                          <p
                            className="font-medium"
                            style={{ color: "hsl(210 40% 98%)" }}
                          >
                            {format(
                              new Date(deleted.expectedReturnDate),
                              "MMM d, yyyy"
                            )}
                          </p>
                        </div>
                      )}
                      {deleted.reason && (
                        <div className="col-span-2">
                          <p style={{ color: "hsl(215 20% 65%)" }}>Reason</p>
                          <p
                            className="text-foreground"
                            style={{ color: "hsl(210 40% 98%)" }}
                          >
                            {deleted.reason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Stats Summary */}
                    <div
                      className="grid grid-cols-3 gap-2 pt-2"
                      style={{ borderColor: "hsl(222 30% 22%)" }}
                    >
                      <div className="text-center">
                        <p
                          className="text-xs"
                          style={{ color: "hsl(215 20% 65%)" }}
                        >
                          Total Earned
                        </p>
                        <p
                          className="font-medium text-sm"
                          style={{ color: "hsl(210 40% 98%)" }}
                        >
                          ${deleted.worker.totalEarned.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p
                          className="text-xs"
                          style={{ color: "hsl(215 20% 65%)" }}
                        >
                          Total Paid
                        </p>
                        <p
                          className="font-medium text-sm"
                          style={{ color: "hsl(210 40% 98%)" }}
                        >
                          ${deleted.worker.totalPaid.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p
                          className="text-xs"
                          style={{ color: "hsl(215 20% 65%)" }}
                        >
                          Jobs Done
                        </p>
                        <p
                          className="font-medium text-sm"
                          style={{ color: "hsl(210 40% 98%)" }}
                        >
                          {
                            deleted.worker.currentMonthWorks.filter(
                              (w) => w.status === "completed"
                            ).length
                          }
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => onRestore(deleted.worker.id)}
                        style={{
                          backgroundColor: "hsl(38 92% 50%)", // --primary
                          color: "hsl(222 47% 11%)", // --primary-foreground
                        }}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Restore Worker
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onPermanentDelete(deleted.worker.id)}
                        style={{
                          backgroundColor: "hsl(0 84% 60%)", // --destructive
                          color: "hsl(210 40% 98%)", // --destructive-foreground
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
