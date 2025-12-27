"use client";
import { useState, useRef, useEffect } from "react";
import { Car, User, Wrench, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/admin/ui/sales/button";
import { Input } from "@/components/admin/ui/sales/input";
import { Textarea } from "@/components/admin/ui/sales/textarea";
import { Label } from "@/components/admin/ui/sales/label";
import { Badge } from "@/components/admin/ui/sales/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ui/sales/select";
import { Separator } from "@/components/admin/ui/sales/separator";
import { ScrollArea } from "@/components/admin/ui/sales/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/sales/dialog";
import { motion } from "framer-motion";

// Mock data
const workers = [
  { id: "w1", name: "Mike Johnson" },
  { id: "w2", name: "Alex Rodriguez" },
  { id: "w3", name: "Carlos Martinez" },
];

const commonRepairs = [
  "Oil Change",
  "Brake Pads",
  "Tire Rotation",
  "Engine Diagnostics",
  "Spark Plugs",
  "Air Filter",
  "Transmission Fluid",
  "Coolant Flush",
  "Battery Replacement",
  "AC Repair",
  "Wheel Alignment",
  "Suspension Check",
];

export function NewOrderDialog({ open, onOpenChange, onSubmit }) {
  const [formData, setFormData] = useState({
    vin: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: new Date().getFullYear(),
    mileage: "",
    workerName: "",
    notes: "",
  });

  const [selectedRepairs, setSelectedRepairs] = useState([]);
  const [customRepair, setCustomRepair] = useState("");
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);

  const validate = () => {
    const newErrors = {};

    if (!formData.vin || formData.vin.length !== 17) {
      newErrors.vin = "VIN must be 17 characters";
    }
    if (!formData.clientName || formData.clientName.trim().length < 2) {
      newErrors.clientName = "Name is required";
    }
    if (
      !formData.clientPhone ||
      formData.clientPhone.replace(/\D/g, "").length < 10
    ) {
      newErrors.clientPhone = "Valid phone number required";
    }
    if (formData.clientEmail && !/\S+@\S+\.\S+/.test(formData.clientEmail)) {
      newErrors.clientEmail = "Invalid email";
    }
    if (!formData.vehicleMake) newErrors.vehicleMake = "Make is required";
    if (!formData.vehicleModel) newErrors.vehicleModel = "Model is required";
    if (
      !formData.vehicleYear ||
      formData.vehicleYear < 1900 ||
      formData.vehicleYear > 2030
    ) {
      newErrors.vehicleYear = "Year must be between 1900–2030";
    }
    if (formData.mileage && (isNaN(formData.mileage) || formData.mileage < 0)) {
      newErrors.mileage = "Invalid mileage";
    }
    if (!formData.workerName) newErrors.workerName = "Worker is required";

    return newErrors;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);

    if (selectedRepairs.length === 0) {
      alert("Please select at least one repair work");
      return;
    }

    if (Object.keys(newErrors).length === 0) {
      onSubmit({
        ...formData,
        vehicleYear: Number(formData.vehicleYear),
        mileage: formData.mileage ? Number(formData.mileage) : undefined,
        repairWorks: selectedRepairs,
      });

      // Reset
      setFormData({
        vin: "",
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        vehicleMake: "",
        vehicleModel: "",
        vehicleYear: new Date().getFullYear(),
        mileage: "",
        workerName: "",
        notes: "",
      });
      setSelectedRepairs([]);
      setCustomRepair("");
      onOpenChange(false);
    }
  };

  const toggleRepair = (repair) => {
    if (selectedRepairs.includes(repair)) {
      setSelectedRepairs(selectedRepairs.filter((r) => r !== repair));
    } else {
      setSelectedRepairs([...selectedRepairs, repair]);
    }
  };

  const addCustomRepair = () => {
    const trimmed = customRepair.trim();
    if (trimmed && !selectedRepairs.includes(trimmed)) {
      setSelectedRepairs([...selectedRepairs, trimmed]);
      setCustomRepair("");
    }
  };

  useEffect(() => {
    if (!open) {
      setErrors({});
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden bg-[hsl(222_47%_9%)] border-[hsl(222_30%_18%)]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[hsl(222_30%_18%)]">
          <DialogTitle className="text-xl font-bold text-[hsl(40_15%_95%)] flex items-center gap-2">
            <Car className="h-5 w-5 text-[hsl(40_95%_55%)]" />
            New Repair Order
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} ref={formRef} className="p-6 space-y-6">
            {/* Vehicle Info */}
            <div>
              <h3 className="text-sm font-semibold text-[hsl(220_15%_55%)] mb-4 flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehicle Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-[hsl(40_15%_95%)] mb-1.5 block">
                    VIN Number
                  </Label>
                  <Input
                    value={formData.vin}
                    onChange={(e) =>
                      handleChange("vin", e.target.value.toUpperCase())
                    }
                    placeholder="Enter 17-character VIN"
                    className="font-mono bg-[hsl(222_30%_15%)] border-[hsl(222_30%_18%)] text-[hsl(40_15%_95%)]"
                    maxLength={17}
                  />
                  {errors.vin && (
                    <p className="text-[hsl(0_72%_51%)] text-xs mt-1">
                      {errors.vin}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-[hsl(40_15%_95%)] mb-1.5 block">
                    Make
                  </Label>
                  <Input
                    value={formData.vehicleMake}
                    onChange={(e) =>
                      handleChange("vehicleMake", e.target.value)
                    }
                    placeholder="e.g., Toyota"
                    className="bg-[hsl(222_30%_15%)] border-[hsl(222_30%_18%)] text-[hsl(40_15%_95%)]"
                  />
                  {errors.vehicleMake && (
                    <p className="text-[hsl(0_72%_51%)] text-xs mt-1">
                      {errors.vehicleMake}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-[hsl(40_15%_95%)] mb-1.5 block">
                    Model
                  </Label>
                  <Input
                    value={formData.vehicleModel}
                    onChange={(e) =>
                      handleChange("vehicleModel", e.target.value)
                    }
                    placeholder="e.g., Camry"
                    className="bg-[hsl(222_30%_15%)] border-[hsl(222_30%_18%)] text-[hsl(40_15%_95%)]"
                  />
                  {errors.vehicleModel && (
                    <p className="text-[hsl(0_72%_51%)] text-xs mt-1">
                      {errors.vehicleModel}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-[hsl(40_15%_95%)] mb-1.5 block">
                    Year
                  </Label>
                  <Input
                    type="number"
                    value={formData.vehicleYear}
                    onChange={(e) =>
                      handleChange("vehicleYear", e.target.value)
                    }
                    placeholder="2024"
                    className="bg-[hsl(222_30%_15%)] border-[hsl(222_30%_18%)] text-[hsl(40_15%_95%)]"
                  />
                  {errors.vehicleYear && (
                    <p className="text-[hsl(0_72%_51%)] text-xs mt-1">
                      {errors.vehicleYear}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-[hsl(40_15%_95%)] mb-1.5 block">
                    Mileage
                  </Label>
                  <Input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => handleChange("mileage", e.target.value)}
                    placeholder="Current mileage"
                    className="bg-[hsl(222_30%_15%)] border-[hsl(222_30%_18%)] text-[hsl(40_15%_95%)]"
                  />
                  {errors.mileage && (
                    <p className="text-[hsl(0_72%_51%)] text-xs mt-1">
                      {errors.mileage}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator className="bg-[hsl(222_30%_18%)]" />

            {/* Client Info */}
            <div>
              <h3 className="text-sm font-semibold text-[hsl(220_15%_55%)] mb-4 flex items-center gap-2">
                <User className="h-4 w-4" />
                Client Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[hsl(40_15%_95%)] mb-1.5 block">
                    Full Name
                  </Label>
                  <Input
                    value={formData.clientName}
                    onChange={(e) => handleChange("clientName", e.target.value)}
                    placeholder="Client name"
                    className="bg-[hsl(222_30%_15%)] border-[hsl(222_30%_18%)] text-[hsl(40_15%_95%)]"
                  />
                  {errors.clientName && (
                    <p className="text-[hsl(0_72%_51%)] text-xs mt-1">
                      {errors.clientName}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-[hsl(40_15%_95%)] mb-1.5 block">
                    Phone Number
                  </Label>
                  <Input
                    value={formData.clientPhone}
                    onChange={(e) =>
                      handleChange("clientPhone", e.target.value)
                    }
                    placeholder="+1 (555) 123-4567"
                    className="bg-[hsl(222_30%_15%)] border-[hsl(222_30%_18%)] text-[hsl(40_15%_95%)]"
                  />
                  {errors.clientPhone && (
                    <p className="text-[hsl(0_72%_51%)] text-xs mt-1">
                      {errors.clientPhone}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[hsl(40_15%_95%)] mb-1.5 block">
                    Email (Optional)
                  </Label>
                  <Input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) =>
                      handleChange("clientEmail", e.target.value)
                    }
                    placeholder="client@email.com"
                    className="bg-[hsl(222_30%_15%)] border-[hsl(222_30%_18%)] text-[hsl(40_15%_95%)]"
                  />
                  {errors.clientEmail && (
                    <p className="text-[hsl(0_72%_51%)] text-xs mt-1">
                      {errors.clientEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator className="bg-[hsl(222_30%_18%)]" />

            {/* Worker */}
            <div>
              <h3 className="text-sm font-semibold text-[hsl(220_15%_55%)] mb-4 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Assign Worker
              </h3>
              <Label className="text-[hsl(40_15%_95%)] mb-1.5 block">
                Technician
              </Label>
              <Select
                value={formData.workerName}
                onValueChange={(value) => handleChange("workerName", value)}
              >
                <SelectTrigger className="bg-[hsl(222_30%_15%)] border-[hsl(222_30%_18%)] text-[hsl(40_15%_95%)]">
                  <SelectValue placeholder="Select a technician" />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(222_47%_9%)] border-[hsl(222_30%_18%)]">
                  {workers.map((worker) => (
                    <SelectItem
                      key={worker.id}
                      value={worker.name}
                      className="text-[hsl(40_15%_95%)] focus:bg-[hsl(222_30%_12%)]"
                    >
                      {worker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.workerName && (
                <p className="text-[hsl(0_72%_51%)] text-xs mt-1">
                  {errors.workerName}
                </p>
              )}
            </div>

            <Separator className="bg-[hsl(222_30%_18%)]" />

            {/* Repair Works */}
            <div>
              <h3 className="text-sm font-semibold text-[hsl(220_15%_55%)] mb-4 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Repair Works
              </h3>

              {/* Selected */}
              {selectedRepairs.length > 0 && (
                <div className="mb-4">
                  <Label className="text-xs text-[hsl(220_15%_55%)] mb-2 block">
                    Selected ({selectedRepairs.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRepairs.map((repair) => (
                      <Badge
                        key={repair}
                        variant="secondary"
                        className="bg-[hsl(40_95%_55%)]/20 text-[hsl(40_95%_55%)] border-[hsl(40_95%_55%)]/30 gap-1 pr-1"
                      >
                        {repair}
                        <button
                          type="button"
                          onClick={() => toggleRepair(repair)}
                          className="ml-1 rounded-full hover:bg-[hsl(40_95%_55%)]/20 p-0.5"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Common */}
              <div className="mb-4">
                <Label className="text-xs text-[hsl(220_15%_55%)] mb-2 block">
                  Common Repairs
                </Label>
                <div className="flex flex-wrap gap-2">
                  {commonRepairs.map((repair) => (
                    <Badge
                      key={repair}
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-colors border-[hsl(222_30%_18%)]",
                        selectedRepairs.includes(repair)
                          ? "bg-[hsl(40_95%_55%)]/20 text-[hsl(40_95%_55%)] border-[hsl(40_95%_55%)]/30"
                          : "bg-[hsl(222_30%_15%)] text-[hsl(40_15%_95%)] hover:border-[hsl(40_95%_55%)]/50"
                      )}
                      onClick={() => toggleRepair(repair)}
                    >
                      {repair}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Custom */}
              <div className="flex gap-2">
                <Input
                  value={customRepair}
                  onChange={(e) => setCustomRepair(e.target.value)}
                  placeholder="Add custom repair work..."
                  className="bg-[hsl(222_30%_15%)] border-[hsl(222_30%_18%)] text-[hsl(40_15%_95%)]"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addCustomRepair())
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomRepair}
                  className="border-[hsl(222_30%_18%)] hover:bg-[hsl(222_30%_15%)]"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {selectedRepairs.length === 0 && (
                <p className="text-xs text-[hsl(0_72%_51%)] mt-2">
                  Please select at least one repair work
                </p>
              )}
            </div>

            <Separator className="bg-[hsl(222_30%_18%)]" />

            {/* Notes */}
            <div>
              <Label className="text-[hsl(40_15%_95%)] mb-1.5 block">
                Notes (Optional)
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Additional notes about the repair..."
                className="bg-[hsl(222_30%_15%)] border-[hsl(222_30%_18%)] text-[hsl(40_15%_95%)] min-h-[80px]"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 border-[hsl(222_30%_18%)] hover:bg-[hsl(222_30%_15%)]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[hsl(40_95%_55%)] text-[hsl(222_47%_6%)] hover:bg-[hsl(40_95%_55%)]/90"
                disabled={selectedRepairs.length === 0}
              >
                Create Order
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
