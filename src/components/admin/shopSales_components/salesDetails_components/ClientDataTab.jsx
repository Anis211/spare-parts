"use client";
import { Car, User, Phone, Mail, MapPin, FileText, Shield } from "lucide-react";
import { motion } from "framer-motion";

const clientData = {
  personal: {
    name: "Sarah Williams",
    phone: "+1 (555) 987-6543",
    email: "sarah.williams@email.com",
    address: "1234 Oak Street, Los Angeles, CA 90001",
  },
  vehicle: {
    vin: "WBA8E1C55JA765432",
    make: "BMW",
    model: "330i",
    year: 2018,
    color: "Alpine White",
    mileage: "67,450 mi",
    licensePlate: "7ABC123",
    engine: "2.0L Turbo I4",
    transmission: "8-Speed Automatic",
    driveType: "RWD",
    fuelType: "Premium Gasoline",
  },
  registration: {
    registrationDate: "Mar 15, 2023",
    expirationDate: "Mar 15, 2024",
    insuranceProvider: "Progressive",
    policyNumber: "PRO-2024-789456",
  },
  serviceHistory: {
    firstVisit: "Jan 10, 2023",
    totalVisits: 8,
    lastService: "Dec 10, 2025",
    totalSpent: "$1,245.50",
  },
};

export const ClientDataTab = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.7, type: "spring" }}
      className="space-y-6"
    >
      {/* Client Personal Info */}
      <section className="bg-[hsl(222_47%_9%)] border-1 border-[hsl(220_15%_18%)] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[hsl(36_100%_50%_/_10%)]">
            <User className="h-5 w-5 text-[hsl(36_100%_50%)]" />
          </div>
          <h2 className="text-2xl font-bold text-[hsl(220_10%_95%)]">
            Client Information
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[hsl(36_100%_50%_/_20%)] flex items-center justify-center text-[hsl(36_100%_50%)] font-bold text-2xl">
              SW
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[hsl(220_10%_95%)]">
                {clientData.personal.name}
              </h3>
              <p className="text-md text-[hsl(220_10%_55%)]">
                Valued Customer since 2023
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[hsl(220_10%_55%)]" />
              <span className="text-[hsl(220_10%_95%)]">
                {clientData.personal.phone}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[hsl(220_10%_55%)]" />
              <span className="text-[hsl(220_10%_95%)]">
                {clientData.personal.email}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-[hsl(220_10%_55%)]" />
              <span className="text-[hsl(220_10%_95%)]">
                {clientData.personal.address}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Information */}
      <section className="bg-[hsl(222_47%_9%)] border-1 border-[hsl(220_15%_18%)] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[hsl(36_100%_50%_/_10%)]">
            <Car className="h-5 w-5 text-[hsl(36_100%_50%)]" />
          </div>
          <h2 className="text-2xl font-bold text-[hsl(220_10%_95%)]">
            Vehicle Details
          </h2>
        </div>

        <div className="mb-6 p-4 rounded-lg bg-[hsl(220_15%_15%_/_50%)] border border-[hsl(36_100%_50%_/_20%)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-md text-[hsl(220_10%_55%)]">VIN Number</span>
          </div>
          <p className="text-xl font-mono font-semibold text-[hsl(36_100%_50%)] tracking-wider">
            {clientData.vehicle.vin}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-[hsl(220_10%_95%)] border-b border-[hsl(220_15%_18%)] pb-2">
              Basic Info
            </h4>
            <div className="space-y-3">
              <div>
                <span className="text-md text-[hsl(220_10%_55%)]">Make</span>
                <p className="font-medium text-[hsl(220_10%_95%)]">
                  {clientData.vehicle.make}
                </p>
              </div>
              <div>
                <span className="text-md text-[hsl(220_10%_55%)]">Model</span>
                <p className="font-medium text-[hsl(220_10%_95%)]">
                  {clientData.vehicle.model}
                </p>
              </div>
              <div>
                <span className="text-md text-[hsl(220_10%_55%)]">Year</span>
                <p className="font-medium text-[hsl(220_10%_95%)]">
                  {clientData.vehicle.year}
                </p>
              </div>
              <div>
                <span className="text-md text-[hsl(220_10%_55%)]">Color</span>
                <p className="font-medium text-[hsl(220_10%_95%)]">
                  {clientData.vehicle.color}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-[hsl(220_10%_95%)] border-b border-[hsl(220_15%_18%)] pb-2">
              Technical Specs
            </h4>
            <div className="space-y-3">
              <div>
                <span className="text-md text-[hsl(220_10%_55%)]">Engine</span>
                <p className="font-medium text-[hsl(220_10%_95%)]">
                  {clientData.vehicle.engine}
                </p>
              </div>
              <div>
                <span className="text-md text-[hsl(220_10%_55%)]">
                  Transmission
                </span>
                <p className="font-medium text-[hsl(220_10%_95%)]">
                  {clientData.vehicle.transmission}
                </p>
              </div>
              <div>
                <span className="text-md text-[hsl(220_10%_55%)]">
                  Drive Type
                </span>
                <p className="font-medium text-[hsl(220_10%_95%)]">
                  {clientData.vehicle.driveType}
                </p>
              </div>
              <div>
                <span className="text-md text-[hsl(220_10%_55%)]">
                  Fuel Type
                </span>
                <p className="font-medium text-[hsl(220_10%_95%)]">
                  {clientData.vehicle.fuelType}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-[hsl(220_10%_95%)] border-b border-[hsl(220_15%_18%)] pb-2">
              Status
            </h4>
            <div className="space-y-3">
              <div>
                <span className="text-md text-[hsl(220_10%_55%)]">
                  Current Mileage
                </span>
                <p className="font-medium text-[hsl(220_10%_95%)]">
                  {clientData.vehicle.mileage}
                </p>
              </div>
              <div>
                <span className="text-md text-[hsl(220_10%_55%)]">
                  License Plate
                </span>
                <p className="font-medium text-[hsl(220_10%_95%)]">
                  {clientData.vehicle.licensePlate}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration & Insurance */}
      <section className="bg-[hsl(222_47%_9%)] border-1 border-[hsl(220_15%_18%)] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[hsl(36_100%_50%_/_10%)]">
            <Shield className="h-5 w-5 text-[hsl(36_100%_50%)]" />
          </div>
          <h2 className="text-2xl font-bold text-[hsl(220_10%_95%)]">
            Registration & Insurance
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="text-md text-[hsl(220_10%_55%)]">
                Registration Date
              </span>
              <p className="font-medium text-[hsl(220_10%_95%)]">
                {clientData.registration.registrationDate}
              </p>
            </div>
            <div>
              <span className="text-md text-[hsl(220_10%_55%)]">
                Expiration Date
              </span>
              <p className="font-medium text-[hsl(220_10%_95%)]">
                {clientData.registration.expirationDate}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-md text-[hsl(220_10%_55%)]">
                Insurance Provider
              </span>
              <p className="font-medium text-[hsl(220_10%_95%)]">
                {clientData.registration.insuranceProvider}
              </p>
            </div>
            <div>
              <span className="text-md text-[hsl(220_10%_55%)]">
                Policy Number
              </span>
              <p className="font-medium text-[hsl(220_10%_95%)]">
                {clientData.registration.policyNumber}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service History Summary */}
      <section className="bg-[hsl(222_47%_9%)] border-1 border-[hsl(220_15%_18%)] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[hsl(36_100%_50%_/_10%)]">
            <FileText className="h-5 w-5 text-[hsl(36_100%_50%)]" />
          </div>
          <h2 className="text-xl font-semibold text-[hsl(220_10%_95%)]">
            Service History Summary
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[hsl(220_15%_15%_/_50%)] text-center">
            <p className="text-2xl font-bold text-[hsl(36_100%_50%)]">
              {clientData.serviceHistory.totalVisits}
            </p>
            <p className="text-md text-[hsl(220_10%_55%)]">Total Visits</p>
          </div>
          <div className="p-4 rounded-lg bg-[hsl(220_15%_15%_/_50%)] text-center">
            <p className="text-2xl font-bold text-[hsl(220_10%_95%)]">
              {clientData.serviceHistory.firstVisit}
            </p>
            <p className="text-md text-[hsl(220_10%_55%)]">First Visit</p>
          </div>
          <div className="p-4 rounded-lg bg-[hsl(220_15%_15%_/_50%)] text-center">
            <p className="text-2xl font-bold text-[hsl(220_10%_95%)]">
              {clientData.serviceHistory.lastService}
            </p>
            <p className="text-md text-[hsl(220_10%_55%)]">Last Service</p>
          </div>
          <div className="p-4 rounded-lg bg-[hsl(220_15%_15%_/_50%)] text-center">
            <p className="text-2xl font-bold text-[hsl(36_100%_50%)]">
              {clientData.serviceHistory.totalSpent}
            </p>
            <p className="text-md text-[hsl(220_10%_55%)]">Total Spent</p>
          </div>
        </div>
      </section>
    </motion.div>
  );
};
