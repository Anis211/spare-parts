import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { Avatar, AvatarFallback } from "@/components/admin/ui/avatar";

export default function WorkersTable({ workers }) {
  return (
    <div className="rounded-lg border border-[hsl(220_50%_25%)] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[hsl(220_60%_20%)] hover:bg-[hsl(220_60%_20%)]">
            <TableHead className="text-[hsl(45_100%_95%)] font-semibold">
              Worker
            </TableHead>
            <TableHead className="text-[hsl(45_100%_95%)] font-semibold">
              Deliveries Completed
            </TableHead>
            <TableHead className="text-[hsl(45_100%_95%)] font-semibold">
              Monthly Salary
            </TableHead>
            <TableHead className="text-[hsl(45_100%_95%)] font-semibold">
              Current Deliveries
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.map((worker) => (
            <TableRow
              key={worker.name}
              className="hover:bg-[hsl(220_60%_20%)]/50 border-b border-[hsl(220_50%_25%)]"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-[hsl(45_100%_51%)]/20 border-2 border-[hsl(45_100%_51%)]">
                    <AvatarFallback className="text-[hsl(45_100%_51%)] font-semibold bg-transparent">
                      {worker.name.split(" ")[0][0] +
                        worker.name.split(" ")[1][0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-[hsl(45_100%_95%)]">
                    {worker.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[hsl(45_100%_51%)]">
                    {worker.deliveredOrders.length}
                  </span>
                  <span className="text-sm text-[hsl(220_20%_70%)]">
                    orders
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-semibold text-lg text-[hsl(45_100%_95%)]">
                {0}
              </TableCell>
              <TableCell className="text-[hsl(220_20%_70%)]">
                {worker.activeOrders.map((order) => order + ", ")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
