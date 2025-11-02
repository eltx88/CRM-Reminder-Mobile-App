"use client";

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FileText, Download, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DateRangeType } from '@/components/DateRangeFilter';

interface ReportPageProps {
  user: User;
}

type ReportType = 'clientSignups' | 'totalOrders';

interface DateRangeState {
  startDate: string | null;
  endDate: string | null;
  rangeType: DateRangeType;
}

interface ClientSignupReportRow {
  created_at: string | null;
  name: string | null;
  package_name: string | null;
  notes: string | null;
  lifewave_id: number | null;
}

interface OrderReportRow {
  enrollment_date: string | null;
  name: string | null;
  enrolled_name: string | null;
  enrolled_id: number | null;
  order_items: string | null;
  package_name: string | null;
  client_id: number | null;
}

export default function ReportPage({ user }: ReportPageProps) {
  const [reportType, setReportType] = useState<ReportType>('clientSignups');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeState>(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      rangeType: 'thisMonth'
    };
  });
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDateRangeOptions = () => {
    return [
      { value: 'last3Months', label: 'Last 3 Months' },
      { value: 'last6Months', label: 'Last 6 Months' },
      { value: 'thisMonth', label: 'This Month' },
      { value: 'yearToDate', label: 'Year to Date' },
      { value: 'custom', label: 'Custom Date Range' },
    ];
  };

  const getDateRange = (range: DateRangeType): { startDate: string | null; endDate: string | null } => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (range) {
      case 'last3Months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return {
          startDate: threeMonthsAgo.toISOString().split('T')[0],
          endDate: today
        };

      case 'last6Months':
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        return {
          startDate: sixMonthsAgo.toISOString().split('T')[0],
          endDate: today
        };

      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0]
        };

      case 'yearToDate':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return {
          startDate: startOfYear.toISOString().split('T')[0],
          endDate: today
        };

      case 'custom':
        return {
          startDate: customStartDate || null,
          endDate: customEndDate || null
        };

      default:
        return { startDate: null, endDate: null };
    }
  };

  const handleRangeChange = (range: DateRangeType) => {
    const newRange = getDateRange(range);
    setDateRange({
      startDate: newRange.startDate,
      endDate: newRange.endDate,
      rangeType: range
    });
  };

  const convertToCSV = <T,>(data: T[], headers: string[], fieldMapping: (row: T) => string[]): string => {
    if (!data || data.length === 0) {
      return headers.join(',');
    }

    // Create CSV header
    const csvHeader = headers.join(',');

    // Create CSV rows
    const csvRows = data.map(row => {
      const values = fieldMapping(row);
      return values.map(value => {
        const stringValue = String(value || '');
        // Escape commas and quotes, wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });

    return [csvHeader, ...csvRows].join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const handleGenerateReport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Please select a valid date range');
      return;
    }

    if (dateRange.rangeType === 'custom' && (!customStartDate || !customEndDate)) {
      setError('Please select both start and end dates for custom range');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      let data: ClientSignupReportRow[] | OrderReportRow[] = [];
      let filename = '';
      let headers: string[] = [];
      let fieldMapping: (row: ClientSignupReportRow | OrderReportRow) => string[];

      if (reportType === 'clientSignups') {
        // Call RPC for client signups
        const { data: rpcData, error: rpcError } = await (supabase.rpc as unknown as {
          (name: 'get_client_signups_report', args: { admin_uuid: string; start_date: string; end_date: string; include_inactive: boolean }): Promise<{ data: ClientSignupReportRow[] | null; error: Error | null }>;
        })('get_client_signups_report', {
          admin_uuid: user.id,
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
          include_inactive: includeInactive
        });

        if (rpcError) throw rpcError;

        const clientData: ClientSignupReportRow[] = Array.isArray(rpcData) ? rpcData : [];
        data = clientData;
        
        // Define headers for client signups report
        headers = [
          'Date Enrolled',
          'Name',
          'Package',
          'Username',
          'Lifewave Member No'
        ];

        // Field mapping for client signups
        // RPC returns: created_at, name, package_name, notes, lifewave_id
        fieldMapping = (row: ClientSignupReportRow | OrderReportRow) => {
          const clientRow = row as ClientSignupReportRow;
          return [
            clientRow.created_at || '', // Date Enrolled
            clientRow.name || '', // Name
            clientRow.package_name || '', // Package
            clientRow.notes || '', // Username (notes field)
            String(clientRow.lifewave_id || '') // Lifewave Member No
          ];
        };

        filename = `client_signups_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
      } else {
        // Call RPC for total orders
        const { data: rpcData, error: rpcError } = await (supabase.rpc as unknown as {
          (name: 'get_orders_report', args: { admin_uuid: string; start_date: string; end_date: string }): Promise<{ data: OrderReportRow[] | null; error: Error | null }>;
        })('get_orders_report', {
          admin_uuid: user.id,
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        });

        if (rpcError) throw rpcError;

        const orderData: OrderReportRow[] = Array.isArray(rpcData) ? rpcData : [];
        data = orderData;

        // Define headers for orders report
        headers = [
          'Date Enrolled',
          'Name',
          'Order Registered Name',
          'Order Registered ID',
          'Order items',
          'Package'
        ];

        // Field mapping for orders
        // RPC returns: enrollment_date, name, enrolled_name, enrolled_id, order_items, package_name, client_id
        fieldMapping = (row: ClientSignupReportRow | OrderReportRow) => {
          const orderRow = row as OrderReportRow;
          const clientName = orderRow.name || '';
          const enrolledName = orderRow.enrolled_name || '';
          // Order Registered Name: "Own Account" if same as Name, otherwise enrolled_name
          const orderRegisteredName = (enrolledName === clientName || !enrolledName) ? 'Own Account' : enrolledName;
          // Order Registered ID: blank if same as client_id, otherwise enrolled_id
          const orderRegisteredId = (orderRow.enrolled_id === orderRow.client_id || !orderRow.enrolled_id) ? '' : String(orderRow.enrolled_id || '');

          return [
            orderRow.enrollment_date || '', // Date Enrolled
            clientName, // Name (client name from RPC)
            orderRegisteredName, // Order Registered Name (enrolled_name or "Own Account")
            orderRegisteredId, // Order Registered ID (enrolled_id or blank)
            orderRow.order_items || '', // Order items
            orderRow.package_name || '' // Package
          ];
        };

        filename = `orders_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
      }

      if (data.length === 0) {
        setError('No data found for the selected date range');
        setIsGenerating(false);
        return;
      }

      // Convert data to CSV format
      const csvContent = convertToCSV(data, headers, fieldMapping);
      
      // Download the CSV file
      downloadCSV(csvContent, filename);

      // Reset error state on success
      setError(null);
    } catch (err: unknown) {
      console.error('Error generating report:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report. Please try again.';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-1 px-3 mt-3 md:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        {/* <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8" style={{ pointerEvents: 'none' }} />
            Reports
          </h1>
        </div> */}
      </div>

      {/* Report Configuration Card */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-xl">Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report Type Selector */}
          <div className="space-y-2">
            <Label htmlFor="report-type" className="text-sm font-medium">
              Report Type
            </Label>
            <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
              <SelectTrigger id="report-type" className="w-full">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clientSignups">Client Signups</SelectItem>
                <SelectItem value="totalOrders">Orders</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Include Inactive Customers Checkbox - Only show for Client Signups */}
          {reportType === 'clientSignups' && (
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Switch
                id="include-inactive"
                checked={includeInactive}
                onCheckedChange={setIncludeInactive}
              />
              <Label htmlFor="include-inactive" className="text-sm font-medium cursor-pointer">
                Include Inactive Customers
              </Label>
            </div>
          )}

          {/* Date Range Selector */}
          <div className="space-y-2">
            <Label htmlFor="date-range" className="text-sm font-medium">
              Date Range
            </Label>
            <Select
              value={dateRange.rangeType}
              onValueChange={(value) => handleRangeChange(value as DateRangeType)}
            >
              <SelectTrigger id="date-range" className="w-full">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                {getDateRangeOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range Fields */}
          {dateRange.rangeType === 'custom' && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="text-sm">
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      if (e.target.value && customEndDate) {
                        setDateRange({
                          startDate: e.target.value,
                          endDate: customEndDate,
                          rangeType: 'custom'
                        });
                      }
                    }}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date" className="text-sm">
                    End Date
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      if (e.target.value && customStartDate) {
                        setDateRange({
                          startDate: customStartDate,
                          endDate: e.target.value,
                          rangeType: 'custom'
                        });
                      }
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Date Range Display */}
          {dateRange.startDate && dateRange.endDate && dateRange.rangeType !== 'custom' && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Selected Range:</span>{' '}
                {new Date(dateRange.startDate).toLocaleDateString()} to{' '}
                {new Date(dateRange.endDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Generate Report Button */}
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || !dateRange.startDate || !dateRange.endDate}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>

          {/* Info Message */}
          <p className="text-xs text-gray-500 text-center">
            The report will be downloaded as a CSV file with all relevant data for the selected date range.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
