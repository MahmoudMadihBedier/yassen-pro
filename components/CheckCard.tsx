import { CheckRecord } from '@/types/check';
import React from 'react';

interface CheckCardProps {
  check: CheckRecord;
  onClick?: () => void;
}

export const CheckCard: React.FC<CheckCardProps> = React.memo(({ check, onClick }) => (
  <div className="card" onClick={onClick}>
    {/* ...render check info... */}
    <div>{check.name}</div>
    {/* Add more fields as needed */}
  </div>
));
