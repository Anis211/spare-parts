import { Package, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/repair/ui/button";

export function PartsConfirmationPanel({
  parts,
  onConfirm,
  onCancel,
  onModify,
}) {
  const allInStock = parts.every((p) => p.inStock);
  const someOutOfStock = parts.some((p) => !p.inStock);

  return (
    <div
      className="w-full max-w-md rounded-xl overflow-hidden shadow-lg"
      style={{
        border: "1px solid hsl(220 15% 20%)",
        backgroundColor: "hsl(220 18% 12%)",
      }}
    >
      {/* Header */}
      <div
        className="p-4 border-b"
        style={{
          backgroundColor: "hsl(43 96% 56% / 0.1)",
          borderColor: "hsl(220 15% 20%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: "hsl(43 96% 56% / 0.2)",
            }}
          >
            <Package className="h-5 w-5" style={{ color: "hsl(43 96% 56%)" }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: "hsl(45 10% 95%)" }}>
              Parts Request
            </h3>
            <p className="text-sm" style={{ color: "hsl(220 10% 55%)" }}>
              {parts.length} item{parts.length !== 1 ? "s" : ""} requested
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Parts List */}
        <div className="space-y-2">
          {parts.map((part) => (
            <div
              key={part.id}
              className="flex items-start gap-3 rounded-lg p-3"
              style={{ backgroundColor: "hsl(220 15% 18% / 0.3)" }}
            >
              <div
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: part.inStock
                    ? "hsl(142 76% 36% / 0.2)"
                    : "hsl(45 100% 50% / 0.2)",
                }}
              >
                {part.inStock ? (
                  <Check
                    className="h-3 w-3"
                    style={{ color: "hsl(142 76% 36%)" }}
                  />
                ) : (
                  <AlertCircle
                    className="h-3 w-3"
                    style={{ color: "hsl(45 100% 50%)" }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "hsl(45 10% 95%)" }}
                    >
                      {part.name}
                    </p>
                    <p
                      className="text-xs font-mono"
                      style={{ color: "hsl(220 10% 55%)" }}
                    >
                      {part.partNumber}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: "hsl(220 15% 18%)",
                      color: "hsl(45 10% 95%)",
                    }}
                  >
                    x{part.quantity}
                  </span>
                </div>
                {!part.inStock && part.estimatedDelivery && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "hsl(45 100% 50%)" }}
                  >
                    Est. delivery: {part.estimatedDelivery}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Stock Status Notice */}
        {someOutOfStock && (
          <div
            className="flex items-center gap-2 rounded-lg p-3"
            style={{
              backgroundColor: "hsl(45 100% 50% / 0.1)",
              border: "1px solid hsl(45 100% 50% / 0.2)",
            }}
          >
            <AlertCircle
              className="h-4 w-4 shrink-0"
              style={{ color: "hsl(45 100% 50%)" }}
            />
            <p className="text-xs" style={{ color: "hsl(45 100% 50%)" }}>
              Some parts are not in stock and will need to be ordered
            </p>
          </div>
        )}

        {allInStock && (
          <div
            className="flex items-center gap-2 rounded-lg p-3"
            style={{
              backgroundColor: "hsl(142 76% 36% / 0.1)",
              border: "1px solid hsl(142 76% 36% / 0.2)",
            }}
          >
            <Check
              className="h-4 w-4 shrink-0"
              style={{ color: "hsl(142 76% 36%)" }}
            />
            <p className="text-xs" style={{ color: "hsl(142 76% 36%)" }}>
              All parts are in stock and ready for pickup
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={onConfirm}
            style={{
              backgroundColor: "hsl(43 96% 56%)",
              color: "hsl(220 20% 8%)",
              boxShadow: "0 0 20px hsl(43 96% 56% / 0.3)",
            }}
          >
            <Check className="h-4 w-4 mr-1" />
            Confirm Order
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onModify}
            style={{
              backgroundColor: "transparent",
              borderColor: "hsl(220 15% 20%)",
              color: "hsl(45 10% 95%)",
            }}
          >
            Modify
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            style={{
              backgroundColor: "transparent",
              color: "hsl(220 10% 55%)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "hsl(0 72% 51%)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "hsl(220 10% 55%)")
            }
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
