import React, { useState, useEffect } from 'react';
import { X, Filter, Calendar, Search } from 'lucide-react';

export interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'input' | 'dateRange' | 'multiSelect';
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: any;
}

export interface FilterValue {
  key: string;
  value: any;
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between';
}

export interface AdvancedFiltersProps {
  filters: FilterOption[];
  onFilterChange: (filters: FilterValue[]) => void;
  className?: string;
  showClearAll?: boolean;
}

export function AdvancedFilters({
  filters,
  onFilterChange,
  className = '',
  showClearAll = true
}: AdvancedFiltersProps) {
  const [filterValues, setFilterValues] = useState<FilterValue[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Initialize filter values with defaults
    const initialFilters = filters
      .filter(f => f.defaultValue !== undefined)
      .map(f => ({
        key: f.key,
        value: f.defaultValue,
        operator: 'equals' as const
      }));
    
    setFilterValues(initialFilters);
    onFilterChange(initialFilters);
  }, [filters, onFilterChange]);

  const handleFilterChange = (key: string, value: any, operator: string = 'equals') => {
    const newFilters = filterValues.filter(f => f.key !== key);
    
    if (value !== undefined && value !== '' && value !== null) {
      newFilters.push({ key, value, operator: operator as any });
    }
    
    setFilterValues(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilter = (key: string) => {
    const newFilters = filterValues.filter(f => f.key !== key);
    setFilterValues(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setFilterValues([]);
    onFilterChange([]);
  };

  const getActiveFilterCount = () => filterValues.length;

  const renderFilterInput = (filter: FilterOption) => {
    const currentValue = filterValues.find(f => f.key === filter.key)?.value;
    
    switch (filter.type) {
      case 'select':
        return (
          <select
            className="bg-gray-700 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            value={currentValue || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value || undefined)}
          >
            <option value="">{filter.placeholder || 'Select...'}</option>
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'input':
        return (
          <input
            type="text"
            className="bg-gray-700 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder={filter.placeholder || 'Enter value...'}
            value={currentValue || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value || undefined)}
          />
        );

      case 'dateRange':
        return (
          <div className="flex gap-2">
            <input
              type="date"
              className="bg-gray-700 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              value={currentValue?.start || ''}
              onChange={(e) => {
                const existing = filterValues.find(f => f.key === filter.key);
                const newValue = {
                  start: e.target.value,
                  end: existing?.value?.end || ''
                };
                handleFilterChange(filter.key, newValue, 'between');
              }}
            />
            <span className="text-gray-400 self-center">to</span>
            <input
              type="date"
              className="bg-gray-700 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              value={currentValue?.end || ''}
              onChange={(e) => {
                const existing = filterValues.find(f => f.key === filter.key);
                const newValue = {
                  start: existing?.value?.start || '',
                  end: e.target.value
                };
                handleFilterChange(filter.key, newValue, 'between');
              }}
            />
          </div>
        );

      case 'multiSelect':
        return (
          <select
            multiple
            className="bg-gray-700 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none min-h-[80px]"
            value={currentValue || []}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
              handleFilterChange(filter.key, selectedOptions.length > 0 ? selectedOptions : undefined);
            }}
          >
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
          {getActiveFilterCount() > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {getActiveFilterCount()}
            </span>
          )}
        </button>
        
        {showClearAll && getActiveFilterCount() > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Controls */}
      {isExpanded && (
        <div className="bg-gray-800 p-4 rounded space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map(filter => (
              <div key={filter.key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  {filter.label}
                </label>
                <div className="relative">
                  {renderFilterInput(filter)}
                  {filterValues.find(f => f.key === filter.key) && (
                    <button
                      onClick={() => clearFilter(filter.key)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {filterValues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterValues.map(filter => {
            const filterOption = filters.find(f => f.key === filter.key);
            const displayValue = filterOption?.type === 'dateRange' 
              ? `${filter.value.start} - ${filter.value.end}`
              : Array.isArray(filter.value) 
                ? filter.value.join(', ')
                : String(filter.value);
            
            return (
              <span
                key={filter.key}
                className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full"
              >
                <span>{filterOption?.label}: {displayValue}</span>
                <button
                  onClick={() => clearFilter(filter.key)}
                  className="hover:bg-blue-700 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdvancedFilters;
