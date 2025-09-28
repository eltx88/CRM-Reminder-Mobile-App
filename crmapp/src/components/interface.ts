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
  
  // Order Interfaces
  /**
   * Represents the raw data structure returned from the `get_orders` RPC function.
   */
  export interface FetchedOrder {
    order_id: number;
    client_id: number;
    client_name: string;
    enrollment_date: string; // ISO date string
    expiry_date: string;     // ISO date string
    payment_mode: string | null;
    collection_date: string | null; // ISO date string
    payment_date: string | null;    // ISO date string
    shipping_location: string | null;
    notes: string | null;
    is_shared: boolean;
  }
  
  /**
   * Represents a processed Order object used within the frontend components.
   * It extends the raw fetched data with client-side calculated fields.
   */
  export interface Order extends FetchedOrder {
    id: number;      
    is_expired: boolean; 
    can_edit: boolean;   
  }
  
  export interface OrderItem {
    product_id: number;
    quantity: number;
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
    user: any;
  }
  
  export interface ClientsPageProps {
    user: any;
    onCreateReminder: (clientId: number, clientName: string) => void;
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
    onCreateReminder: (clientId: number, clientName: string) => void;
  }
  
  // Chart Data Interface
  export interface ChartDataItem {
    name: string;
    value: number;
  }
  
  // Reminder Interfaces
  export interface Reminder {
    id: number;
    client_id: number;
    client_name: string;
    client_phone: string | null;
    order_id: number | null;
    reminder_type: 'FOLLOW_UP' | 'EXPIRY';
    trigger_date: string;
    message: string;
    status: 'PENDING' | 'COMPLETED' | 'DISMISSED';
    created_at: string;
  }
  
  export interface CreateReminderData {
    client_id: number;
    order_id?: number;
    reminder_type: 'FOLLOW_UP' | 'EXPIRY';
    trigger_date: string;
    message: string;
  }
  
  export interface ReminderCardProps {
    reminder: Reminder;
    onEdit: (reminder: Reminder) => void;
    onDelete: (reminderId: number) => void;
    onStatusChange: (reminderId: number, status: 'PENDING' | 'COMPLETED' | 'DISMISSED') => void;
    onWhatsAppClick: (phone: string) => void;
  }
  
  export type ReminderTypeFilter = 'ALL' | 'FOLLOW_UP' | 'EXPIRY';
  export type ReminderSortBy = 'trigger_date' | 'created_at' | 'client_name';