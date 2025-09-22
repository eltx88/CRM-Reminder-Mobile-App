// Core Entity Interfaces
export interface Client {
  id: number;
  created_at: string;
  admin_id: string;
  name: string;
  dob: string | null; // Date of birth as ISO string
  phone: string | null;
  email: string | null;
  issue: string | null;
  notes: string | null;
  package_id: number | null;
  lifewave_id: number | null;
  sponsor: string | null;
  package_name?: string | null;
}

export interface Package {
  id: number;
  name: string;
}

// Dashboard Data Interfaces
export interface DashboardStats {
  managedClients: number;
  sharedClients: number;
  activeOrders: number;
  pendingReminders: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentClients: Client[] | null;
  managedPackageDistribution: { name: string; value: number }[] | null;
  sharedPackageDistribution: { name: string; value: number }[] | null;
  reminderTypeDistribution: { name: string; value: number }[] | null;
}

// Clients Data Interfaces
export interface ClientsData {
  managedClients: Client[];
  sharedClients: Client[];
}

// RPC Response Interfaces
export interface BaseRPCResponse {
  success: boolean;
  message?: string;
}

export interface CreateClientResponse extends BaseRPCResponse {
  id?: number;
  created_at?: string;
  admin_id?: string;
  name?: string;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  issue?: string | null;
  notes?: string | null;
  package_id?: number | null;
  lifewave_id?: number | null;
  sponsor?: string | null;
  package_name?: string | null;
}

export interface UpdateClientResponse extends CreateClientResponse {}

export interface PackagesResponse extends BaseRPCResponse {
  packages: Package[];
}

export interface ClientsDataResponse {
  managedClients: Client[] | null;
  sharedClients: Client[] | null;
}

export interface ClientDetailsResponse extends BaseRPCResponse {
  id?: number;
  created_at?: string;
  admin_id?: string;
  name?: string;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  issue?: string | null;
  notes?: string | null;
  package_id?: number | null;
  lifewave_id?: number | null;
  sponsor?: string | null;
  package_name?: string | null;
  is_managed?: boolean;
}

// Form Data Interfaces
export interface ClientFormData {
  name: string;
  dob: string; // Date input as string
  phone: string;
  email: string;
  issue: string;
  notes: string;
  package_id: string;
  lifewave_id: string;
  sponsor: string;
}

// Component Props Interfaces
export interface DashboardPageProps {
  onClientClick: (clientId: number) => void;
  user: any; // Replace with your User type from Supabase
}

export interface ClientsPageProps {
  user: any; // Replace with your User type from Supabase
  onClientClick: (clientId: number) => void;
}

export interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
}

export interface ClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  client: Client | null;
}

export interface ClientCardProps {
  client: Client;
  onClick: () => void;
  showManaged: boolean;
}

// Chart Data Interface
export interface ChartDataItem {
  name: string;
  value: number;
}