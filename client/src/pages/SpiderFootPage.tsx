import * as React from 'react';

function SpiderFootPage() {
  const base = '/osint';
  return (
    <div className="w-full h-[calc(100vh-80px)] bg-black/90 rounded-md overflow-hidden border border-gray-800">
      <iframe
        title="SpiderFoot"
        src={base}
        className="w-full h-full"
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-downloads"
      />
    </div>
  );
}

export default SpiderFootPage;
