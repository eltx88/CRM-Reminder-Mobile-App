"use client";

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';

export type DateRangeType = 'thisMonth' | 'yearToDate' | 'last3Months' | 'last6Months' | 'today' | 'thisWeek' | 'custom';

interface DateRangeFilterProps {
  type: 'orders' | 'reminders';
  onDateRangeChange: (startDate: string | null, endDate: string | null, rangeType?: DateRangeType) => void;
  className?: string;
}

export function DateRangeFilter({ type, onDateRangeChange, className = '' }: DateRangeFilterProps) {
  const [selectedRange, setSelectedRange] = useState<DateRangeType>(
    type === 'orders' ? 'thisMonth' : 'today'
  );
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const getDateRangeOptions = () => {
    if (type === 'orders') {
      return [
        { value: 'thisMonth', label: 'This Month' },
        { value: 'yearToDate', label: 'Year to Date' },
        { value: 'last3Months', label: 'Last 3 Months' },
        { value: 'last6Months', label: 'Last 6 Months' },
        { value: 'custom', label: 'Date Range' },
      ];
    } else {
      return [
        { value: 'today', label: 'Today' },
        { value: 'thisWeek', label: 'This Week' },
        { value: 'thisMonth', label: 'This Month' },
        { value: 'custom', label: 'Date Range' },
      ];
    }
  };

  const getDateRange = (range: DateRangeType) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return {
          startDate: startOfWeek.toISOString().split('T')[0],
          endDate: endOfWeek.toISOString().split('T')[0]
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
          endDate: today.toISOString().split('T')[0]
        };
      
      case 'last3Months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return {
          startDate: threeMonthsAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      
      case 'last6Months':
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        return {
          startDate: sixMonthsAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
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
    setSelectedRange(range);
    
    if (range === 'custom') {
      setIsCustomOpen(true);
      // Don't trigger date change until custom dates are set
      return;
    }
    
    // Close custom section when switching away from custom
    setIsCustomOpen(false);
    const { startDate, endDate } = getDateRange(range);
    onDateRangeChange(startDate, endDate, range);
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      onDateRangeChange(customStartDate, customEndDate, 'custom');
    }
  };

  const handleCustomDateClear = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    const defaultRange = type === 'orders' ? 'thisMonth' : 'today';
    setSelectedRange(defaultRange);
    const { startDate, endDate } = getDateRange(defaultRange);
    onDateRangeChange(startDate, endDate, defaultRange);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">
          {type === 'orders' ? 'Order Date Range' : 'Reminder Date Range'}
        </Label>
      </div> */}
      
      <Select value={selectedRange} onValueChange={handleRangeChange}>
        <SelectTrigger className="w-full">
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

      {selectedRange === 'custom' && (
        <Collapsible open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
            >
              <span>Custom Date Range</span>
              {isCustomOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleCustomDateApply}
                disabled={!customStartDate || !customEndDate}
                size="sm"
                className="flex-1"
              >
                Apply
              </Button>
              <Button
                onClick={handleCustomDateClear}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Clear
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}