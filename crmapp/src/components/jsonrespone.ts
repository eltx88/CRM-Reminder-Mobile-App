// export interface OrdersRPCResponse {
//     success: boolean;
//     message?: string;
//     managedOrders?: Order[];
//     sharedOrders?: Order[];
//   }
  
//   export interface Order {
//     id: number;
//     client_id: number;
//     client_name: string;
//     client_package: string;
//     available_points: number;
//     enrollment_date: string;
//     expiry_date: string;
//     payment_mode: string | null;
//     collection_date: string | null;
//     payment_date: string | null;
//     shipping_location: string | null;
//     total_points_cost: number;
//     is_expired: boolean;
//     can_edit: boolean;
//     order_items: OrderItem[];
//   }
  
//   export interface OrderItem {
//     id: number;
//     product_id: number;
//     product_name: string;
//     quantity: number;
//     point_cost: number;
//     duration: string | null;
//     total_cost: number;
//   }