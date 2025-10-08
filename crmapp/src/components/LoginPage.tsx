import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User } from '@supabase/supabase-js';
import HCaptchaComponent, { HCaptchaRef } from '@/components/HCaptcha';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptchaRef>(null);

  // Replace with your actual hCaptcha site key from hCaptcha dashboard
  const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        onLogin(user);
      }
    };
    checkUser();
  }, [onLogin]);

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setError('');
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
  };

  const handleCaptchaError = (error: string) => {
    setCaptchaToken(null);
    setError('Captcha verification failed. Please try again.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Check if captcha is completed
    if (!captchaToken) {
      setError('Please complete the captcha verification.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Handle Sign Up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            captchaToken,
            data: {
              name: fullName,
            },
          },
        });
        if (error) {
          setError(error.message);
          captchaRef.current?.reset();
          setCaptchaToken(null);
        } else {
          setMessage('Sign up successful! Please check your email for the confirmation link.');
        }
      } else {
        // Handle Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            captchaToken,
          },
        });
        if (error) {
          setError(error.message);
          captchaRef.current?.reset();
          setCaptchaToken(null);
        } else if (data.user) {
          onLogin(data.user);
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      captchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            {isSignUp ? 'Create Admin Account' : 'Admin Login'}
          </CardTitle>
          <CardDescription>
            {isSignUp ? 'Enter your details to register' : 'Enter your credentials to access the CRM system'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Security Verification</Label>
              <HCaptchaComponent
                ref={captchaRef}
                siteKey={HCAPTCHA_SITE_KEY || ''}
                onVerify={handleCaptchaVerify}
                onExpire={handleCaptchaExpire}
                onError={handleCaptchaError}
                theme="light"
                size="normal"
                className="flex justify-center"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
                <Alert variant="default">
                    <AlertDescription>{message}</AlertDescription>
                </Alert>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (isSignUp ? 'Creating Account...' : 'Logging in...') : (isSignUp ? 'Sign Up' : 'Login')}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setMessage('');
                setCaptchaToken(null);
                captchaRef.current?.reset();
              }}
            >
              {isSignUp ? 'Login' : 'Sign Up'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}