import { Loader2, Shield, LogIn, User, Lock } from 'lucide-react';

export const Icons = {
  spinner: Loader2,
  shield: Shield,
  logIn: LogIn,
  user: User,
  lock: Lock,
} as const;

export type IconName = keyof typeof Icons;
