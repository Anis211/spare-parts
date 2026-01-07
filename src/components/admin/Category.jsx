import { useState } from "react";
import { CategoryTree } from "@/components/admin/categoryTab_components/CategoryTree";
import { InfoPanel } from "@/components/admin/categoryTab_components/InfoPanel";
import { Statistics } from "@/components/admin/categoryTab_components/Statistics";
import { AnalogsResults } from "@/components/admin/categoryTab_components/AnalogsResults";
import { AnalogDetailDialog } from "@/components/admin/categoryTab_components/AnalogDetailDialog";
import { mockCategories, generateMockAnalogs } from "@/data/categoriesData";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [analogs, setAnalogs] = useState([]);
  const [showAnalogs, setShowAnalogs] = useState(false);
  const [selectedAnalog, setSelectedAnalog] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setShowAnalogs(false);
    setAnalogs([]);
  };

  const handleSearchAnalogs = async () => {
    if (!selectedCategory) return;

    setIsSearching(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const results = generateMockAnalogs(selectedCategory.name);
    setAnalogs(results);
    setShowAnalogs(true);
    setIsSearching(false);
  };

  const handleCloseAnalogs = () => {
    setShowAnalogs(false);
    setAnalogs([]);
  };

  const handleSelectAnalog = (analog) => {
    setSelectedAnalog(analog);
    setDialogOpen(true);
  };

  // Count categories
  const countCategories = (cats) => {
    return cats.reduce((sum, cat) => {
      return sum + 1 + (cat.children ? countCategories(cat.children) : 0);
    }, 0);
  };

  const totalCategories = countCategories(mockCategories);

  return (
    <div className="flex min-h-screen bg-[hsl(220_20%_10%)]">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 p-6 overflow-auto scrollbar-thin">
          <div className="grid grid-cols-12 gap-6 max-w-[1600px] mx-auto">
            {/* Category Tree - Left Column */}
            <div className="col-span-8">
              <CategoryTree
                categories={mockCategories}
                onSelectCategory={handleSelectCategory}
                selectedId={selectedCategory?.id}
              />

              {/* Analogs Results - Below Tree */}
              {showAnalogs && selectedCategory && (
                <div className="mt-6">
                  <AnalogsResults
                    analogs={analogs}
                    category={selectedCategory}
                    onClose={handleCloseAnalogs}
                    onSelectAnalog={handleSelectAnalog}
                  />
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="col-span-4 space-y-6">
              <InfoPanel
                selectedCategory={selectedCategory}
                onSearchAnalogs={handleSearchAnalogs}
                isSearching={isSearching}
              />

              <Statistics
                mainCategories={mockCategories.length}
                totalCategories={totalCategories}
              />
            </div>
          </div>
        </main>
      </div>
      <AnalogDetailDialog
        analog={selectedAnalog}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default Index;
