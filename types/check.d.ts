export interface CheckRecord {
  id: string;
  date: string;
  checkNumber: string;
  reason: string;
  amount: number;
  name: string;
  building: string;
  unitNumber: string;
  paymentWay: string;
  status: 'bounced' | 'retrieved' | 'pending' | 'resolved' | 'deal_close' | 'partial_paid';
  staff: string;
  email: string;
  phone: string;
  followUpDate: string;
  returnDate?: string;
  cpvNumber?: string;
  notes: string;
}
