import { CheckRecord } from '@/types/check';
import React from 'react';

interface CheckFormProps {
  initialData?: Partial<CheckRecord>;
  onSubmit: (data: Partial<CheckRecord>) => void;
  loading?: boolean;
}

export const CheckForm: React.FC<CheckFormProps> = React.memo(({ initialData, onSubmit, loading }) => {
  // ...form state and handlers...
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(initialData || {}); }}>
      {/* Render form fields */}
      <button type="submit" disabled={loading}>Submit</button>
    </form>
  );
});
