
export interface Client {
    id: number;
    created_at: string;
    admin_id?: string | null;
    name: string;
    age?: number | null;
    phone?: string | null;
    email?: string | null;
    issue?: string | null;
    notes?: string | null;
    package_id?: number | null;
    lifewave_id?: number | null;
    sponsor?: string | null;
  }
  