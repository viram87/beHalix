import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
});

type FormData = z.infer<typeof schema>;

export default function EditCommunityPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!id) return;
    api
      .get<{ name: string; description?: string; createdBy: string }>(`/communities/${id}`)
      .then(({ data }) => {
        reset({ name: data.name, description: data.description ?? '' });
      })
      .catch(() => setError('Community not found'))
      .finally(() => setLoading(false));
  }, [id, reset]);

  async function onSubmit(data: FormData) {
    if (!id) return;
    try {
      await api.patch(`/communities/${id}`, {
        name: data.name.trim(),
        description: data.description?.trim() ?? '',
      });
      toast.success('Community details updated successfully');
      navigate(`/communities/${id}`);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error ?? 'Could not update community details');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="container flex-1 py-6">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="container flex-1 py-6">
          <p className="text-destructive">{error}</p>
          <Button variant="ghost" asChild>
            <Link to="/communities">Back to communities</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <AppHeader />
      <main className="container flex-1 py-8 max-w-3xl mx-auto">
        <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
                <Link to={`/communities/${id}`} className="flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    Back to community
                </Link>
            </Button>
        </div>

        <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Edit Community</h1>
            <p className="text-muted-foreground">Update your community's details and settings.</p>
        </div>

        <div className="space-y-6">
            <Card className="border-0 shadow-sm bg-card">
                <CardHeader>
                    <CardTitle>Community Details</CardTitle>
                     <CardDescription>General information about your community.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                            <Input
                                id="name"
                                placeholder="Community Name"
                                className="bg-muted/30"
                                {...register('name')}
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
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
                        <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="mr-2">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="min-w-32">
                           {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

             <Card className="border-destructive/20 shadow-sm bg-destructive/5">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions for your community.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive" className="w-full sm:w-auto text-white">
                        Delete Community
                    </Button>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
