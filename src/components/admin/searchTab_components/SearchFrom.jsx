import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, X, Search, ScanText, ScanQrCode } from "lucide-react";
import { Button } from "@/components/admin/ui/search_button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/admin/ui/form";
import { Input } from "@/components/admin/ui/search_input";
import { toast } from "sonner";
import useUser from "@/zustand/user";

export default function SearchForm({
  results,
  setResults,
  setRecentSearches,
  setIsLoading,
}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [image, setImage] = useState(null);
  const [isByImage, setIsByImage] = useState(false);

  const vin = useUser((state) => state.vin);
  const setVin = useUser((state) => state.setVin);

  // ✅ Create schema dynamically
  const createFormSchema = (isByImage) => {
    return z.object({
      partName: isByImage
        ? z.string().trim().max(100, "Part name must be < 100 chars").optional()
        : z
            .string()
            .trim()
            .min(1, "Part name is required")
            .max(100, "Part name must be < 100 chars"),
      vinCode: z
        .string()
        .trim()
        .min(17, "VIN must be exactly 17 characters")
        .max(17, "VIN must be exactly 17 characters")
        .regex(/^[A-HJ-NPR-Z0-9]{17}$/i, "Invalid VIN format"),
      photo: isByImage
        ? z
            .instanceof(FileList)
            .refine((files) => files?.length > 0, "Image is required")
            .refine(
              (files) => files?.[0]?.size <= 5 * 1024 * 1024,
              "File must be < 5MB"
            )
            .refine(
              (files) => files?.[0]?.type.startsWith("image/"),
              "Only images allowed"
            )
        : z.any().optional(),
    });
  };

  // ✅ Memoize schema to avoid unnecessary re-renders
  const formSchema = useMemo(() => createFormSchema(isByImage), [isByImage]);

  // ✅ Initialize form with dynamic schema
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partName: "",
      vinCode: vin.length > 0 ? vin : "",
      photo: undefined,
    },
    shouldUnregister: false, // 👈 Critical for dynamic schemas
  });

  // ✅ Sync vin from Zustand
  useEffect(() => {
    form.setValue("vinCode", vin);
  }, [vin, form]);

  // ✅ Reset image-related state when mode changes
  useEffect(() => {
    setPreviewUrl(null);
    setFileName(null);
    setImage(null);
    form.setValue("photo", undefined);
    if (isByImage) {
      form.setValue("partName", ""); // Clear partName in image mode
    }
  }, [isByImage, form]);

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // Validation already in schema, but double-check for UX
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      form.setError("photo", { message: "File too large" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      form.setError("photo", { message: "Invalid file type" });
      return;
    }

    setFileName(file.name);
    setImage(file);

    // Update form state
    form.setValue("photo", files);
    form.clearErrors("photo");

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setPreviewUrl(null);
    setFileName(null);
    setImage(null);
    form.setValue("photo", undefined);
    form.clearErrors("photo");
  };

  const resetForm = () => {
    form.reset();
    removeImage();
  };

  const onSubmit = async (data) => {
    setIsLoading(true);

    const fileToDataURL = (file) =>
      new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });

    try {
      let partName = "";
      let imageUrls = [];

      if (isByImage) {
        const files = ([image] || []).flatMap((x) =>
          x instanceof FileList ? Array.from(x) : [x]
        );
        const imagesBase64 = await Promise.all(files.map(fileToDataURL));

        if (imagesBase64.length > 0) {
          const uploadRes = await fetch("/api/images/bulk-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ images: imagesBase64 }),
          });

          if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            throw new Error(
              `Image upload failed ${uploadRes.status}: ${errText}`
            );
          }

          const { urls } = await uploadRes.json();
          imageUrls = urls || [];
        }

        // Extract part name from image
        const resu = await fetch("/api/ai/image-resolver", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userImages: imagesBase64 }),
        });
        const partData = await resu.json();

        console.log("Image part Name: ", partData);
        partName = partData.partName || "";
      } else {
        partName = data.partName;
      }

      // Search
      const res = await fetch("/api/admin/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partName: partName,
          vin: data.vinCode.toUpperCase(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const result = await res.json();

      // Handle response (same as your original logic)
      if (result.answer != null) {
        // ... existing result handling ...
        setResults((prev) => {
          const existingIndex = prev.findIndex(
            (r) => r.user.part === result.answer.user.part
          );
          let newResults;
          if (existingIndex !== -1) {
            const withoutExisting = [
              ...prev.slice(0, existingIndex),
              ...prev.slice(existingIndex + 1),
            ];
            newResults = [result.answer, ...withoutExisting];
          } else {
            newResults = [result.answer, ...prev];
          }
          return newResults;
        });
      } else if (result.original && result.analogs) {
        // ... existing save & update logic ...
        if (
          results.length === 0 ||
          results[0]?.user?.vin !== data.vinCode.toUpperCase()
        ) {
          setRecentSearches((prev) => [
            ...prev,
            {
              vin: data.vinCode.toUpperCase(),
              title: result.original.name,
            },
          ]);

          form.setValue("vinCode", data.vinCode.toUpperCase());
          setVin(data.vinCode.toUpperCase());

          setResults(() => [
            {
              user: {
                part: partName,
                vin: data.vinCode.toUpperCase(),
                userImages: imageUrls,
              },
              items: { original: result.original, analogs: result.analogs },
            },
          ]);
        } else {
          setResults((prev) => [
            {
              user: {
                part: partName,
                vin: data.vinCode.toUpperCase(),
                userImages: imageUrls,
              },
              items: { original: result.original, analogs: result.analogs },
            },
            ...prev,
          ]);
        }

        // Save to DB
        await fetch("/api/admin/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              user: {
                part: partName,
                vin: data.vinCode.toUpperCase(),
                userImages: imageUrls,
              },
              items: { original: result.original, analogs: result.analogs },
            },
          }),
        });
      }

      toast.success("Part information submitted successfully!", {
        description: `${
          partName || data.partName
        } - VIN: ${data.vinCode.toUpperCase()}`,
      });
      resetForm();
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Search failed", {
        description: err.message || "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 mt-4">
      <div className="bg-[hsl(222_47%_9%)] rounded-lg p-1 flex flex-row gap-2 items-center justify-center font-inter font-medium text-md mx-5 w-[30%]">
        {[
          { title: "By Part Name", icon: ScanText, type: false },
          { title: "By Image", icon: ScanQrCode, type: true },
        ].map((item, index) => (
          <div
            key={index}
            className={`w-[50%] flex flex-row justify-center items-center gap-2 px-4 py-2 rounded-lg ${
              isByImage == item.type
                ? "bg-[hsl(45_100%_51%)]/85 text-black"
                : "text-[hsl(220_20%_70%)] hover:text-white"
            }`}
            onClick={() => setIsByImage(item.type)}
          >
            <item.icon className="w-6 h-6" />
            <p>{item.title}</p>
          </div>
        ))}
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="bg-[hsl(222_47%_9%)] rounded-lg px-4 py-2 flex items-center gap-3 mx-5">
            {!isByImage && (
              <FormField
                control={form.control}
                name="partName"
                render={({ field }) => (
                  <FormItem className="flex-1 space-y-0">
                    <FormControl>
                      <Input
                        placeholder="Part name or article..."
                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-10 text-white uppercase font-mono tracking-wider placeholder:text-white"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {!isByImage && <div className="h-8 w-[1px] bg-white" />}

            <FormField
              control={form.control}
              name="vinCode"
              render={({ field }) => (
                <FormItem className="flex-1 space-y-0">
                  <FormControl>
                    <Input
                      placeholder={vin.length > 0 ? vin : "VIN Code (17 chars)"}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-10 text-white uppercase font-mono tracking-wider placeholder:text-white"
                      maxLength={17}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="h-8 w-[1px] bg-white" />

            {isByImage && (
              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <div className="flex items-center gap-2">
                        {previewUrl ? (
                          // Primary colors replaced with hsl(45 100% 55%)
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(45_100%_55%)]/10 border border-[hsl(45_100%_55%)]/20">
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="w-8 h-8 object-cover rounded-full"
                            />
                            <button
                              type="button"
                              onClick={removeImage}
                              // Destructive colors replaced with hsl(0 84.2% 60.2%)
                              className="p-1 rounded-full hover:bg-[hsl(0_84.2%_60.2%)]/20 transition-colors"
                            >
                              <X className="w-4 h-4 text-[hsl(0_84.2%_60.2%)]" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer px-4 py-2 rounded-full bg-[hsl(220_35%_15%)]/50 hover:bg-[hsl(220_35%_15%)] transition-colors flex items-center gap-2">
                            <Upload className="w-4 h-4 text-[hsl(215_20.2%_65.1%)]" />
                            <span className="text-sm text-[hsl(215_20.2%_65.1%)] whitespace-nowrap">
                              Add Photo
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                handleFileChange(e);
                                field.onChange(e.target.files);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 rounded-full bg-[hsl(45_100%_55%)] hover:bg-[hsl(45_100%_55%)]/90 text-[hsl(220_40%_6%)] shadow-lg shadow-[hsl(45_100%_55%)]/20 transition-all duration-300"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>

          <div className="mt-2 px-6 space-y-1">
            <FormField
              control={form.control}
              name="partName"
              render={() => <FormMessage />}
            />
            <FormField
              control={form.control}
              name="vinCode"
              render={() => <FormMessage />}
            />
          </div>
        </form>
      </Form>
    </div>
  );
}
