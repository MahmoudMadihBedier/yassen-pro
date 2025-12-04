 'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addWeeks, isPast, differenceInDays } from 'date-fns';
import { Search, Plus, Phone, Mail, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, Building2, Hash, User, FileText, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ValidationAlert, FieldError } from '@/components/ValidationAlert';
import { validateCheckRecord, ValidationError } from '@/lib/validation';

interface CheckRecord {
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

export default function BouncedCheckManager() {
  // Helper: normalize various date formats (Date object, ISO string, yyyy-MM-dd)
  const normalizeDateString = (value: any) => {
    if (!value && value !== 0) return '';
    try {
      if (value instanceof Date) return format(value, 'yyyy-MM-dd');
      if (typeof value === 'string') {
        // If already in yyyy-MM-dd, return as-is
        const maybe = value.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(maybe)) return maybe;
        // Try parsing ISO or other string formats
        const d = new Date(maybe);
        if (!isNaN(d.getTime())) return format(d, 'yyyy-MM-dd');
        // Fallback: first 10 chars (common ISO prefix)
        return maybe.slice(0, 10);
      }
      // Fallback to string conversion
      const d = new Date(String(value));
      if (!isNaN(d.getTime())) return format(d, 'yyyy-MM-dd');
      return String(value);
    } catch (err) {
      return String(value || '');
    }
  };

  const normalizeCheck = (c: any): CheckRecord => ({
    id: String(c.id ?? ''),
    date: normalizeDateString(c.date) || format(new Date(), 'yyyy-MM-dd'),
    checkNumber: String(c.checkNumber ?? ''),
    reason: String(c.reason ?? ''),
    amount: Number(c.amount ?? 0) || 0,
    name: String(c.name ?? ''),
    building: String(c.building ?? ''),
    unitNumber: String(c.unitNumber ?? ''),
    paymentWay: String(c.paymentWay ?? ''),
    status: (c.status as any) || 'bounced',
    staff: String(c.staff ?? ''),
    email: String(c.email ?? ''),
    phone: String(c.phone ?? ''),
    followUpDate: normalizeDateString(c.followUpDate) || format(addWeeks(new Date(), 2), 'yyyy-MM-dd'),
    returnDate: c.returnDate ? normalizeDateString(c.returnDate) : '',
    cpvNumber: String(c.cpvNumber ?? ''),
    notes: String(c.notes ?? '')
  });
  // Simple spinner component
  const Spinner = ({ className = '', size = 16 }: { className?: string; size?: number }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      width={size}
      height={size}
    >
      <circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
  const [checks, setChecks] = useState<CheckRecord[]>([]);
  const [filteredChecks, setFilteredChecks] = useState<CheckRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<CheckRecord | null>(null);
  const [formData, setFormData] = useState<Partial<CheckRecord>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'bounced',
    followUpDate: format(addWeeks(new Date(), 2), 'yyyy-MM-dd'),
    returnDate: format(new Date(), 'yyyy-MM-dd'),
    cpvNumber: ''
  });
  const [formErrors, setFormErrors] = useState<ValidationError[]>([]);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [editErrors, setEditErrors] = useState<ValidationError[]>([]);
  const [editTouchedFields, setEditTouchedFields] = useState<Set<string>>(new Set());
  // Loading / action states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [updatingFollowUpId, setUpdatingFollowUpId] = useState<string | null>(null);

  useEffect(() => {
    // Always load from Apps Script/Google Sheets (via API proxy)
    const fetchChecks = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/checks');
        if (!res.ok) throw new Error('API fetch failed');
        const data = await res.json();
        if (Array.isArray(data)) {
          const normalized = data.map(normalizeCheck);
          setChecks(normalized);
          // Keep a local cache for offline reference
          localStorage.setItem('bouncedChecks', JSON.stringify(normalized));
          return;
        }
      } catch (err) {
        // If API fails, show error but try to use local cache as fallback
        console.error('Failed to fetch checks from API:', err);
        const savedChecks = localStorage.getItem('bouncedChecks');
        if (savedChecks) {
          console.warn('Using stale local cache. Please refresh when connection is restored.');
          try {
            const parsed = JSON.parse(savedChecks);
            setChecks(parsed.map(normalizeCheck));
          } catch (e) {
            setChecks([]);
          }
        } else {
          setChecks([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchChecks();
  }, []);

  useEffect(() => {
    filterChecks();
  }, [checks, searchTerm, filterStatus]);

  const filterChecks = () => {
    let filtered = [...checks];

    if (searchTerm) {
      filtered = filtered.filter(check =>
        check.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        check.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
        check.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        check.checkNumber.includes(searchTerm)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(check => check.status === filterStatus);
    }

    setFilteredChecks(filtered);
  };

  const handleAddCheck = async () => {
    setFormErrors([]);
    setIsAdding(true);

    // Validate form data
    const validation = validateCheckRecord(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    // compute follow-up date from returnDate (+14 days) if provided
    const computedFollowUp = formData.returnDate
      ? format(addWeeks(new Date(formData.returnDate), 2), 'yyyy-MM-dd')
      : formData.followUpDate || format(addWeeks(new Date(), 2), 'yyyy-MM-dd');

    const newCheck: CheckRecord = {
      id: Date.now().toString(),
      date: formData.date || format(new Date(), 'yyyy-MM-dd'),
      checkNumber: formData.checkNumber || '',
      reason: formData.reason || '',
      amount: Number(formData.amount) || 0,
      name: formData.name || '',
      building: formData.building || '',
      unitNumber: formData.unitNumber || '',
      paymentWay: formData.paymentWay || '',
      status: formData.status as any || 'bounced',
      staff: formData.staff || '',
      email: formData.email || '',
      phone: formData.phone || '',
      followUpDate: computedFollowUp,
      returnDate: formData.returnDate || undefined,
      cpvNumber: formData.cpvNumber || '',
      notes: formData.notes || ''
    };

    // Save to MongoDB—this is the source of truth
    try {
      const res = await fetch('/api/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCheck)
      });

      if (!res.ok) throw new Error('API create failed');

      const created = await res.json();
      // Update UI and local cache with normalized data
      setChecks(prev => {
        const next = [...prev, normalizeCheck(created)];
        localStorage.setItem('bouncedChecks', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error('Failed to save to MongoDB:', err);
      alert('Error saving check. Please try again.');
    }

    setShowAddModal(false);
    resetForm();
    setFormErrors([]);
    setTouchedFields(new Set());
    setIsAdding(false);
  };

  const handleUpdateCheck = async () => {
    if (!selectedCheck) return;

    setEditErrors([]);
    setIsSaving(true);

    // Validate form data
    const validation = validateCheckRecord(selectedCheck);
    if (!validation.isValid) {
      setEditErrors(validation.errors);
      return;
    }

    try {
      const payload = {
        ...selectedCheck,
        date: normalizeDateString(selectedCheck.date),
        followUpDate: normalizeDateString(selectedCheck.followUpDate),
        returnDate: selectedCheck.returnDate ? normalizeDateString(selectedCheck.returnDate) : '',
        amount: Number(selectedCheck.amount) || 0
      };

      const res = await fetch(`/api/checks/${selectedCheck.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('API update failed');
      const updated = await res.json();
      const normalized = normalizeCheck(updated);
      setChecks(prev => {
        const next = prev.map(c => c.id === normalized.id ? normalized : c);
        localStorage.setItem('bouncedChecks', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error('Failed to update in MongoDB:', err);
      alert('Error updating check. Please try again.');
    }

    setShowDetailModal(false);
    setSelectedCheck(null);
    setIsSaving(false);
  };

  const handleDeleteCheck = async (id: string) => {
    if (!confirm('Are you sure you want to delete this check record?')) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/checks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('API delete failed');
      setChecks(prev => {
        const next = prev.filter(check => check.id !== id);
        localStorage.setItem('bouncedChecks', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error('Failed to delete from MongoDB:', err);
      alert('Error deleting check. Please try again.');
    } finally {
      setIsDeleting(false);
    }

    setShowDetailModal(false);
    setSelectedCheck(null);
  };

  const updateFollowUpDate = async (checkId: string) => {
    const target = checks.find(c => c.id === checkId);
    if (!target) return;
    const newFollow = format(addWeeks(new Date(normalizeDateString(target.followUpDate)), 2), 'yyyy-MM-dd');
    const updated = {
      ...target,
      status: 'retrieved' as CheckRecord['status'],
      followUpDate: newFollow
    };

    setUpdatingFollowUpId(checkId);
    try {
      const res = await fetch(`/api/checks/${checkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updated,
          date: normalizeDateString(updated.date),
          followUpDate: normalizeDateString(updated.followUpDate),
          returnDate: updated.returnDate ? normalizeDateString(updated.returnDate) : '',
          amount: Number(updated.amount) || 0
        })
      });

      if (!res.ok) throw new Error('API update failed');
      const updatedFromServer = await res.json();
      const normalized = normalizeCheck(updatedFromServer);
      setChecks(prev => {
        const next = prev.map(c => c.id === checkId ? normalized : c);
        localStorage.setItem('bouncedChecks', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error('Failed to update follow-up in MongoDB:', err);
      alert('Error updating follow-up date. Please try again.');
    } finally {
      setUpdatingFollowUpId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'bounced',
      followUpDate: format(addWeeks(new Date(), 2), 'yyyy-MM-dd'),
      returnDate: format(new Date(), 'yyyy-MM-dd'),
      cpvNumber: ''
    });
  };
  

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bounced': return 'bg-destructive text-destructive-foreground';
      case 'retrieved': return 'bg-primary text-primary-foreground';
      case 'pending': return 'bg-secondary text-secondary-foreground';
      case 'resolved': return 'bg-accent text-accent-foreground';
      case 'deal_close': return 'bg-primary text-primary-foreground';
      case 'partial_paid': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'bounced': return <AlertCircle className="w-4 h-4" />;
      case 'retrieved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'deal_close': return <CheckCircle className="w-4 h-4" />;
      case 'partial_paid': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const isFollowUpDue = (followUpDate: string) => {
    return isPast(new Date(followUpDate));
  };

  const getNotificationChecks = () => {
    return checks.filter(check => 
      check.status !== 'resolved' && 
      (isPast(new Date(check.followUpDate)) || 
       differenceInDays(new Date(check.followUpDate), new Date()) <= 3)
    );
  };

  const notificationChecks = getNotificationChecks();

  const stats = {
    total: checks.length,
    bounced: checks.filter(c => c.status === 'bounced').length,
    retrieved: checks.filter(c => c.status === 'retrieved').length,
    pending: checks.filter(c => c.status === 'pending').length,
    totalAmount: checks.reduce((sum, c) => sum + c.amount, 0),
    dueFollowUps: checks.filter(c => isFollowUpDue(c.followUpDate) && c.status !== 'resolved').length
  };

  const handleContactTenant = (check: CheckRecord) => {
    setSelectedCheck(check);
    setShowContactModal(true);
  };

  const handleSendMessage = () => {
    alert(`Message sent to ${selectedCheck?.name}`);
    setShowContactModal(false);
  };

  const { user, logout } = useAuth();

  const getFieldError = (fieldName: string, errors: ValidationError[]): string | undefined => {
    return errors.find(e => e.field === fieldName)?.message;
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields(prev => new Set([...prev, fieldName]));
  };

  const handleEditFieldBlur = (fieldName: string) => {
    setEditTouchedFields(prev => new Set([...prev, fieldName]));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="animate-spin text-primary" size={48} />
            <div className="text-lg font-medium text-foreground">Loading data…</div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-card rounded-xl shadow-lg border border-border">
          <div>
            <h1 className="text-4xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Bounced Check Manager
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Track and manage bounced checks with automated follow-ups</p>
          </div>
          <div className="flex flex-col gap-3 items-end">
            <div className="flex gap-3 items-center">
              <div className="relative">
                <Button 
                  onClick={() => setShowNotificationModal(true)} 
                  className="relative bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-all"
                >
                  <AlertCircle className="w-5 h-5" />
                  {notificationChecks.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-destructive text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {notificationChecks.length}
                    </span>
                  )}
                </Button>
              </div>
              <Button 
                onClick={() => setShowAddModal(true)} 
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Check
              </Button>
              <Button 
                onClick={logout}
                variant="outline"
                className="hover:bg-destructive/10 border-destructive/30"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
            {user && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {user.username}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-destructive bg-gradient-to-br from-card to-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Bounced</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-destructive">{stats.bounced}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-primary bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-accent bg-gradient-to-br from-card to-accent/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Due Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-accent">{stats.dueFollowUps}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg bg-gradient-to-r from-primary/5 via-card to-accent/5 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Total Outstanding Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
              <span className="text-5xl font-bold text-foreground">
                AED {stats.totalAmount.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row gap-4 p-4 bg-card rounded-lg shadow-md border border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, building, unit number, or check number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-56 h-12 text-base">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="retrieved">Retrieved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChecks.map((check) => (
            <Card
              key={check.id}
              className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border-border bg-gradient-to-br from-card to-card/80"
              onClick={() => {
                setSelectedCheck(check);
                setShowDetailModal(true);
              }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-foreground font-bold flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      {check.name}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2 text-base">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {check.building}
                    </CardDescription>
                    {check.unitNumber && (
                      <CardDescription className="mt-1 text-sm font-medium text-primary flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        Unit: {check.unitNumber}
                      </CardDescription>
                    )}
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm ${getStatusColor(check.status)}`}>
                    {getStatusIcon(check.status)}
                    {check.status.toUpperCase()}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Amount
                  </span>
                  <span className="text-2xl font-bold text-primary">AED {check.amount.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Check No.
                  </span>
                  <span className="text-sm font-bold text-foreground">{check.checkNumber}</span>
                </div>

                <div className="p-2 bg-muted/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground">Reason</span>
                      <p className="text-sm font-medium text-foreground">{check.reason}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-border space-y-3">
                  <div className="flex items-center gap-2 text-sm p-2 hover:bg-muted/20 rounded transition-colors">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="text-foreground truncate font-medium">{check.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm p-2 hover:bg-muted/20 rounded transition-colors">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-medium">{check.phone || 'No phone'}</span>
                  </div>
                </div>

                {isFollowUpDue(check.followUpDate) && check.status !== 'resolved' && (
                  <div className="mt-3 p-3 bg-destructive/10 border-l-4 border-destructive rounded-md shadow-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      <span className="text-sm font-bold text-destructive">Follow-up Overdue!</span>
                    </div>
                    <p className="text-xs text-destructive/80 mt-1 font-medium">
                      Due {differenceInDays(new Date(), new Date(check.followUpDate))} days ago
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 p-2 bg-accent/10 rounded-lg">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span className="font-medium">Next Follow-up: {format(new Date(check.followUpDate), 'MMM dd, yyyy')}</span>
                </div>
              </CardContent>
              <div className="px-4 pb-4 flex gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateFollowUpDate(check.id);
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={updatingFollowUpId === check.id}
                >
                  {updatingFollowUpId === check.id ? (
                    <>
                      <Spinner className="animate-spin w-4 h-4 mr-2" size={16} />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Follow-up
                    </>
                  )}
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContactTenant(check);
                  }}
                  size="sm"
                  className="flex-1 bg-primary"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Contact
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredChecks.length === 0 && (
          <Card className="shadow-lg">
            <CardContent className="py-20 text-center">
              <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground font-medium">No checks found. Add your first check record to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add New Check Record</CardTitle>
              <CardDescription>Enter the details of the bounced check</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formErrors.length > 0 && (
                <ValidationAlert
                  type="error"
                  title="Validation Error"
                  errors={formErrors}
                  onDismiss={() => setFormErrors([])}
                />
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tenant Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onBlur={() => handleFieldBlur('name')}
                    placeholder="Enter tenant name"
                    className={getFieldError('name', formErrors) && touchedFields.has('name') ? 'border-destructive' : ''}
                  />
                  <FieldError error={getFieldError('name', formErrors)} touched={touchedFields.has('name')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="building">Building</Label>
                  <Input
                    id="building"
                    value={formData.building || ''}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    onBlur={() => handleFieldBlur('building')}
                    placeholder="Enter building name"
                    className={getFieldError('building', formErrors) && touchedFields.has('building') ? 'border-destructive' : ''}
                  />
                  <FieldError error={getFieldError('building', formErrors)} touched={touchedFields.has('building')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitNumber">Unit Number</Label>
                  <Input
                    id="unitNumber"
                    value={formData.unitNumber || ''}
                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                    onBlur={() => handleFieldBlur('unitNumber')}
                    placeholder="Enter unit number"
                    className={getFieldError('unitNumber', formErrors) && touchedFields.has('unitNumber') ? 'border-destructive' : ''}
                  />
                  <FieldError error={getFieldError('unitNumber', formErrors)} touched={touchedFields.has('unitNumber')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkNumber">Check Number *</Label>
                  <Input
                    id="checkNumber"
                    value={formData.checkNumber || ''}
                    onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                    onBlur={() => handleFieldBlur('checkNumber')}
                    placeholder="Enter check number"
                    className={getFieldError('checkNumber', formErrors) && touchedFields.has('checkNumber') ? 'border-destructive' : ''}
                  />
                  <FieldError error={getFieldError('checkNumber', formErrors)} touched={touchedFields.has('checkNumber')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    onBlur={() => handleFieldBlur('amount')}
                    placeholder="Enter amount"
                    className={getFieldError('amount', formErrors) && touchedFields.has('amount') ? 'border-destructive' : ''}
                  />
                  <FieldError error={getFieldError('amount', formErrors)} touched={touchedFields.has('amount')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    onBlur={() => handleFieldBlur('date')}
                    className={getFieldError('date', formErrors) && touchedFields.has('date') ? 'border-destructive' : ''}
                  />
                  <FieldError error={getFieldError('date', formErrors)} touched={touchedFields.has('date')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="followUpDate">Follow-up Date</Label>
                  <Input
                    id="followUpDate"
                    type="date"
                    value={formData.followUpDate || ''}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onBlur={() => handleFieldBlur('email')}
                    placeholder="tenant@example.com"
                    className={getFieldError('email', formErrors) && touchedFields.has('email') ? 'border-destructive' : ''}
                  />
                  <FieldError error={getFieldError('email', formErrors)} touched={touchedFields.has('email')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    onBlur={() => handleFieldBlur('phone')}
                    placeholder="+971 50 123 4567"
                    className={getFieldError('phone', formErrors) && touchedFields.has('phone') ? 'border-destructive' : ''}
                  />
                  <FieldError error={getFieldError('phone', formErrors)} touched={touchedFields.has('phone')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    value={formData.reason || ''}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g., Insufficient funds"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentWay">Payment Way</Label>
                  <Input
                    id="paymentWay"
                    value={formData.paymentWay || ''}
                    onChange={(e) => setFormData({ ...formData, paymentWay: e.target.value })}
                    placeholder="e.g., Bank transfer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff">Staff Member</Label>
                  <Input
                    id="staff"
                    value={formData.staff || ''}
                    onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
                    placeholder="Enter staff name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bounced">Bounced</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="retrieved">Retrieved</SelectItem>
                      <SelectItem value="deal_close">Deal Close</SelectItem>
                      <SelectItem value="partial_paid">Partial Paid</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="returnDate">Return Date</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    value={formData.returnDate || ''}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                  />
                </div>

                {(formData.status === 'deal_close' || formData.status === 'partial_paid') && (
                  <div className="space-y-2">
                    <Label htmlFor="cpvNumber">CPV Number</Label>
                    <Input
                      id="cpvNumber"
                      value={formData.cpvNumber || ''}
                      onChange={(e) => setFormData({ ...formData, cpvNumber: e.target.value })}
                      placeholder="Enter CPV number"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddCheck} className="bg-primary text-primary-foreground">
                  {isAdding ? (
                    <>
                      <Spinner className="animate-spin w-4 h-4 mr-2" size={16} />
                      Saving...
                    </>
                  ) : (
                    'Add Check'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showDetailModal && selectedCheck && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedCheck.name}</CardTitle>
                  <CardDescription>{selectedCheck.building}</CardDescription>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(selectedCheck.status)}`}>
                  {getStatusIcon(selectedCheck.status)}
                  {selectedCheck.status.toUpperCase()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editErrors.length > 0 && (
                <ValidationAlert
                  type="error"
                  title="Validation Error"
                  errors={editErrors}
                  onDismiss={() => setEditErrors([])}
                />
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Tenant Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedCheck.name}
                    onChange={(e) => setSelectedCheck({ ...selectedCheck, name: e.target.value })}
                    onBlur={() => handleEditFieldBlur('name')}
                    className={getFieldError('name', editErrors) && editTouchedFields.has('name') ? 'border-destructive' : ''}
                  />
                  <FieldError error={getFieldError('name', editErrors)} touched={editTouchedFields.has('name')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-building">Building</Label>
                  <Input
                    id="edit-building"
                    value={selectedCheck.building}
                    onChange={(e) => setSelectedCheck({ ...selectedCheck, building: e.target.value })}
                    onBlur={() => handleEditFieldBlur('building')}
                    className={getFieldError('building', editErrors) && editTouchedFields.has('building') ? 'border-destructive' : ''}
                  />
                  <FieldError error={getFieldError('building', editErrors)} touched={editTouchedFields.has('building')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-unitNumber">Unit Number</Label>
                  <Input
                    id="edit-unitNumber"
                    value={selectedCheck.unitNumber}
                    onChange={(e) => setSelectedCheck({ ...selectedCheck, unitNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-checkNumber">Check Number</Label>
                  <Input
                    id="edit-checkNumber"
                    value={selectedCheck.checkNumber}
                    onChange={(e) => setSelectedCheck({ ...selectedCheck, checkNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Amount</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    value={selectedCheck.amount}
                    onChange={(e) => setSelectedCheck({ ...selectedCheck, amount: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedCheck.email}
                    onChange={(e) => setSelectedCheck({ ...selectedCheck, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    value={selectedCheck.phone}
                    onChange={(e) => setSelectedCheck({ ...selectedCheck, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-reason">Reason</Label>
                  <Input
                    id="edit-reason"
                    value={selectedCheck.reason}
                    onChange={(e) => setSelectedCheck({ ...selectedCheck, reason: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-paymentWay">Payment Way</Label>
                  <Input
                    id="edit-paymentWay"
                    value={selectedCheck.paymentWay}
                    onChange={(e) => setSelectedCheck({ ...selectedCheck, paymentWay: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-staff">Staff Member</Label>
                  <Input
                    id="edit-staff"
                    value={selectedCheck.staff}
                    onChange={(e) => setSelectedCheck({ ...selectedCheck, staff: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={selectedCheck.status}
                    onValueChange={(value) => setSelectedCheck({ ...selectedCheck, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bounced">Bounced</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="retrieved">Retrieved</SelectItem>
                      <SelectItem value="deal_close">Deal Close</SelectItem>
                      <SelectItem value="partial_paid">Partial Paid</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={selectedCheck.date}
                    onChange={(e) => setSelectedCheck({ ...selectedCheck, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-followUpDate">Follow-up Date</Label>
                  <Input
                    id="edit-followUpDate"
                    type="date"
                    value={selectedCheck.followUpDate}
                    onChange={(e) => setSelectedCheck({ ...selectedCheck, followUpDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-returnDate">Return Date</Label>
                  <Input
                    id="edit-returnDate"
                    type="date"
                    value={selectedCheck.returnDate || ''}
                    onChange={(e) => setSelectedCheck({ ...selectedCheck, returnDate: e.target.value })}
                  />
                </div>

                {(selectedCheck.status === 'deal_close' || selectedCheck.status === 'partial_paid') && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-cpvNumber">CPV Number</Label>
                    <Input
                      id="edit-cpvNumber"
                      value={selectedCheck.cpvNumber || ''}
                      onChange={(e) => setSelectedCheck({ ...selectedCheck, cpvNumber: e.target.value })}
                      placeholder="Enter CPV number"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={selectedCheck.notes}
                  onChange={(e) => setSelectedCheck({ ...selectedCheck, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {isFollowUpDue(selectedCheck.followUpDate) && selectedCheck.status !== 'resolved' && (
                <Card className="bg-accent">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-accent-foreground" />
                        <span className="font-medium text-accent-foreground">Follow-up is overdue</span>
                      </div>
                      <Button
                        onClick={() => updateFollowUpDate(selectedCheck.id)}
                        variant="outline"
                        size="sm"
                        className="bg-background"
                        disabled={updatingFollowUpId === selectedCheck.id}
                      >
                        {updatingFollowUpId === selectedCheck.id ? (
                          <>
                            <Spinner className="animate-spin w-4 h-4 mr-2" size={16} />
                            Updating...
                          </>
                        ) : (
                          'Schedule Next Follow-up'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between gap-3 pt-4">
                <Button
                    variant="destructive"
                    onClick={() => handleDeleteCheck(selectedCheck.id)}
                    disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Spinner className="animate-spin w-4 h-4 mr-2" size={16} />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedCheck(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateCheck} className="bg-primary text-primary-foreground" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Spinner className="animate-spin w-4 h-4 mr-2" size={16} />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showContactModal && selectedCheck && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Contact Tenant</CardTitle>
              <CardDescription>Send a message to {selectedCheck.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{selectedCheck.email}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{selectedCheck.phone}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  defaultValue={`Dear ${selectedCheck.name},\n\nWe would like to follow up regarding the bounced check #${selectedCheck.checkNumber} for AED ${selectedCheck.amount.toLocaleString()}.\n\nPlease contact us at your earliest convenience to resolve this matter.\n\nThank you.`}
                  rows={8}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowContactModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSendMessage} className="bg-primary text-primary-foreground">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showNotificationModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-accent" />
                    Follow-up Notifications
                  </CardTitle>
                  <CardDescription>Checks with approaching or overdue follow-up dates</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotificationModal(false)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {notificationChecks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-muted-foreground">No notifications. All follow-ups are on track!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notificationChecks.map((check) => {
                    const daysUntil = differenceInDays(new Date(check.followUpDate), new Date());
                    const isOverdue = daysUntil < 0;
                    
                    return (
                      <div
                        key={check.id}
                        onClick={() => {
                          setSelectedCheck(check);
                          setShowNotificationModal(false);
                          setShowDetailModal(true);
                        }}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                          isOverdue
                            ? 'border-destructive bg-destructive/5 hover:bg-destructive/10'
                            : 'border-accent bg-accent/5 hover:bg-accent/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-foreground">{check.name}</h4>
                              <span className={`text-xs font-bold px-2 py-1 rounded ${
                                isOverdue
                                  ? 'bg-destructive text-destructive-foreground'
                                  : 'bg-accent text-accent-foreground'
                              }`}>
                                {isOverdue ? `Overdue by ${Math.abs(daysUntil)} days` : `Due in ${daysUntil} days`}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                Check #{check.checkNumber}
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                AED {check.amount.toLocaleString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {check.building}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(check.followUpDate), 'MMM dd, yyyy')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {check.status}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {isOverdue ? (
                              <AlertCircle className="w-6 h-6 text-destructive" />
                            ) : (
                              <Clock className="w-6 h-6 text-accent" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}