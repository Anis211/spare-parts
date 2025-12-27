"use client";
import { useState } from "react";
import { Search, Filter, Plus, X } from "lucide-react";
import { Input } from "@/components/admin/ui/sales/input";
import { Button } from "@/components/admin/ui/sales/button";
import { Badge } from "@/components/admin/ui/sales/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/admin/ui/sales/popover";
import { Checkbox } from "@/components/admin/ui/sales/checkbox";
import { Label } from "@/components/admin/ui/sales/label";
import { cn } from "@/lib/utils";

const statusOptions = [
  {
    value: "pending",
    label: "Pending",
    colorClass: "bg-[hsl(217_91%_60%)]/20 text-[hsl(217_91%_60%)]",
  },
  {
    value: "in-progress",
    label: "In Progress",
    colorClass: "bg-[hsl(38_92%_50%)]/20 text-[hsl(38_92%_50%)]",
  },
  {
    value: "completed",
    label: "Completed",
    colorClass: "bg-[hsl(142_72%_45%)]/20 text-[hsl(142_72%_45%)]",
  },
];

export function SearchHeader({
  searchValue,
  onSearchChange,
  statusFilters = [],
  onStatusFiltersChange,
  onAddNew,
}) {
  const [filterOpen, setFilterOpen] = useState(false);

  const toggleStatus = (status) => {
    if (statusFilters.includes(status)) {
      onStatusFiltersChange(statusFilters.filter((s) => s !== status));
    } else {
      onStatusFiltersChange([...statusFilters, status]);
    }
  };

  const clearFilters = () => {
    onStatusFiltersChange([]);
  };

  const activeFilterCount = statusFilters.length;

  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(220_15%_55%)]" />
            <Input
              type="text"
              placeholder="Search by VIN or client name..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className={cn(
                "pl-10",
                "bg-[hsl(222_30%_15%)]",
                "border-[hsl(222_30%_18%)]",
                "text-[hsl(40_15%_95%)]",
                "placeholder:text-[hsl(220_15%_55%)]",
                "focus:ring-[hsl(40_95%_55%)]"
              )}
            />
          </div>

          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "border-[hsl(222_30%_18%)] hover:bg-[hsl(222_30%_15%)] relative",
                  activeFilterCount > 0 && "border-[hsl(40_95%_55%)]"
                )}
              >
                <Filter className="h-4 w-4 text-[hsl(40_15%_95%)]" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-[hsl(40_95%_55%)] text-[hsl(222_47%_6%)] text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-56 bg-[hsl(222_47%_9%)] border-[hsl(222_30%_18%)] p-4"
              align="end"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-[hsl(40_15%_95%)] text-sm">
                  Filter by Status
                </h4>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto p-0 text-xs text-[hsl(220_15%_55%)] hover:text-[hsl(40_15%_95%)]"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {statusOptions.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={option.value}
                      checked={statusFilters.includes(option.value)}
                      onCheckedChange={() => toggleStatus(option.value)}
                      className={cn(
                        "border-[hsl(222_30%_18%)]",
                        "data-[state=checked]:bg-[hsl(40_95%_55%)]",
                        "data-[state=checked]:border-[hsl(40_95%_55%)]"
                      )}
                    />
                    <Label
                      htmlFor={option.value}
                      className="text-sm text-[hsl(40_15%_95%)] cursor-pointer flex-1"
                    >
                      {option.label}
                    </Label>
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        option.colorClass.split(" ")[0]
                      )}
                    />
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            onClick={onAddNew}
            className="bg-[hsl(40_95%_55%)] text-[hsl(222_47%_6%)] hover:bg-[hsl(40_95%_55%)]/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-[hsl(220_15%_55%)]">
            Active filters:
          </span>
          {statusFilters.map((status) => {
            const option = statusOptions.find((o) => o.value === status);
            return (
              <Badge
                key={status}
                variant="secondary"
                className={cn("gap-1 pr-1", option?.colorClass)}
              >
                {option?.label}
                <button
                  onClick={() => toggleStatus(status)}
                  className="ml-1 rounded-full hover:bg-[hsl(222_30%_12%)]/20 p-0.5"
                >
                  <X className="h-3 w-3 text-[hsl(40_15%_95%)]" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
