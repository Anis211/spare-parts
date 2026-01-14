import { useState } from "react";
import { Button } from "@/components/auth/ui/button";
import { Input } from "@/components/auth/ui/input";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { OTPInput } from "@/components/auth/OTPInput";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const Auth = () => {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [step, setStep] = useState("form"); // "form" | "verify" | "success"
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isPhoneValid = phone.replace(/\D/g, "").length === 9;
  const isFormValid =
    mode === "signin" ? isPhoneValid : name.trim().length >= 2 && isPhoneValid;

  const handleSubmitForm = async () => {
    if (!isFormValid) return;
    setIsLoading(true);

    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "+998" + phone.replace(/\D/g, "") }),
    });
    const data = await res.json();
    console.log(data);

    setIsLoading(false);
    toast({
      title: "Verification code sent!",
      description: `A 6-digit code has been sent to +7 ${phone}`,
    });

    setStep("verify");
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);

    setStep("success");

    toast({
      title: "Phone verified!",
      description:
        mode === "signin" ? "Welcome back!" : "Your account has been created.",
    });
  };

  const handleBack = () => {
    if (step === "verify") {
      setStep("form");
      setOtp("");
    }
  };

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setName("");
    setPhone("");
    setOtp("");
    setStep("form");
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    toast({
      title: "Code resent!",
      description: `A new code has been sent to +1 ${phone}`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: "hsl(40 92% 55% / 0.05)" }}
        />
        <div
          className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: "hsl(168 76% 42% / 0.05)" }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div
          className="bg-[hsl(240_15%_8%)]/80 backdrop-blur-xl border border-[hsl(240_10%_18%)]/50 rounded-2xl p-8"
          style={{ boxShadow: "0 0 50px -10px hsl(40 92% 55% / 0.6)" }}
        >
          {step === "form" && (
            <>
              <div className="text-center mb-8">
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: "hsl(0 0% 98%)" }}
                >
                  {mode === "signin" ? "Welcome back" : "Create account"}
                </h2>
                <p style={{ color: "hsl(240 5% 55%)" }}>
                  {mode === "signin"
                    ? "Sign in with your phone number"
                    : "Enter your details to get started"}
                </p>
              </div>

              <div className="space-y-5">
                {mode === "signup" && (
                  <div className="space-y-2 flex flex-col gap-1">
                    <label
                      className="text-md font-medium"
                      style={{ color: "hsl(0 0% 98%)" }}
                    >
                      Full Name
                    </label>
                    <Input
                      type="text"
                      placeholder="John Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                )}

                <div className="space-y-2 flex flex-col gap-1">
                  <label
                    className="text-md font-medium"
                    style={{ color: "hsl(0 0% 98%)" }}
                  >
                    Phone Number
                  </label>
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  variant="glow"
                  size="lg"
                  className="w-full"
                  onClick={handleSubmitForm}
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={toggleMode}
                  className="text-sm transition-colors"
                  style={{
                    color: "hsl(240 5% 55%)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.color = "hsl(40 92% 55%)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.color = "hsl(240 5% 55%)")
                  }
                >
                  {mode === "signin"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </>
          )}

          {step === "verify" && (
            <>
              <button
                onClick={handleBack}
                className="flex items-center gap-2 mb-6 transition-colors"
                style={{
                  color: "hsl(240 5% 55%)",
                  cursor: "pointer",
                  display: "inline-flex",
                }}
                onMouseEnter={(e) => (e.target.style.color = "hsl(0 0% 98%)")}
                onMouseLeave={(e) => (e.target.style.color = "hsl(240 5% 55%)")}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div className="text-center mb-8">
                <div
                  className="inline-flex p-3 rounded-full border mb-4"
                  style={{
                    backgroundColor: "hsl(40 92% 55% / 0.1)",
                    borderColor: "hsl(40 92% 55% / 0.2)",
                  }}
                >
                  <Shield
                    className="h-8 w-8"
                    style={{ color: "hsl(40 92% 55%)" }}
                  />
                </div>
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: "hsl(0 0% 98%)" }}
                >
                  Verify your phone
                </h2>
                <p style={{ color: "hsl(240 5% 55%)" }}>
                  Enter the 6-digit code sent to
                  <br />
                  <span
                    className="font-medium"
                    style={{ color: "hsl(0 0% 98%)" }}
                  >
                    +7 {phone}
                  </span>
                </p>
              </div>

              <div className="space-y-6">
                <OTPInput value={otp} onChange={setOtp} disabled={isLoading} />

                <Button
                  variant="glow"
                  size="lg"
                  className="w-full"
                  onClick={handleVerifyOTP}
                  disabled={otp.length !== 6 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-sm transition-colors"
                    style={{
                      color: "hsl(240 5% 55%)",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    Didn't receive the code?{" "}
                    <span
                      className="font-medium"
                      style={{ color: "hsl(40 92% 55%)" }}
                    >
                      Resend
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <div
                className="inline-flex p-4 rounded-full border mb-6"
                style={{
                  backgroundColor: "hsl(168 76% 42% / 0.1)",
                  borderColor: "hsl(168 76% 42% / 0.2)",
                }}
              >
                <CheckCircle2
                  className="h-12 w-12"
                  style={{ color: "hsl(168 76% 42%)" }}
                />
              </div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: "hsl(0 0% 98%)" }}
              >
                {mode === "signin" ? "Welcome back!" : "Account created!"}
              </h2>
              <p className="mb-6" style={{ color: "hsl(240 5% 55%)" }}>
                {mode === "signin"
                  ? "You have successfully signed in."
                  : `Welcome aboard, ${name.split(" ")[0] || "there"}!`}
              </p>
              <Button
                variant="glow"
                size="lg"
                className="w-full"
                onClick={() => (window.location.href = "/")}
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: "hsl(240 5% 55%)" }}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </motion.div>
  );
};

export default Auth;
