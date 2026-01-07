import { useState } from "react";
import { Package, Search, Filter } from "lucide-react";
import { StocksTable } from "@/components/admin/stocks_components/StocksTable";
import { stocksData } from "@/data/stocksData";
import { Input } from "@/components/admin/ui/stocks/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/stocks/select";

const Stocks = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");

  const filteredData = stocksData
    .filter(
      (brandData) =>
        selectedBrand === "all" || brandData.brand === selectedBrand
    )
    .map((brandData) => ({
      ...brandData,
      parts: brandData.parts.filter(
        (part) =>
          part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          part.article.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((brandData) => brandData.parts.length > 0);

  const totalParts = stocksData.reduce(
    (acc, brand) =>
      acc + brand.parts.reduce((sum, part) => sum + part.amount, 0),
    0
  );

  const lowStockCount = stocksData.reduce(
    (acc, brand) =>
      acc +
      brand.parts.filter((part) => part.amount > 0 && part.amount < 5).length,
    0
  );

  const outOfStockCount = stocksData.reduce(
    (acc, brand) =>
      acc + brand.parts.filter((part) => part.amount === 0).length,
    0
  );

  return (
    <div className="min-h-screen bg-transparent">
      <main className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[hsl(230_25%_14%)] border border-[hsl(230_20%_22%)] rounded-lg p-5">
            <p className="text-sm text-[hsl(215_20%_55%)] mb-1">
              Total Parts in Stock
            </p>
            <p className="text-3xl font-bold text-[hsl(210_40%_98%)]">
              {totalParts}
            </p>
          </div>
          <div className="bg-[hsl(230_25%_14%)] border border-[hsl(230_20%_22%)] rounded-lg p-5">
            <p className="text-sm text-[hsl(215_20%_55%)] mb-1">
              Low Stock Items
            </p>
            <p className="text-3xl font-bold text-[hsl(38_92%_50%)]">
              {lowStockCount}
            </p>
          </div>
          <div className="bg-[hsl(230_25%_14%)] border border-[hsl(230_20%_22%)] rounded-lg p-5">
            <p className="text-sm text-[hsl(215_20%_55%)] mb-1">Out of Stock</p>
            <p className="text-3xl font-bold text-[hsl(0_72%_51%)]">
              {outOfStockCount}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215_20%_55%)]" />
            <Input
              placeholder="Search by article or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[hsl(230_25%_14%)] border-[hsl(230_20%_22%)] focus:ring-2 focus:ring-[hsl(174_72%_46%)] focus:border-[hsl(174_72%_46%)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[hsl(215_20%_55%)]" />
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-48 bg-[hsl(230_25%_14%)] border-[hsl(230_20%_22%)] focus:ring-2 focus:ring-[hsl(174_72%_46%)]">
                <SelectValue placeholder="Filter by brand" />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(230_25%_14%)] border-[hsl(230_20%_22%)]">
                <SelectItem
                  value="all"
                  className="focus:bg-[hsl(230_20%_18%)] focus:text-[hsl(210_40%_98%)]"
                >
                  All Brands
                </SelectItem>
                {stocksData.map((brand) => (
                  <SelectItem
                    key={brand.brand}
                    value={brand.brand}
                    className="focus:bg-[hsl(230_20%_18%)] focus:text-[hsl(210_40%_98%)]"
                  >
                    {brand.brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tables by Brand */}
        <div className="space-y-8">
          {filteredData.length > 0 ? (
            filteredData.map((brandData) => (
              <StocksTable
                key={brandData.brand}
                brand={brandData.brand}
                parts={brandData.parts}
              />
            ))
          ) : (
            <div className="text-center py-12 text-[hsl(215_20%_55%)]">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No parts found matching your search criteria.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Stocks;
