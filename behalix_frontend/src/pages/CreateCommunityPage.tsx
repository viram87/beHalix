import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  slug: z.string().max(50).optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateCommunityPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      const payload: { name: string; description?: string; slug?: string } = {
        name: data.name.trim(),
      };
      if (data.description?.trim()) payload.description = data.description.trim();
      if (data.slug?.trim()) payload.slug = data.slug.trim();
      const { data: community } = await api.post<{ _id: string }>('/communities', payload);
      toast.success('Community created');
      navigate(`/communities/${community._id}`);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error ?? 'Failed to create community');
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <AppHeader />
      <main className="container flex-1 py-8 max-w-3xl mx-auto">
        <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
                <Link to="/communities" className="flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    Back to communities
                </Link>
            </Button>
        </div>

        <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Create Community</h1>
            <p className="text-muted-foreground">Start a new community to bring people together.</p>
        </div>

        <Card className="border-0 shadow-sm bg-card">
            <CardHeader>
                <CardTitle>Community Details</CardTitle>
                <CardDescription>Tell us about your new community.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                        <Input
                            id="name"
                            placeholder="e.g. Hiking Enthusiasts"
                            className="bg-muted/30"
                            {...register('name')}
                        />
                         <p className="text-xs text-muted-foreground">This will be the public name of your community.</p>
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">URL Slug (optional)</Label>
                        <Input
                            id="slug"
                            placeholder="e.g. hiking-enthusiasts"
                            className="bg-muted/30"
                            {...register('slug')}
                        />
                        <p className="text-xs text-muted-foreground">
                             Leave blank to auto-generate from name.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
                        <textarea
                            id="description"
                            className="flex min-h-32 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors resize-y"
                            placeholder="What is this community about?"
                            {...register('description')}
                        />
                        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t bg-muted/10 px-6 py-4">
                     <Button type="button" variant="ghost" asChild className="mr-2">
                        <Link to="/communities">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="min-w-32">
                        {isSubmitting ? 'Creating...' : 'Create Community'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
      </main>
    </div>
  );
}
