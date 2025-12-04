'use client'

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ValidationAlert, FieldError } from '@/components/ValidationAlert';
import { validateLoginForm, ValidationError } from '@/lib/validation';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState<{ username: boolean; password: boolean }>({
    username: false,
    password: false
  });

  const getFieldError = (fieldName: string): string | undefined => {
    return errors.find(e => e.field === fieldName)?.message;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setGeneralError('');
    setIsLoading(true);

    // Validate form
    const validation = validateLoginForm(username, password);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsLoading(false);
      return;
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const success = login(username, password);
    if (!success) {
      setGeneralError('Invalid username or password. Please try again.');
      setPassword('');
    }

    setIsLoading(false);
  };

  const handleBlur = (field: 'username' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-primary/20">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">
            Bounced Check Manager
          </CardTitle>
          <CardDescription className="text-base">
            Enter your credentials to access
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {generalError && (
              <ValidationAlert
                type="error"
                title="Login Failed"
                message={generalError}
                onDismiss={() => setGeneralError('')}
              />
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-base font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => handleBlur('username')}
                placeholder="Enter your username"
                disabled={isLoading}
                className={`h-11 text-base ${touched.username && getFieldError('username') ? 'border-destructive' : ''}`}
                autoFocus
              />
              <FieldError error={getFieldError('username')} touched={touched.username} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="Enter your password"
                disabled={isLoading}
                className={`h-11 text-base ${touched.password && getFieldError('password') ? 'border-destructive' : ''}`}
              />
              <FieldError error={getFieldError('password')} touched={touched.password} />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
            </Button>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center mb-3 font-medium">
                Demo Credentials
              </p>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-muted/50 rounded text-center">
                  <p className="font-mono text-foreground">yassen / 9569633</p>
                </div>
                <div className="p-2 bg-muted/50 rounded text-center">
                  <p className="font-mono text-foreground">collabrate / 9569633</p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
