import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  X,
  Calendar,
  MapPin,
  ImageIcon,
  Tag,
} from "lucide-react";
import { api } from "@/lib/api";
import type { EventAddress } from "@/types/event";
import type { CommunityListItem } from "@/types/community";
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
const createEventSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Max 200 characters"),
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
      return d.getTime() > Date.now();
    },
    { message: "Event must be in the future", path: ["date"] },
  );

type CreateEventForm = z.infer<typeof createEventSchema>;

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [communities, setCommunities] = useState<CommunityListItem[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [tagChips, setTagChips] = useState<string[]>([]);
  const [tagInputValue, setTagInputValue] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get<{ communities: CommunityListItem[] }>("/communities")
      .then(({ data }) => {
        setCommunities(data.communities ?? []);
        const fromUrl = searchParams.get("communityId");
        if (
          fromUrl &&
          (data.communities ?? []).some((c) => c._id === fromUrl)
        ) {
          setSelectedCommunityId(fromUrl);
        }
      });
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      isWomenOnly: false,
      line2: "",
      description: "",
    },
  });

  const isWomenOnly = watch("isWomenOnly");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES - imageFiles.length;
    const toAdd = files.slice(0, remaining);
    if (toAdd.length === 0) return;

    const newFiles = [...imageFiles, ...toAdd];
    setImageFiles(newFiles);

    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length === 0) return;
    const remaining = MAX_IMAGES - imageFiles.length;
    const toAdd = files.slice(0, remaining);
    if (toAdd.length === 0) return;
    setImageFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [
      ...prev,
      ...toAdd.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  async function onSubmit(data: CreateEventForm) {
    try {
      const address: EventAddress = {
        line1: data.line1,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
      };
      if (data.line2?.trim()) address.line2 = data.line2.trim();

      const formData = new FormData();
      formData.append("title", data.title);
      if (data.description?.trim())
        formData.append("description", data.description.trim());
      formData.append("timestamp", new Date(data.date).toISOString());
      formData.append("isWomenOnly", String(data.isWomenOnly));
      formData.append("address", JSON.stringify(address));
      if (selectedCommunityId)
        formData.append("communityId", selectedCommunityId);
      if (data.assemblyTime?.trim())
        formData.append("assemblyTime", data.assemblyTime.trim());
      const tagList = tagChips.slice(0, MAX_TAGS);
      if (tagList.length > 0) formData.append("tags", JSON.stringify(tagList));

      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      const { data: event } = await api.post<{ _id: string; id?: string }>(
        "/events",
        formData,
      );

      toast.success("Event created successfully");
      navigate(`/events/${event.id ?? event._id}`);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error ?? "Could not create event");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <AppHeader />
      <main className="container flex-1 py-8 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-2 text-muted-foreground"
          >
            <Link to="/events" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to events
            </Link>
          </Button>
        </div>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Create event</h1>
          <p className="text-muted-foreground">
            Fill in the details below to host your community event.
          </p>
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
              <CardDescription className="ml-11">
                Name, description, and community association.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 ml-0 md:ml-11">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Event Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Sunday Morning Run, Tech Talk"
                  className="bg-muted/30 transition-colors"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {communities.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="community">Post to Community</Label>
                  <select
                    id="community"
                    className="flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={selectedCommunityId}
                    onChange={(e) => setSelectedCommunityId(e.target.value)}
                  >
                    <option value="">No community (Public)</option>
                    {communities.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="flex min-h-32 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors resize-y"
                  placeholder="What's the event about? Who should join?"
                  maxLength={2000}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
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
                  <Label
                    htmlFor="isWomenOnly"
                    className="text-base cursor-pointer"
                  >
                    Women only event
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Visible and joinable only by female users.
                  </p>
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
              <CardDescription className="ml-11">
                When is it happening?
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2 ml-0 md:ml-11">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Start Date & Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="datetime-local"
                  className="bg-muted/30 transition-colors"
                  bar-code="disabled" // hack to prevent some browser extensions
                  {...register("date")}
                  min={new Date().toISOString().slice(0, 16)}
                />
                {errors.date && (
                  <p className="text-sm text-destructive">
                    {errors.date.message}
                  </p>
                )}
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
              <CardDescription>
                Type a word and press Enter to add. Click × on a chip to remove.
                Max {MAX_TAGS} tags.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div
                  className="flex flex-wrap items-center gap-2 min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring transition-colors"
                  onClick={() => tagInputRef.current?.focus()}
                >
                  {tagChips.map((tag, i) => (
                    <span
                      key={`${tag}-${i}`}
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-2.5 py-1 text-sm font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTagChips((prev) =>
                            prev.filter((_, j) => j !== i),
                          );
                        }}
                        className="rounded-full p-0.5 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-label={`Remove ${tag}`}
                      >
                        <X className="h-3.5 w-3.5" />
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
                            setTagChips((prev) =>
                              [...prev, word].slice(0, MAX_TAGS),
                            );
                            setTagInputValue("");
                          } else if (word) {
                            setTagInputValue("");
                          }
                        }
                      }}
                      placeholder={
                        tagChips.length === 0
                          ? "e.g. Running, Music, Outdoor — press Enter to add"
                          : "Add another…"
                      }
                      className="flex-1 min-w-[120px] bg-transparent border-0 outline-none placeholder:text-muted-foreground py-0.5"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-card">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Location</CardTitle>
              </div>
              <CardDescription className="ml-11">Where the event takes place.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="line1">Address line 1 <span className="text-destructive">*</span></Label>
                    <Input
                      id="line1"
                      placeholder="Street, building, venue"
                      className="transition-colors"
                      {...register("line1")}
                    />
                    {errors.line1?.message && <p className="text-sm text-destructive">{errors.line1.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="line2">Address line 2</Label>
                    <Input
                      id="line2"
                      placeholder="Apt, suite, floor (optional)"
                      className="transition-colors"
                      {...register("line2")}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                      <Input
                        id="city"
                        placeholder="City"
                        className="transition-colors"
                        {...register("city")}
                      />
                      {errors.city?.message && <p className="text-sm text-destructive">{errors.city.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
                      <Input
                        id="state"
                        placeholder="State"
                        className="transition-colors"
                        {...register("state")}
                      />
                      {errors.state?.message && <p className="text-sm text-destructive">{errors.state.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP code <span className="text-destructive">*</span></Label>
                      <Input
                        id="zipCode"
                        placeholder="ZIP"
                        className="transition-colors"
                        {...register("zipCode")}
                      />
                      {errors.zipCode?.message && <p className="text-sm text-destructive">{errors.zipCode.message}</p>}
                    </div>
                  </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-card">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <Tag className="h-5 w-5" />
                </div>
                <CardTitle>Tags</CardTitle>
              </div>
              <CardDescription className="ml-11">
                Keywords to help discovery.
              </CardDescription>
            </CardHeader>
            <CardContent className="ml-0 md:ml-11">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div
                  className="flex flex-wrap items-center gap-2 min-h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring transition-colors"
                  onClick={() => tagInputRef.current?.focus()}
                >
                  {tagChips.map((tag, i) => (
                    <span
                      key={`${tag}-${i}`}
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-2.5 py-1 text-sm font-medium"
                    >
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
                        <X className="h-3.5 w-3.5" />
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
                            setTagChips((prev) =>
                              [...prev, word].slice(0, MAX_TAGS),
                            );
                            setTagInputValue("");
                          } else if (word) {
                            setTagInputValue("");
                          }
                        }
                      }}
                      placeholder={
                        tagChips.length === 0
                          ? "e.g. Running, Music, Outdoor — press Enter to add"
                          : "Add another..."
                      }
                      className="flex-1 min-w-30 bg-transparent border-0 outline-none placeholder:text-muted-foreground py-0.5"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Type a word and press Enter to add. Max {MAX_TAGS} tags.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-card">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <CardTitle>Photos</CardTitle>
              </div>
              <CardDescription className="ml-11">
                Add up to {MAX_IMAGES} images to showcase your event.
              </CardDescription>
            </CardHeader>
            <CardContent className="ml-0 md:ml-11">
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`rounded-xl border-2 border-dashed transition-all p-8 text-center ${
                    isDragOver
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : "border-muted-foreground/25 hover:border-muted-foreground/40 hover:bg-muted/5"
                  }`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-3 bg-muted rounded-full">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        SVG, PNG, JPG or GIF (max 5)
                      </p>
                    </div>
                    {imageFiles.length < MAX_IMAGES && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Select Files
                      </Button>
                    )}
                  </div>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
                    {imagePreviews.map((url, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-lg overflow-hidden border bg-muted shadow-sm group"
                      >
                        <img
                          src={url}
                          alt={`Preview ${i + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove image"
                        >
                          <div className="bg-destructive/90 p-1.5 rounded-full text-white">
                            <X className="h-4 w-4" />
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:items-center pt-4 pb-12">
            <Button type="button" variant="ghost" asChild>
              <Link to="/events">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-40"
              size="lg"
            >
              {isSubmitting ? "Creating Event..." : "Create Event"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
