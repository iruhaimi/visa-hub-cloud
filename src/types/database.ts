// Application types based on database schema
export type AppRole = 'customer' | 'agent' | 'admin';

export type ApplicationStatus = 
  | 'draft'
  | 'pending_payment'
  | 'submitted'
  | 'under_review'
  | 'documents_required'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type DocumentStatus = 'pending' | 'verified' | 'rejected';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type WalletTransactionType = 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'reward';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  flag_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VisaType {
  id: string;
  country_id: string;
  name: string;
  description: string | null;
  requirements: string[];
  price: number;
  processing_days: number;
  validity_days: number | null;
  max_stay_days: number | null;
  entry_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  country?: Country;
}

export interface Application {
  id: string;
  user_id: string;
  visa_type_id: string;
  status: ApplicationStatus;
  travel_date: string | null;
  return_date: string | null;
  purpose_of_travel: string | null;
  accommodation_details: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  assigned_agent_id: string | null;
  agent_notes: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  visa_type?: VisaType;
  profile?: Profile;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  status: DocumentStatus;
  verification_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  old_status: ApplicationStatus | null;
  new_status: ApplicationStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  application_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string | null;
  stripe_payment_intent_id: string | null;
  stripe_session_id: string | null;
  invoice_number: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: WalletTransactionType;
  description: string | null;
  reference_id: string | null;
  balance_after: number | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

// Status display helpers
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  pending_payment: 'Pending Payment',
  submitted: 'Submitted',
  under_review: 'Under Review',
  documents_required: 'Documents Required',
  processing: 'Processing',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_payment: 'bg-warning/10 text-warning',
  submitted: 'bg-info/10 text-info',
  under_review: 'bg-primary/10 text-primary',
  documents_required: 'bg-warning/10 text-warning',
  processing: 'bg-primary/10 text-primary',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
};
