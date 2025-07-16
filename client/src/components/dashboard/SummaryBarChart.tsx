import React from "react";

const SummaryBarChart = ({ data }: { data: any }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-gray-500">No summary data available.</div>;
  }
  return (
    <div className="flex gap-2 items-end h-32">
      {data.map((row: any, i: number) => (
        <div key={i} className="flex flex-col items-center justify-end">
          <div className="bg-blue-700 rounded w-6" style={{ height: `${Math.min(100, (row.total || row.total_data_elements || 0) * 2)}%` }}></div>
          <span className="text-xs text-coolWhite mt-1">{row.type || row.name || '-'}</span>
        </div>
      ))}
    </div>
  );
};

export default SummaryBarChart;
