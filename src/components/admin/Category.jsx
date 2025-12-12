import { useState } from "react";
import { Search, Car, Menu } from "lucide-react";
import { CategoryTree } from "./categoryTab_components/CategoryTree";
import { CategoryBreadcrumb } from "./categoryTab_components/CategoryBreadcrump";
import { categoriesData } from "@/data/categoriesData";
import { Input } from "./ui/category/input";
import { motion } from "framer-motion";

const COLORS = {
  background: "hsl(222 47% 11%)",
  foreground: "hsl(48 96% 89%)",
  card: "hsl(222 47% 14%)",
  primary: "hsl(45 93% 47%)",
  primaryForeground: "hsl(222 47% 11%)",
  secondary: "hsl(222 47% 18%)",
  muted: "hsl(222 30% 20%)",
  mutedForeground: "hsl(220 15% 60%)",
  border: "hsl(222 30% 25%)",
  goldSoft: "hsl(45 80% 55%)",
};

const Category = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = searchQuery
    ? categoriesData.filter(
        (cat) =>
          cat.STR_NODE_NAME.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.STR_PATH.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categoriesData;

  return (
    <div style={{ backgroundColor: "transparent" }}>
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tree Panel */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="lg:col-span-2"
          >
            <div
              style={{
                backgroundColor: COLORS.card,
                borderRadius: "0.75rem",
                border: `1px solid ${COLORS.border}`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  backgroundColor: COLORS.primary,
                  padding: "0.75rem 1rem",
                }}
              >
                <h2
                  className="font-semibold"
                  style={{ color: COLORS.primaryForeground }}
                >
                  Дерево категорий
                </h2>
              </div>

              {/* Mobile Search */}
              <div
                className="md:hidden p-4 border-b"
                style={{ borderColor: COLORS.border }}
              >
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: COLORS.mutedForeground }}
                  />
                  <Input
                    placeholder="Поиск..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    style={{
                      paddingLeft: "2.5rem",
                      backgroundColor: COLORS.secondary,
                      borderColor: COLORS.border,
                      color: COLORS.foreground,
                    }}
                  />
                </div>
              </div>

              <div
                className="p-4 max-h-[600px] overflow-y-auto scrollbar"
                style={{ color: COLORS.foreground }}
              >
                {filteredCategories.length > 0 ? (
                  <CategoryTree
                    categories={filteredCategories}
                    onSelect={setSelectedCategory}
                  />
                ) : (
                  <div
                    className="text-center py-8"
                    style={{ color: COLORS.mutedForeground }}
                  >
                    Категории не найдены
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Info Panel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, type: "spring" }}
            className="lg:col-span-1"
          >
            <div
              style={{
                backgroundColor: COLORS.card,
                borderRadius: "0.75rem",
                border: `1px solid ${COLORS.border}`,
                overflow: "hidden",
                position: "sticky",
                top: "6rem",
              }}
            >
              <div
                style={{
                  backgroundColor: COLORS.primary,
                  padding: "0.75rem 1rem",
                }}
              >
                <h2
                  className="font-semibold text-sm"
                  style={{ color: COLORS.primaryForeground }}
                >
                  Информация
                </h2>
              </div>

              <div className="p-4">
                {selectedCategory ? (
                  <div className="space-y-4">
                    <div>
                      <label
                        className="text-xs uppercase tracking-wider"
                        style={{ color: COLORS.mutedForeground }}
                      >
                        Название
                      </label>
                      <p
                        className="font-medium mt-1"
                        style={{ color: COLORS.foreground }}
                      >
                        {selectedCategory.STR_NODE_NAME}
                      </p>
                    </div>

                    <div>
                      <label
                        className="text-xs uppercase tracking-wider"
                        style={{ color: COLORS.mutedForeground }}
                      >
                        ID
                      </label>
                      <p
                        className="font-mono mt-1"
                        style={{ color: COLORS.primary }}
                      >
                        {selectedCategory.STR_ID}
                      </p>
                    </div>

                    <div>
                      <label
                        className="text-xs uppercase tracking-wider"
                        style={{ color: COLORS.mutedForeground }}
                      >
                        Уровень
                      </label>
                      <p className="mt-1">
                        <span
                          className="inline-flex items-center px-2 py-1 rounded text-sm font-medium"
                          style={{
                            backgroundColor: `hsla(45, 93%, 47%, 0.2)`,
                            color: COLORS.primary,
                          }}
                        >
                          Уровень {selectedCategory.STR_LEVEL}
                        </span>
                      </p>
                    </div>

                    <div>
                      <label
                        className="text-xs uppercase tracking-wider"
                        style={{ color: COLORS.mutedForeground }}
                      >
                        Путь
                      </label>
                      <div className="mt-2">
                        <CategoryBreadcrumb
                          category={selectedCategory}
                          categories={categoriesData}
                        />
                      </div>
                    </div>

                    {selectedCategory.STR_ID_PARENT && (
                      <div>
                        <label
                          className="text-xs uppercase tracking-wider"
                          style={{ color: COLORS.mutedForeground }}
                        >
                          Родительский ID
                        </label>
                        <p
                          className="font-mono mt-1"
                          style={{ color: COLORS.mutedForeground }}
                        >
                          {selectedCategory.STR_ID_PARENT}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div
                      style={{
                        width: "4rem",
                        height: "4rem",
                        backgroundColor: COLORS.secondary,
                        borderRadius: "9999px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 1rem",
                      }}
                    >
                      <Car
                        className="w-8 h-8"
                        style={{ color: COLORS.mutedForeground }}
                      />
                    </div>
                    <p style={{ color: COLORS.mutedForeground }}>
                      Выберите категорию для просмотра информации
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div
              style={{
                backgroundColor: COLORS.card,
                borderRadius: "0.75rem",
                border: `1px solid ${COLORS.border}`,
                overflow: "hidden",
                marginTop: "1rem",
              }}
            >
              <div
                style={{
                  backgroundColor: COLORS.secondary,
                  padding: "0.75rem 1rem",
                }}
              >
                <h2
                  className="font-semibold text-sm"
                  style={{ color: COLORS.foreground }}
                >
                  Статистика
                </h2>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p
                    className="text-2xl font-bold"
                    style={{ color: COLORS.primary }}
                  >
                    {categoriesData.filter((c) => c.STR_LEVEL === 1).length}
                  </p>
                  <p
                    className="text-xs uppercase tracking-wider"
                    style={{ color: COLORS.mutedForeground }}
                  >
                    Основных категорий
                  </p>
                </div>
                <div className="text-center">
                  <p
                    className="text-2xl font-bold"
                    style={{ color: COLORS.goldSoft }}
                  >
                    {categoriesData.length}
                  </p>
                  <p
                    className="text-xs uppercase tracking-wider"
                    style={{ color: COLORS.mutedForeground }}
                  >
                    Всего категорий
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Category;
