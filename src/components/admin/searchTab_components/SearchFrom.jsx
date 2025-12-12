import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, X, Search } from "lucide-react";
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
import { useEffect } from "react";

const formSchema = z.object({
  partName: z
    .string()
    .trim()
    .min(1, "Part name is required")
    .max(100, "Part name must be less than 100 characters"),
  vinCode: z
    .string()
    .trim()
    .min(17, "VIN must be exactly 17 characters")
    .max(17, "VIN must be exactly 17 characters")
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/i, "Invalid VIN format"),
  photo: z.any().optional(),
});

export default function SearchForm({ setResults, setIsLoading }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [image, setImage] = useState(null);
  const vin = useUser((state) => state.vin);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partName: "",
      vinCode: vin.length > 0 ? vin : "",
    },
  });

  useEffect(() => {
    form.setValue("vinCode", vin);
  }, [vin]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Only image files are allowed");
        return;
      }

      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }

    setImage(file);
  };

  const removeImage = () => {
    setPreviewUrl(null);
    setFileName(null);
    form.setValue("photo", undefined);
  };

  const resetForm = () => {
    form.reset();
  };

  const onSubmit = async (data) => {
    let imagesBase64 = image;
    setIsLoading(true);

    try {
      let imageUrls = [];
      if (imagesBase64 != null) {
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

      const res = await fetch("/api/admin/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partName: data.partName,
          vin: data.vinCode.toUpperCase(),
          userImages: imageUrls,
        }),
      });
      const result = await res.json();

      if (result.answer != undefined) {
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
      } else {
        setResults((prev) => [
          {
            user: {
              part: data.partName,
              vin: data.vinCode.toUpperCase(),
              userImages: imageUrls,
            },
            items: { original: result.original, analogs: result.analogs },
          },
          ...prev,
        ]);

        const answer = await fetch("/api/admin/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              user: {
                part: data.partName,
                vin: data.vinCode.toUpperCase(),
                userImages: imageUrls,
              },
              items: { original: result.original, analogs: result.analogs },
            },
          }),
        });

        const saveResult = await answer.json();
        console.log("Save Result: ", saveResult);
      }

      toast.success("Part information submitted successfully!", {
        description: `${data.partName} - VIN: ${data.vinCode.toUpperCase()}`,
      });
    } catch (err) {
      console.error("Error Message: ", err.message);

      resetForm();
      setIsLoading(false);
    } finally {
      resetForm();
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="glass-card rounded-full ring-1 ring-white px-6 py-3 flex items-center gap-3 mt-4 mx-5">
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

            <div className="h-8 w-[1px] bg-white" />

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
