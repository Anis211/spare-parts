import { Input } from "@/components/auth/ui/input";
import { Phone } from "lucide-react";

export const PhoneInput = ({ value, onChange, disabled }) => {
  const formatPhoneNumber = (input) => {
    const cleaned = input.replace(/\D/g, "");
    const limited = cleaned.slice(0, 10);

    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    } else {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(
        6
      )}`;
    }
  };

  const handleChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange(formatted);
  };

  return (
    <div className="relative">
      <div
        className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm font-medium"
        style={{ color: "hsl(240 5% 55%)" }} // ← text-muted-foreground
      >
        <Phone className="h-4 w-4" />
        <span>+7</span>
      </div>
      <Input
        type="tel"
        placeholder="(555) 123-4567"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="pl-20"
      />
    </div>
  );
};
