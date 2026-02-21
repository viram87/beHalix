import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useLoginModalStore } from '@/store/login-modal-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/PasswordInput';
import { Label } from '@/components/ui/label';
import { BeHalixLogo } from '@/components/BeHalixLogo';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginModal() {
  const navigate = useNavigate();
  const { open, returnTo, closeLoginModal } = useLoginModalStore();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    try {
      const payload = { ...data, email: data.email.trim().toLowerCase() };
      const { data: res } = await api.post<{
        token: string;
        profileComplete?: boolean;
        user: { id: string; email: string; displayName?: string; gender?: string; interests?: string[]; avatarId?: number };
      }>('/auth/login', payload);
      const profileComplete = res.profileComplete !== false;
      setAuth(res.token, {
        id: res.user.id,
        email: res.user.email,
        displayName: res.user.displayName,
        gender: res.user.gender,
        interests: res.user.interests,
        avatarId: res.user.avatarId,
      }, profileComplete);
      toast.success(profileComplete ? 'Welcome back!' : 'Please complete your profile.');
      closeLoginModal();
      if (profileComplete) {
        navigate(returnTo || '/');
      } else {
        navigate('/complete-profile', { replace: true });
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error ?? 'Login failed');
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
      <div className="absolute inset-0 bg-black/50" onClick={closeLoginModal} aria-hidden />
      <div className="relative bg-background border rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex justify-center">
          <BeHalixLogo size="md" />
        </div>
        <h2 id="login-modal-title" className="text-xl font-semibold text-center">Log in</h2>
        <p className="text-sm text-muted-foreground text-center">Sign in to create events, RSVP, or save events.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-modal-email">Email</Label>
            <Input id="login-modal-email" type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-modal-password">Password</Label>
            <PasswordInput id="login-modal-password" placeholder="••••••••" {...register('password')} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground text-center">
          No account? <Link to="/signup" className="text-primary underline" onClick={closeLoginModal}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
