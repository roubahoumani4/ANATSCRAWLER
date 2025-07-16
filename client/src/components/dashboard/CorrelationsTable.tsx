import React from "react";

interface CorrelationsTableProps {
  correlations: any[];
}

const CorrelationsTable: React.FC<CorrelationsTableProps> = ({ correlations }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm bg-gray-900 rounded">
      <thead>
        <tr className="text-gray-400">
          <th className="p-2 text-left">Correlation</th>
          <th className="p-2 text-center">Risk</th>
          <th className="p-2 text-center">Data Elements</th>
        </tr>
      </thead>
      <tbody>
        {correlations.length === 0 && (
          <tr><td colSpan={3} className="text-center text-gray-500 p-4">No correlations found.</td></tr>
        )}
        {correlations.map((c: any, i: number) => (
          <tr key={i} className="border-b border-gray-800">
            <td className="p-2 text-coolWhite">{c.correlation || c.description || c.message || '-'}</td>
            <td className="p-2 text-center">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.risk === 'HIGH' ? 'bg-red-700/80 text-red-200' : c.risk === 'MEDIUM' ? 'bg-yellow-700/80 text-yellow-200' : c.risk === 'LOW' ? 'bg-blue-700/80 text-blue-200' : 'bg-green-700/80 text-green-200'}`}>{c.risk || '-'}</span>
            </td>
            <td className="p-2 text-center text-coolWhite">{c.data_elements || c.count || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default CorrelationsTable;
