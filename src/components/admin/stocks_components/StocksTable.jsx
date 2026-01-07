import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/stocks/table";
import { Badge } from "@/components/admin/ui/stocks/badge";

export const StocksTable = ({ brand, parts }) => {
  const getStockStatus = (amount) => {
    if (amount === 0) return { label: "Out of Stock", variant: "destructive" };
    if (amount < 5) return { label: "Low Stock", variant: "warning" };
    return { label: "In Stock", variant: "success" };
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold text-[hsl(210_40%_98%)]">
          {brand}
        </h2>
        <Badge
          variant="outline"
          className="text-[hsl(215_20%_55%)] border-[hsl(230_20%_22%)]"
        >
          {parts.length} parts
        </Badge>
      </div>
      <div className="rounded-lg border border-[hsl(230_20%_22%)] bg-[hsl(230_25%_14%)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[hsl(230_20%_22%)] hover:bg-transparent">
              <TableHead className="text-[hsl(215_20%_55%)] font-medium">
                Article
              </TableHead>
              <TableHead className="text-[hsl(215_20%_55%)] font-medium">
                Name
              </TableHead>
              <TableHead className="text-[hsl(215_20%_55%)] font-medium text-center">
                Amount
              </TableHead>
              <TableHead className="text-[hsl(215_20%_55%)] font-medium">
                Cost
              </TableHead>
              <TableHead className="text-[hsl(215_20%_55%)] font-medium text-right">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parts.map((part) => {
              const status = getStockStatus(part.amount);
              return (
                <TableRow
                  key={part.article}
                  className="border-[hsl(230_20%_22%)] hover:bg-[hsl(230_20%_22%)]/50"
                >
                  <TableCell className="font-mono text-sm text-[hsl(174_72%_46%)]">
                    {part.article}
                  </TableCell>
                  <TableCell className="text-[hsl(210_40%_98%)]">
                    {part.name}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`font-medium ${
                        part.amount < 5
                          ? "text-[hsl(38_92%_50%)]"
                          : "text-[hsl(210_40%_98%)]"
                      }`}
                    >
                      {part.amount}
                    </span>
                  </TableCell>
                  <TableCell className="text-[hsl(142_76%_36%)] font-medium">
                    ${part.cost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {status.variant === "destructive" && (
                      <Badge className="bg-[hsl(0_72%_51%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(0_72%_51%)]/90">
                        {status.label}
                      </Badge>
                    )}
                    {status.variant === "warning" && (
                      <Badge className="bg-[hsl(38_92%_50%)] text-[hsl(230_25%_10%)] hover:bg-[hsl(38_92%_50%)]/90">
                        {status.label}
                      </Badge>
                    )}
                    {status.variant === "success" && (
                      <Badge className="bg-[hsl(142_76%_36%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(142_76%_36%)]/90">
                        {status.label}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
