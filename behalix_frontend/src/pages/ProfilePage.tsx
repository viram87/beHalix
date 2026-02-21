import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { InterestTags } from '@/components/InterestTags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_AVATAR_COUNT } from '@/lib/avatars';

type Profile = {
  id: string;
  email: string;
  displayName: string;
  phone: string;
  gender: string;
  interests: string[];
  avatarId: number;
  createdAt: string;
};

const profileSchema = z.object({
  displayName: z.string().max(80).optional(),
  phone: z.string().max(20).optional(),
  gender: z.enum(['male', 'female', 'other']).or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [interests, setInterests] = useState<string[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState(1);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    let cancelled = false;
    api
      .get<Profile>('/users/me')
      .then(({ data }) => {
        if (!cancelled) {
          setProfile(data);
          setInterests(data.interests ?? []);
          setSelectedAvatarId(data.avatarId ?? 1);
          reset({
            displayName: data.displayName ?? '',
            phone: data.phone ?? '',
            gender: (data.gender as 'male' | 'female' | 'other' | '') ?? '',
          });
        }
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reset]);

  async function onSubmit(data: ProfileForm) {
    const payload = {
      displayName: (data.displayName ?? '').trim(),
      phone: (data.phone ?? '').trim(),
      gender: data.gender && ['male', 'female', 'other'].includes(data.gender) ? data.gender : undefined,
      interests,
      avatarId: selectedAvatarId,
    };
    try {
      await api.patch('/users/me/profile', payload);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              displayName: payload.displayName,
              phone: payload.phone,
              gender: payload.gender ?? prev.gender,
              interests: payload.interests,
              avatarId: payload.avatarId,
            }
          : null
      );
      if (token) {
        setAuth(token, {
          id: profile!.id,
          email: profile!.email,
          displayName: payload.displayName,
          gender: payload.gender,
          interests: payload.interests,
          avatarId: payload.avatarId,
        });
      }
      toast.success('Profile updated successfully');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error ?? 'Could not update profile');
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function formatJoined(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="container flex-1 py-6 max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-32" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="container flex-1 py-6">
          <p className="text-destructive">Failed to load profile.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <AppHeader />
      <main className="container flex-1 py-8 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
            <Link to="/events" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to events
            </Link>
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
            </Button>
        </div>

        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
            </div>

            <Card className="border-0 shadow-sm bg-card">
                <CardHeader>
                    <CardTitle>Public Profile</CardTitle>
                    <CardDescription>This is how others will see you on the site.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-8">
                         {/* Avatar Section */}
                        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                            <div className="flex flex-col items-center gap-2">
                                <Label className="sr-only">Current Avatar</Label>
                                <Avatar avatarId={selectedAvatarId} displayName={profile.displayName} size="lg" className="h-24 w-24 ring-4 ring-muted" />
                            </div>
                            <div className="space-y-3 flex-1">
                                <Label>Choose an avatar</Label>
                                <div className="flex flex-wrap gap-3">
                                {Array.from({ length: DEFAULT_AVATAR_COUNT }, (_, i) => i + 1).map((id) => (
                                    <button
                                    key={id}
                                    type="button"
                                    onClick={() => setSelectedAvatarId(id)}
                                    className={`relative rounded-full p-0.5 transition-all bg-background ${
                                        selectedAvatarId === id 
                                        ? 'ring-2 ring-primary ring-offset-2 scale-110' 
                                        : 'ring-1 ring-border hover:ring-muted-foreground/50 hover:scale-105'
                                    }`}
                                    >
                                    <Avatar avatarId={id} size="md" />
                                    </button>
                                ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input id="displayName" placeholder="Your name" {...register('displayName')} className="bg-muted/30" />
                                {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" {...register('phone')} className="bg-muted/30" />
                                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <select
                                    id="gender"
                                    className="flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...register('gender')}
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground opacity-50 cursor-not-allowed">
                                    {profile.email}
                                </div>
                            </div>
                        </div>

                         <div className="space-y-3">
                            <div>
                                <Label>Interests</Label>
                                <p className="text-xs text-muted-foreground">Select topics you are interested in.</p>
                            </div>
                            <InterestTags value={interests} onChange={setInterests} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end border-t bg-muted/10 px-6 py-4">
                        <Button type="submit" disabled={isSubmitting} className="min-w-32">
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <div className="text-center text-xs text-muted-foreground pt-4">
                Joined {formatJoined(profile.createdAt)}
            </div>
        </div>
      </main>
    </div>
  );
}
