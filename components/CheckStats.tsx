import { CheckRecord } from '@/types/check';
import React from 'react';

interface CheckStatsProps {
  checks: CheckRecord[];
}

export const CheckStats: React.FC<CheckStatsProps> = React.memo(({ checks }) => {
  // Calculate stats
  const stats = {
    total: checks.length,
    bounced: checks.filter(c => c.status === 'bounced').length,
    retrieved: checks.filter(c => c.status === 'retrieved').length,
    pending: checks.filter(c => c.status === 'pending').length,
    totalAmount: checks.reduce((sum, c) => sum + c.amount, 0),
    dueFollowUps: checks.filter(c => c.status !== 'resolved').length
  };
  return (
    <div className="check-stats">
      {/* Render stats */}
      <div>Total: {stats.total}</div>
      <div>Bounced: {stats.bounced}</div>
      <div>Pending: {stats.pending}</div>
      <div>Amount: {stats.totalAmount}</div>
      <div>Due: {stats.dueFollowUps}</div>
    </div>
  );
});
