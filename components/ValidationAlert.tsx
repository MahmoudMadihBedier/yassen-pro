'use client'

import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export type AlertType = 'error' | 'success' | 'info' | 'warning';

interface ValidationAlertProps {
  type: AlertType;
  title?: string;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
  onDismiss?: () => void;
  dismissible?: boolean;
}

export function ValidationAlert({
  type,
  title,
  message,
  errors,
  onDismiss,
  dismissible = true
}: ValidationAlertProps) {
  const styles = {
    error: {
      bg: 'bg-destructive/10',
      border: 'border-destructive/30',
      icon: 'text-destructive',
      text: 'text-destructive',
      iconComponent: AlertCircle
    },
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      icon: 'text-green-600',
      text: 'text-green-600',
      iconComponent: CheckCircle
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      icon: 'text-blue-600',
      text: 'text-blue-600',
      iconComponent: Info
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      icon: 'text-yellow-600',
      text: 'text-yellow-600',
      iconComponent: AlertTriangle
    }
  };

  const style = styles[type];
  const Icon = style.iconComponent;

  return (
    <div className={`p-4 rounded-lg border ${style.bg} ${style.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Icon className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            {title && (
              <h4 className={`font-semibold ${style.text} mb-1`}>
                {title}
              </h4>
            )}
            {message && (
              <p className={`text-sm ${style.text}`}>
                {message}
              </p>
            )}
            {errors && errors.length > 0 && (
              <ul className={`text-sm ${style.text} mt-2 space-y-1`}>
                {errors.map((error, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-medium min-w-max">{error.field}:</span>
                    <span>{error.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 text-lg leading-none ${style.text} hover:opacity-70 transition-opacity`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

interface FieldErrorProps {
  error?: string;
  touched?: boolean;
}

export function FieldError({ error, touched }: FieldErrorProps) {
  if (!touched || !error) return null;

  return (
    <p className="mt-1 text-sm text-destructive font-medium flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {error}
    </p>
  );
}
