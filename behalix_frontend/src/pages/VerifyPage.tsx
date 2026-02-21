import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BeHalixLogo } from '@/components/BeHalixLogo';

export default function VerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? '';

  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!email || code.length !== 6) {
      toast.error('Enter the 6-digit code from your email');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/auth/verify-email', { email: email.trim().toLowerCase(), code });
      toast.success('Email verified. You can log in now.');
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      toast.error(ax.response?.data?.error ?? 'Invalid or expired code');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!email) {
    navigate('/signup', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
      <div className="mb-6">
        <BeHalixLogo size="lg" />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>We sent a 6-digit code to {email}. Enter it below.</CardDescription>
        </CardHeader>
        <form onSubmit={handleVerify}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-lg tracking-widest"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isSubmitting || code.length !== 6}>
              {isSubmitting ? 'Verifying…' : 'Verify'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Didn’t get the email? Check spam or <a href="/signup" className="text-primary underline">sign up again</a>.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
