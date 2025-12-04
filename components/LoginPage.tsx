'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ValidationAlert } from '@/components/ValidationAlert';
import { validateLoginForm, ValidationError } from '@/lib/validation';
import { Icons } from '@/lib/icon-utils';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: [0.4, 0, 0.2, 1] as const 
    }
  }
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [touched, setTouched] = useState<{ username: boolean; password: boolean }>({
    username: false,
    password: false
  });

  useEffect(() => {
    setIsMounted(true);
    // Redirect if already authenticated
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (!isMounted) return null;

  const getFieldError = (fieldName: string): string | undefined => {
    const error = errors.find(e => e.field === fieldName);
    return touched[fieldName as keyof typeof touched] ? error?.message : '';
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 dark:from-background dark:to-card/50 flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="w-full max-w-md"
      >
        <Card className="border border-border/50 shadow-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-primary to-primary/90 p-8 text-white">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <Icons.shield className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bounced Check Manager</h1>
                <p className="mt-2 text-white/90 text-sm">
                  Secure access to your account
                </p>
              </div>
            </div>
          </div>

          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {generalError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mb-6"
                >
                  <ValidationAlert
                    type="error"
                    title="Login Failed"
                    message={generalError}
                    onDismiss={() => setGeneralError('')}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="username" className="text-sm font-medium text-foreground/90">
                    Username
                  </Label>
                  {getFieldError('username') && (
                    <span className="text-xs font-medium text-destructive">
                      {getFieldError('username')}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.user className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => handleBlur('username')}
                    className={cn(
                      'pl-10 h-12 text-foreground/90',
                      'border-border/70 hover:border-primary/50 focus:border-primary',
                      'transition-colors duration-200',
                      'focus-visible:ring-2 focus-visible:ring-primary/20',
                      getFieldError('username') && 'border-destructive focus-visible:ring-destructive/20',
                    )}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground/90">
                    Password
                  </Label>
                  {getFieldError('password') && (
                    <span className="text-xs font-medium text-destructive">
                      {getFieldError('password')}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className={cn(
                      'pl-10 h-12 text-foreground/90',
                      'border-border/70 hover:border-primary/50 focus:border-primary',
                      'transition-colors duration-200',
                      'focus-visible:ring-2 focus-visible:ring-primary/20',
                      getFieldError('password') && 'border-destructive focus-visible:ring-destructive/20',
                    )}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                className={cn(
                  'w-full h-12 text-base font-medium transition-all duration-300',
                  'bg-gradient-to-r from-primary to-primary/90 text-white',
                  'hover:from-primary/90 hover:to-primary/80',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:opacity-50 disabled:pointer-events-none',
                  'flex items-center justify-center space-x-2',
                  'shadow-md hover:shadow-lg',
                  'transform hover:-translate-y-0.5 active:translate-y-0',
                  'rounded-lg'
                )}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Icons.spinner className="h-5 w-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <Icons.logIn className="h-5 w-5" />
                    <span>Sign in to your account</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="px-6 py-4 bg-muted/20 border-t border-muted/30">
            <p className="text-xs text-muted-foreground text-center w-full">
              By signing in, you agree to our{' '}
              <a href="#" className="text-primary hover:underline font-medium">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:underline font-medium">
                Privacy Policy
              </a>
              .
            </p>
          </CardFooter>
        </Card>
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need help?{' '}
            <a href="#" className="text-primary font-medium hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
