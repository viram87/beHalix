import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Calendar, MapPin, Loader2, X, Upload } from "lucide-react";
import { api } from "@/lib/api";
import type { EventAddress, EventDetail } from "@/types/event";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MAX_IMAGES = 5;
const MAX_TAGS = 10;

const editEventSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200, "Max 200 characters"),
    description: z.string().max(2000).optional(),
    date: z.string().min(1, "Date and time is required"),
    assemblyTime: z.string().max(50).optional(),
    line1: z.string().min(1, "Address line 1 is required").max(100),
    line2: z.string().max(100).optional(),
    city: z.string().min(1, "City is required").max(50),
    state: z.string().min(1, "State is required").max(50),
    zipCode: z.string().min(1, "ZIP code is required").max(10),
    isWomenOnly: z.boolean(),
  })
  .refine(
    (data) => {
      const d = new Date(data.date);
      return !Number.isNaN(d.getTime());
    },
    { message: "Invalid date", path: ["date"] }
  );

type EditEventForm = z.infer<typeof editEventSchema>;

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [tagChips, setTagChips] = useState<string[]>([]);
  const [tagInputValue, setTagInputValue] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  const [existingImages, setExistingImages] = useState<EventDetail["images"]>([]);
  const [removedImagePublicIds, setRemovedImagePublicIds] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const newImagePreviewsRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<EditEventForm>({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      isWomenOnly: false,
      line2: "",
      description: "",
      assemblyTime: "",
    },
  });

  const isWomenOnly = watch("isWomenOnly");

  useEffect(() => {
    newImagePreviewsRef.current = newImagePreviews;
  }, [newImagePreviews]);

  useEffect(() => {
    return () => {
      newImagePreviewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const activeExistingImages = existingImages.filter(
    (img) => !removedImagePublicIds.includes(img.publicId)
  );
  const totalImageCount = activeExistingImages.length + newImageFiles.length;
  const remainingImageSlots = Math.max(0, MAX_IMAGES - totalImageCount);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<EventDetail>(`/events/${id}`)
      .then(({ data }) => {
        reset({
          title: data.title,
          description: data.description ?? "",
          date: new Date(data.timestamp).toISOString().slice(0, 16),
          assemblyTime: data.assemblyTime ?? "",
          line1: data.address.line1,
          line2: data.address.line2 ?? "",
          city: data.address.city,
          state: data.address.state,
          zipCode: data.address.zipCode,
          isWomenOnly: data.isWomenOnly ?? false,
        });

        setTagChips(data.tags ?? []);
        setExistingImages(data.images ?? []);
        setRemovedImagePublicIds([]);
        newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
        setNewImageFiles([]);
        setNewImagePreviews([]);
      })
      .catch(() => {
        toast.error("Failed to load event details");
        navigate("/events");
      })
      .finally(() => setLoading(false));
  }, [id, navigate, reset]);

  const toggleExistingImageRemoval = (publicId: string) => {
    setRemovedImagePublicIds((prev) =>
      prev.includes(publicId) ? prev.filter((idValue) => idValue !== publicId) : [...prev, publicId]
    );
  };

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;

    if (remainingImageSlots <= 0) {
      toast.error(`You can upload up to ${MAX_IMAGES} images`);
      return;
    }

    const toAdd = files.slice(0, remainingImageSlots);
    if (files.length > toAdd.length) {
      toast.error(`Only ${remainingImageSlots} image slot(s) left`);
    }

    setNewImageFiles((prev) => [...prev, ...toAdd]);
    setNewImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  async function onSubmit(data: EditEventForm) {
    if (!id) return;
    try {
      const address: EventAddress = {
        line1: data.line1,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
      };
      if (data.line2?.trim()) address.line2 = data.line2.trim();

      const formData = new FormData();
      formData.append("title", data.title.trim());
      formData.append("description", (data.description ?? "").trim());
      formData.append("timestamp", new Date(data.date).toISOString());
      formData.append("isWomenOnly", String(data.isWomenOnly));
      formData.append("address", JSON.stringify(address));
      formData.append("assemblyTime", (data.assemblyTime ?? "").trim());
      formData.append("tags", JSON.stringify(tagChips.slice(0, MAX_TAGS)));

      if (removedImagePublicIds.length > 0) {
        formData.append("removeImagePublicIds", JSON.stringify(removedImagePublicIds));
      }
      newImageFiles.forEach((file) => {
        formData.append("images", file);
      });

      await api.patch(`/events/${id}`, formData);

      toast.success("Event updated successfully");
      navigate(`/events/${id}`);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error ?? "Could not update event");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="container flex-1 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <AppHeader />
      <main className="container flex-1 py-8 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
            <Link to={`/events/${id}`} className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Cancel Editing
            </Link>
          </Button>
        </div>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
          <p className="text-muted-foreground">Update the details of your event.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-0 shadow-sm bg-card">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <CardTitle>Event Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 ml-0 md:ml-11">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Event Title <span className="text-destructive">*</span>
                </Label>
                <Input id="title" className="bg-muted/30 transition-colors" {...register("title")} />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="flex min-h-32 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors resize-y"
                  placeholder="What's the event about? Who should join?"
                  maxLength={2000}
                  {...register("description")}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-input bg-muted/50 px-4 py-3">
                <input
                  type="checkbox"
                  id="isWomenOnly"
                  checked={isWomenOnly}
                  onChange={(e) => setValue("isWomenOnly", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="isWomenOnly" className="text-base cursor-pointer">
                    Women only event
                  </Label>
                  <p className="text-xs text-muted-foreground">Visible and joinable only by female users.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-card">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <CardTitle>Date & Time</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2 ml-0 md:ml-11">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Start Date & Time <span className="text-destructive">*</span>
                </Label>
                <Input id="date" type="datetime-local" className="bg-muted/30 transition-colors" {...register("date")} />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="assemblyTime">Assembly Time (Optional)</Label>
                <Input
                  id="assemblyTime"
                  placeholder="e.g. 6:30 AM"
                  className="bg-muted/30 transition-colors"
                  {...register("assemblyTime")}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Tags</CardTitle>
              <CardDescription>Max {MAX_TAGS} tags.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div
                  className="flex flex-wrap items-center gap-2 min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring transition-colors"
                  onClick={() => tagInputRef.current?.focus()}
                >
                  {tagChips.map((tag, i) => (
                    <span key={`${tag}-${i}`} className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-2.5 py-1 text-sm font-medium">
                      {tag}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTagChips((prev) => prev.filter((_, j) => j !== i));
                        }}
                        className="rounded-full p-0.5 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-label={`Remove ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {tagChips.length < MAX_TAGS && (
                    <input
                      ref={tagInputRef}
                      type="text"
                      value={tagInputValue}
                      onChange={(e) => setTagInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const word = tagInputValue.trim();
                          if (word && !tagChips.includes(word)) {
                            setTagChips((prev) => [...prev, word].slice(0, MAX_TAGS));
                            setTagInputValue("");
                          } else if (word) {
                            setTagInputValue("");
                          }
                        }
                      }}
                      placeholder={tagChips.length === 0 ? "e.g. Running, Music, Outdoor" : "Add another..."}
                      className="flex-1 min-w-30 bg-transparent border-0 outline-none placeholder:text-muted-foreground py-0.5"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-card">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <Upload className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Images</CardTitle>
              </div>
              <CardDescription>
                Up to {MAX_IMAGES} images total. Current selection: {totalImageCount}/{MAX_IMAGES}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {existingImages.map((img) => {
                  const removed = removedImagePublicIds.includes(img.publicId);
                  return (
                    <div key={img.publicId} className="relative rounded-lg overflow-hidden border bg-muted/20 aspect-square">
                      <img
                        src={img.url}
                        alt="Event"
                        className={`h-full w-full object-cover transition ${removed ? "opacity-30 grayscale" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleExistingImageRemoval(img.publicId)}
                        className={`absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center ${removed ? "bg-emerald-600 text-white" : "bg-black/70 text-white"}`}
                        aria-label={removed ? "Undo remove image" : "Remove image"}
                      >
                        {removed ? "↺" : <X className="h-4 w-4" />}
                      </button>
                      {removed && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[11px] px-2 py-1 text-center">
                          Will be removed
                        </div>
                      )}
                    </div>
                  );
                })}

                {newImagePreviews.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative rounded-lg overflow-hidden border bg-muted/20 aspect-square">
                    <img src={url} alt="New upload" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center"
                      aria-label="Remove new image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[11px] px-2 py-1 text-center">
                      New image
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNewImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={remainingImageSlots <= 0}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add images
                </Button>
                <span className="text-xs text-muted-foreground">{remainingImageSlots} slot(s) left</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-card">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Location</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="line1">
                    Address line 1 <span className="text-destructive">*</span>
                  </Label>
                  <Input id="line1" className="transition-colors" {...register("line1")} />
                  {errors.line1?.message && <p className="text-sm text-destructive">{errors.line1.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="line2">Address line 2</Label>
                  <Input id="line2" className="transition-colors" {...register("line2")} />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input id="city" className="transition-colors" {...register("city")} />
                    {errors.city?.message && <p className="text-sm text-destructive">{errors.city.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">
                      State <span className="text-destructive">*</span>
                    </Label>
                    <Input id="state" className="transition-colors" {...register("state")} />
                    {errors.state?.message && <p className="text-sm text-destructive">{errors.state.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">
                      ZIP code <span className="text-destructive">*</span>
                    </Label>
                    <Input id="zipCode" className="transition-colors" {...register("zipCode")} />
                    {errors.zipCode?.message && <p className="text-sm text-destructive">{errors.zipCode.message}</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:items-center pt-4 pb-12">
            <Button type="button" variant="ghost" asChild>
              <Link to={`/events/${id}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-40" size="lg">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
