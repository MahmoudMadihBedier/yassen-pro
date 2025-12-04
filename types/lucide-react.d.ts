// Type definitions for lucide-react

declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';

  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    absoluteStrokeWidth?: boolean;
  }

  export const Loader2: ComponentType<IconProps>;
  export const Shield: ComponentType<IconProps>;
  export const LogIn: ComponentType<IconProps>;
  export const User: ComponentType<IconProps>;
  export const Lock: ComponentType<IconProps>;
  export const AlertCircle: ComponentType<IconProps>;
  export const CheckCircle: ComponentType<IconProps>;
  export const Info: ComponentType<IconProps>;
  export const AlertTriangle: ComponentType<IconProps>;
}
