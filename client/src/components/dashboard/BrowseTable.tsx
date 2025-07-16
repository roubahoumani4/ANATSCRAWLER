import React from "react";

interface BrowseTableProps {
  data: any[];
}

const BrowseTable: React.FC<BrowseTableProps> = ({ data }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm bg-gray-900 rounded">
      <thead>
        <tr className="text-gray-400">
          <th className="p-2 text-left">Type</th>
          <th className="p-2 text-center">Unique Data Elements</th>
          <th className="p-2 text-center">Total Data Elements</th>
          <th className="p-2 text-center">Last Data Element</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 && (
          <tr><td colSpan={4} className="text-center text-gray-500 p-4">No data found.</td></tr>
        )}
        {data.map((row: any, i: number) => (
          <tr key={i} className="border-b border-gray-800">
            <td className="p-2 text-blue-300 underline cursor-pointer">{row.type || row.name || '-'}</td>
            <td className="p-2 text-center text-coolWhite">{row.unique || row.unique_data_elements || '-'}</td>
            <td className="p-2 text-center text-coolWhite">{row.total || row.total_data_elements || '-'}</td>
            <td className="p-2 text-center text-coolWhite">{row.last || row.last_data_element || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default BrowseTable;
