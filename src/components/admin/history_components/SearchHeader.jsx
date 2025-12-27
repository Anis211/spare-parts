import { Search } from "lucide-react";
import { Input } from "@/components/admin/ui/search_input";
import { Button } from "@/components/admin/ui/history/button";

export function SearchHeader({ searchQuery, onSearchChange }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
      <div className="flex-1 w-full max-w-2xl">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="SEARCH BY VIN OR PHONE..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="border-1 bg-[hsl(222_47%_9%)] border-[hsl(222_30%_18%)] focus:border-[hsl(38_92%_55%)] focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-white uppercase font-mono tracking-wider placeholder:text-white"
            />
          </div>
          <Button
            size="icon"
            className="h-12 w-12 shrink-0"
            style={{
              backgroundColor: "hsl(38 92% 55%)",
              color: "hsl(213 50% 10%)",
              borderColor: "hsl(38 92% 55%)",
            }}
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
