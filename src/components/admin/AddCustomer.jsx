"use client";
import { useState } from "react";
import { UserPlus, Phone, User, Car, Save } from "lucide-react";
import { Button } from "@/components/admin/ui/customers/button";
import { Input } from "@/components/admin/ui/customers/input";
import { useToast } from "@/hooks/use-toast";
import { useCRM } from "@/hooks/CRMContext";
import { motion } from "framer-motion";

export const AddCustomer = ({ setActiveTab }) => {
  const { toast } = useToast();
  const { addRecord } = useCRM();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    vin: "",
    make: "",
    model: "",
    year: "",
    notes: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in customer name and phone number.",
        variant: "destructive",
      });
      return;
    }

    addRecord({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      vin: formData.vin.trim() || "N/A",
      make: formData.make.trim() || "Unknown",
      model: formData.model.trim() || "Unknown",
      year: parseInt(formData.year) || new Date().getFullYear(),
      vehicleNotes: formData.notes.trim(),
    });

    toast({
      title: "Customer added successfully!",
      description: `${formData.name} has been added to the system.`,
    });

    setActiveTab("CRM");
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, type: "spring" }}
      className="p-8 max-w-3xl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <UserPlus className="w-8 h-8 text-[hsl(43_96%_56%)]" />
        <h1 className="text-2xl font-bold text-[hsl(40_20%_95%)]">
          Add CRM Record
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer Info */}
        <div
          className="glass-card rounded-xl p-6 animate-slide-up"
          style={{
            background: "hsl(222 40% 9%)",
            border: "1px solid hsl(222 30% 18%)",
            boxShadow: "0 4px 24px hsl(222 47% 4% / 0.5)",
          }}
        >
          <h2
            className="text-lg font-semibold mb-4 flex items-center gap-2"
            style={{ color: "hsl(40 20% 95%)" }}
          >
            <User className="w-5 h-5 text-[hsl(43_96%_56%)]" />
            Customer Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="text-sm font-medium mb-2 block"
                style={{ color: "hsl(40 20% 95%)" }}
              >
                Full Name *
              </label>
              <Input
                placeholder="John Smith"
                value={formData.name}
                onChange={handleChange("name")}
                className="bg-[hsl(222_47%_6%)] border-[hsl(222_30%_18%)] text-[hsl(40_20%_95%)] placeholder:text-[hsl(220_15%_55%)]"
              />
            </div>
            <div>
              <label
                className="text-sm font-medium mb-2 block"
                style={{ color: "hsl(40 20% 95%)" }}
              >
                Phone Number *
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "hsl(220 15% 55%)" }}
                />
                <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange("phone")}
                  className="pl-10 bg-[hsl(222_47%_6%)] border-[hsl(222_30%_18%)] text-[hsl(40_20%_95%)] placeholder:text-[hsl(220_15%_55%)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        <div
          className="glass-card rounded-xl p-6 animate-slide-up"
          style={{
            background: "hsl(222 40% 9%)",
            border: "1px solid hsl(222 30% 18%)",
            boxShadow: "0 4px 24px hsl(222 47% 4% / 0.5)",
            animationDelay: "100ms",
          }}
        >
          <h2
            className="text-lg font-semibold mb-4 flex items-center gap-2"
            style={{ color: "hsl(40 20% 95%)" }}
          >
            <Car className="w-5 h-5 text-[hsl(43_96%_56%)]" />
            Vehicle Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label
                className="text-sm font-medium mb-2 block"
                style={{ color: "hsl(40 20% 95%)" }}
              >
                VIN Number
              </label>
              <Input
                placeholder="1HGBH41JXMN109186"
                value={formData.vin}
                onChange={handleChange("vin")}
                className="font-mono bg-[hsl(222_47%_6%)] border-[hsl(222_30%_18%)] text-[hsl(40_20%_95%)] placeholder:text-[hsl(220_15%_55%)]"
              />
            </div>
            <div>
              <label
                className="text-sm font-medium mb-2 block"
                style={{ color: "hsl(40 20% 95%)" }}
              >
                Make
              </label>
              <Input
                placeholder="Honda"
                value={formData.make}
                onChange={handleChange("make")}
                className="bg-[hsl(222_47%_6%)] border-[hsl(222_30%_18%)] text-[hsl(40_20%_95%)] placeholder:text-[hsl(220_15%_55%)]"
              />
            </div>
            <div>
              <label
                className="text-sm font-medium mb-2 block"
                style={{ color: "hsl(40 20% 95%)" }}
              >
                Model
              </label>
              <Input
                placeholder="Accord"
                value={formData.model}
                onChange={handleChange("model")}
                className="bg-[hsl(222_47%_6%)] border-[hsl(222_30%_18%)] text-[hsl(40_20%_95%)] placeholder:text-[hsl(220_15%_55%)]"
              />
            </div>
            <div>
              <label
                className="text-sm font-medium mb-2 block"
                style={{ color: "hsl(40 20% 95%)" }}
              >
                Year
              </label>
              <Input
                type="number"
                placeholder="2023"
                value={formData.year}
                onChange={handleChange("year")}
                className="bg-[hsl(222_47%_6%)] border-[hsl(222_30%_18%)] text-[hsl(40_20%_95%)] placeholder:text-[hsl(220_15%_55%)]"
              />
            </div>
          </div>

          <div>
            <label
              className="text-sm font-medium mb-2 block"
              style={{ color: "hsl(40 20% 95%)" }}
            >
              Vehicle Notes
            </label>
            <textarea
              className="flex min-h-[100px] w-full rounded-lg resize-none"
              style={{
                backgroundColor: "hsl(222 47% 6%)",
                border: "1px solid hsl(222 30% 18%)",
                color: "hsl(40 20% 95%)",
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
                fontFamily: "inherit",
                WebkitAppearance: "none",
                MozAppearance: "none",
                appearance: "none",
              }}
              placeholder="Any special notes about this vehicle..."
              value={formData.notes}
              onChange={handleChange("notes")}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="bg-[hsl(43_96%_56%)] hover:bg-[hsl(43_96%_50%)] text-[hsl(222_47%_6%)]"
          >
            <Save className="w-4 h-4" />
            Save Record
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default AddCustomer;
