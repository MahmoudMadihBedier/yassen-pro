import { CheckRecord } from '../types/check';

export interface ICheckService {
  fetchChecks(): Promise<CheckRecord[]>;
  addCheck(check: CheckRecord): Promise<CheckRecord>;
  updateCheck(check: CheckRecord): Promise<CheckRecord>;
  deleteCheck(id: string): Promise<void>;
}

export class CheckService implements ICheckService {
  async fetchChecks(): Promise<CheckRecord[]> {
    const res = await fetch('/api/checks');
    if (!res.ok) throw new Error('API fetch failed');
    return await res.json();
  }

  async addCheck(check: CheckRecord): Promise<CheckRecord> {
    const res = await fetch('/api/checks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(check)
    });
    if (!res.ok) throw new Error('API create failed');
    return await res.json();
  }

  async updateCheck(check: CheckRecord): Promise<CheckRecord> {
    const res = await fetch(`/api/checks/${check.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(check)
    });
    if (!res.ok) throw new Error('API update failed');
    return await res.json();
  }

  async deleteCheck(id: string): Promise<void> {
    const res = await fetch(`/api/checks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('API delete failed');
  }
}
