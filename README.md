# CRM Reminder Mobile App (https://jwwellness.vercel.app/)
Project built for mum to manage clients :)

This mobile-responsive web application provides a complete solution to track customer interactions, manage orders, and maintain follow-up schedules.

## 🚀 Tech Stack

### Frontend
- **Next.js 15.5.3** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety and development experience
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Recharts** - Data visualization and charts

### Backend & Database
- **Supabase** - Backend-as-a-Service (BaaS)
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Authentication & authorization
  - Edge functions

### State Management & Data Fetching
- **TanStack Query (React Query) 5.87.4** - Server state management
- **React Context API** - Global state management
- **React Hook Form 7.63.0** - Form handling
- **Zod 4.1.11** - Schema validation

### Security & Authentication
- **Supabase Auth** - User authentication
- **hCaptcha** - Bot protection and security verification
- **Username validation** - Custom RPC functions for username availability

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Turbopack** - Fast bundling (development)

## 🔐 Security Features

### Authentication & Authorization
- **Email-based authentication** with Supabase Auth
- **Password reset functionality** with secure token-based flow
- **Session management** with automatic token refresh
- **Row Level Security (RLS)** policies for data protection
- **Admin role-based access control**

### Security Measures
- **hCaptcha integration** on all authentication forms
- **Username validation** with real-time availability checking
- **Input sanitization** and validation using Zod schemas
- **CSRF protection** through Supabase's built-in security
- **Environment variable protection** for sensitive data

## 🗄️ Database Schema

### Core Tables
- User accounts and authentication
-  Customer information and profiles
- Order management and tracking
-  Individual items within orders
- Product catalog with point costs
- Service packages and pricing
- Automated reminder system
- Package assignment tracking
- Client sharing between admins

### Key Features
- **Relational integrity** with foreign key constraints
- **Audit trails** with created_at timestamps
- **Soft deletes** for data preservation
- **JSON support** for flexible data storage
- **Custom RPC functions** for complex operations

## ✨ Available Features

### 📊 Dashboard
- **Real-time analytics** with interactive charts
- **Order statistics** (pending, completed, monthly trends)
- **Reminder alerts** (follow-up, expiry notifications)
- **Client distribution** visualization
- **Package analytics** with popularity metrics
- **Quick stats** and performance indicators

### 👥 Client Management
- **Comprehensive client profiles** with contact information
- **Client categorization** by packages and status
- **Advanced search and filtering** (name, email, phone, package)
- **Sorting options** (date joined, age, alphabetical)
- **Client sharing** between admin users
- **Active/Inactive status** management
- **Client deletion** with confirmation dialogs
- **Pagination** for large datasets

### 📦 Order Management
- **Order creation and editing** with detailed forms
- **Order tracking** (enrollment, expiry, collection status)
- **Order items management** with quantity tracking
- **Payment tracking** (date, mode, status)
- **Enroller information** management
- **Shipping location** tracking
- **Order filtering** (expired, uncollected, date ranges)
- **Order sharing** between admins

### 🔔 Reminder System
- **Automated reminder creation** for follow-ups and expiries
- **Reminder scheduling** with trigger dates
- **Status management** (pending, completed, dismissed)
- **Reminder types** (follow-up, expiry notifications)
- **Date range filtering** (today, week, month, custom)
- **Search functionality** across reminders
- **Bulk operations** for reminder management

### 📱 Mobile Responsiveness
- **Mobile-first design** with responsive layouts
- **Touch-friendly interfaces** optimized for mobile devices
- **Adaptive navigation** with collapsible menus
- **Optimized forms** for mobile input
- **Fast loading** with performance optimizations

### 🔄 Data Management
- **Real-time updates** with Supabase subscriptions
- **Optimistic updates** for better UX
- **Cache management** with TanStack Query
- **Data synchronization** across components
- **Error handling** with user-friendly messages

### 📞 Communication Features
- **WhatsApp integration** for direct client communication
- **Phone number formatting** for international numbers
- **One-click messaging** from client profiles

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- hCaptcha account (for security)

### Environment Variables
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CRM-Reminder-Mobile-App/crmapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations
   - Configure RLS policies
   - Set up authentication providers

4. **Configure hCaptcha**
   - Sign up at hcaptcha.com
   - Create a new site
   - Add the site key to environment variables

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 Usage

### Getting Started
1. **Sign up** for a new admin account
2. **Verify your email** through the confirmation link
3. **Set your username** during the registration process
4. **Start adding clients** and managing your CRM

### Key Workflows
1. **Client Management**: Add clients with complete profiles
2. **Order Processing**: Create orders and track their status
3. **Reminder Setup**: Set up automated follow-ups and expiry alerts
4. **Analytics Review**: Monitor performance through the dashboard
5. **Communication**: Use WhatsApp integration for client outreach

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run update:supabase` - Update TypeScript types from Supabase
