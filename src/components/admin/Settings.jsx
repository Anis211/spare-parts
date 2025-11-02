import { Settings as SettingsIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/admin/ui/card";
import { Label } from "@/components/admin/ui/label";
import { Input } from "@/components/admin/ui/input";
import { Button } from "@/components/admin/ui/button";

const Setting = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-[hsl(45_100%_51%)]/10 flex items-center justify-center">
          <SettingsIcon className="h-6 w-6 text-[hsl(45_100%_51%)]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[hsl(45_100%_95%)]">
            Settings
          </h1>
          <p className="text-[hsl(220_20%_70%)]">
            Manage your shop preferences
          </p>
        </div>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Shop Information</CardTitle>
            <CardDescription>
              Update your spare parts shop details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div>
                <Label htmlFor="shopName">Shop Name</Label>
              </div>
              <Input id="shopName" defaultValue="SpareParts" />
            </div>
            <div className="space-y-2">
              <div>
                <Label htmlFor="email">Contact Email</Label>
              </div>
              <Input
                id="email"
                type="email"
                defaultValue="admin@spareparts.com"
              />
            </div>
            <div className="space-y-2">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
              </div>
              <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
            </div>
            <Button className="bg-[hsl(45_100%_51%)] hover:bg-[hsl(45_100%_51%)]/90">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Settings</CardTitle>
            <CardDescription>Configure delivery options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div>
                <Label htmlFor="deliveryFee">Standard Delivery Fee</Label>
              </div>
              <Input id="deliveryFee" type="number" defaultValue="5.99" />
            </div>
            <div className="space-y-2">
              <div>
                <Label htmlFor="freeThreshold">Free Delivery Threshold</Label>
              </div>
              <Input id="freeThreshold" type="number" defaultValue="50.00" />
            </div>
            <Button className="bg-[hsl(45_100%_51%)] hover:bg-[hsl(45_100%_51%)]/90">
              Update Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Setting;
