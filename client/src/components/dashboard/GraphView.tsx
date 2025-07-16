import React from "react";

const GraphView = ({ data }: { data: any }) => {
  if (!data) {
    return <div className="text-gray-500">No graph data available.</div>;
  }
  return (
    <pre className="text-xs text-gray-200 bg-gray-800 rounded p-4 overflow-x-auto max-h-72 w-full">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

export default GraphView;
