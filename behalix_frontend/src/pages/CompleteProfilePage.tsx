import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { InterestTags } from '@/components/InterestTags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(80),
  phone: z.string().min(1, 'Phone number is required').max(20),
  gender: z.enum(['male', 'female', 'other'], { message: 'Please select your gender' }),
});

type FormData = z.infer<typeof schema>;

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setProfileComplete = useAuthStore((s) => s.setProfileComplete);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gender: undefined },
  });

  useEffect(() => {
    api
      .get<{ displayName?: string; phone?: string; interests?: string[]; gender?: string }>('/users/me')
      .then(({ data }) => {
        setInterests(data.interests ?? []);
        if (data.gender && ['male', 'female', 'other'].includes(data.gender)) {
          setValue('gender', data.gender as FormData['gender']);
        }
        if (data.displayName) setValue('displayName', data.displayName);
        if (data.phone) setValue('phone', data.phone);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setValue]);

  async function onSubmit(data: FormData) {
    if (!token || !user) return;
    try {
      await api.patch('/users/me/profile', {
        displayName: data.displayName.trim(),
        phone: data.phone.trim(),
        gender: data.gender,
        interests,
      });
      setAuth(token, {
        ...user,
        displayName: data.displayName.trim(),
      }, true);
      setProfileComplete(true);
      toast.success('Profile complete! Welcome.');
      navigate('/events', { replace: true });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error ?? 'Failed to save profile');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete your profile</CardTitle>
          <CardDescription>
            Add your display name, phone, and gender so others can recognize you. You can add interests to help people with similar interests find you.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name <span className="text-destructive">*</span></Label>
              <Input
                id="displayName"
                placeholder="How you want to be shown"
                {...register('displayName')}
              />
              {errors.displayName && (
                <p className="text-sm text-destructive">{errors.displayName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number <span className="text-destructive">*</span></Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Your phone number"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
              <select
                id="gender"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('gender')}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-sm text-destructive">{errors.gender.message}</p>
              )}
            </div>
            <InterestTags value={interests} onChange={setInterests} />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Continue'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
