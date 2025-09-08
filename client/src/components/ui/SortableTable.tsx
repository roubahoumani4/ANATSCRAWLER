import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface SortableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface SortableTableProps<T> {
  data: T[];
  columns: SortableColumn<T>[];
  defaultSort?: { key: keyof T | string; direction: 'asc' | 'desc' };
  maxRows?: number;
  className?: string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function SortableTable<T extends Record<string, any>>({
  data,
  columns,
  defaultSort,
  maxRows,
  className = '',
  onRowClick,
  emptyMessage = 'No data available'
}: SortableTableProps<T>) {
  const [sortConfig, setSortConfig] = useState(defaultSort || { key: '', direction: 'asc' as const });

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, String(sortConfig.key));
      const bValue = getNestedValue(b, String(sortConfig.key));

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  const handleSort = (key: keyof T | string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const getSortIcon = (columnKey: keyof T | string) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-500" />
      : <ChevronDown className="w-4 h-4 text-blue-500" />;
  };

  const displayData = maxRows ? sortedData.slice(0, maxRows) : sortedData;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-900 rounded">
        <div className="text-gray-400 text-center">
          <div className="text-lg mb-2">{emptyMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full text-sm bg-gray-900 rounded">
        <thead>
          <tr className="border-b border-gray-800">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`p-3 text-left font-medium text-gray-300 ${
                  column.sortable !== false ? 'cursor-pointer hover:bg-gray-800' : ''
                } ${column.width || ''}`}
                onClick={() => column.sortable !== false && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  <span>{column.label}</span>
                  {column.sortable !== false && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td key={String(column.key)} className="p-3 text-gray-200">
                  {column.render 
                    ? column.render(getNestedValue(row, String(column.key)), row)
                    : String(getNestedValue(row, String(column.key)) || '')
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {maxRows && data.length > maxRows && (
        <div className="text-gray-500 text-xs mt-2 text-center">
          Showing first {maxRows} rows out of {data.length}
        </div>
      )}
    </div>
  );
}

export default SortableTable;
