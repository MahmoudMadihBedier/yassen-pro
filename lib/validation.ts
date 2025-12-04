export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (supports multiple formats)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$|^$/;
  if (!phone) return true; // Optional field
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
};

// Amount validation
export const isValidAmount = (amount: number | string): boolean => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0;
};

// Check number validation
export const isValidCheckNumber = (checkNumber: string): boolean => {
  return checkNumber.trim().length > 0 && checkNumber.trim().length <= 20;
};

// Date validation
export const isValidDate = (dateString: string): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// Future date validation
export const isFutureDate = (dateString: string): boolean => {
  if (!isValidDate(dateString)) return false;
  return new Date(dateString) > new Date();
};

// Text field validation
export const isValidText = (text: string, minLength: number = 1, maxLength: number = 255): boolean => {
  const trimmed = text.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
};

// Username validation
export const isValidUsername = (username: string): boolean => {
  return isValidText(username, 2, 50);
};

// Password validation
export const isValidPassword = (password: string): boolean => {
  return password.length >= 4;
};

// CPV Number validation
export const isValidCPVNumber = (cpvNumber: string): boolean => {
  if (!cpvNumber) return true; // Optional
  return isValidText(cpvNumber, 1, 50);
};

// Building validation
export const isValidBuilding = (building: string): boolean => {
  return !building || isValidText(building, 1, 100);
};

// Unit number validation
export const isValidUnitNumber = (unitNumber: string): boolean => {
  return !unitNumber || isValidText(unitNumber, 1, 50);
};

// Validate check record form
export const validateCheckRecord = (data: {
  name?: string;
  checkNumber?: string;
  amount?: number | string;
  email?: string;
  phone?: string;
  building?: string;
  unitNumber?: string;
  reason?: string;
  paymentWay?: string;
  staff?: string;
  date?: string;
  followUpDate?: string;
  returnDate?: string;
  notes?: string;
  status?: string;
  cpvNumber?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // Name validation
  if (!data.name || !isValidText(data.name, 1, 150)) {
    errors.push({ field: 'name', message: 'Tenant name is required and must be 1-150 characters' });
  }

  // Check number validation
  if (!data.checkNumber || !isValidCheckNumber(data.checkNumber)) {
    errors.push({ field: 'checkNumber', message: 'Check number is required and must be 1-20 characters' });
  }

  // Amount validation
  if (!data.amount || !isValidAmount(data.amount)) {
    errors.push({ field: 'amount', message: 'Amount must be a positive number' });
  }

  // Email validation
  if (data.email && !isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  // Phone validation
  if (data.phone && !isValidPhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Please enter a valid phone number' });
  }

  // Building validation
  if (data.building && !isValidBuilding(data.building)) {
    errors.push({ field: 'building', message: 'Building name must be 1-100 characters' });
  }

  // Unit number validation
  if (data.unitNumber && !isValidUnitNumber(data.unitNumber)) {
    errors.push({ field: 'unitNumber', message: 'Unit number must be 1-50 characters' });
  }

  // Date validation
  if (data.date && !isValidDate(data.date)) {
    errors.push({ field: 'date', message: 'Please enter a valid date' });
  }

  // Follow-up date validation
  if (data.followUpDate && !isValidDate(data.followUpDate)) {
    errors.push({ field: 'followUpDate', message: 'Please enter a valid follow-up date' });
  }

  // Return date validation
  if (data.returnDate && !isValidDate(data.returnDate)) {
    errors.push({ field: 'returnDate', message: 'Please enter a valid return date' });
  }

  // CPV number validation for deal_close and partial_paid statuses
  if ((data.status === 'deal_close' || data.status === 'partial_paid') && !data.cpvNumber) {
    errors.push({ field: 'cpvNumber', message: 'CPV Number is required for this status' });
  }

  if (data.cpvNumber && !isValidCPVNumber(data.cpvNumber)) {
    errors.push({ field: 'cpvNumber', message: 'CPV Number must be 1-50 characters' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate login form
export const validateLoginForm = (username: string, password: string): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!username || !isValidUsername(username)) {
    errors.push({ field: 'username', message: 'Username must be 2-50 characters' });
  }

  if (!password || !isValidPassword(password)) {
    errors.push({ field: 'password', message: 'Password must be at least 4 characters' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
