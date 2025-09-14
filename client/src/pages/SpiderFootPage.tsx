import * as React from 'react';

function SpiderFootPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const base = '/osint';

  // Check OSINT health on mount
  React.useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/osint/health');
        if (!response.ok) {
          throw new Error(`OSINT engine not ready: ${response.status}`);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('OSINT health check failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to OSINT engine');
        setIsLoading(false);
      }
    };

    checkHealth();
  }, []);

  if (error) {
    return (
      <div className="w-full h-[calc(100vh-80px)] bg-black/90 rounded-md border border-gray-800 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-400 text-xl mb-4">⚠️ OSINT Engine Unavailable</div>
          <div className="text-gray-300 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-[calc(100vh-80px)] bg-black/90 rounded-md border border-gray-800 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin text-4xl mb-4">🕷️</div>
          <div className="text-blue-400 text-xl mb-2">Starting SpiderFoot OSINT Engine</div>
          <div className="text-gray-400">This may take a moment...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-80px)] bg-black/90 rounded-md overflow-hidden border border-gray-800">
      <iframe
        title="SpiderFoot OSINT Engine"
        src={base}
        className="w-full h-full"
        sandbox="allow-scripts allow-forms allow-popups allow-downloads"
        allow="fullscreen"
        onLoad={() => console.log('SpiderFoot interface loaded')}
        onError={() => setError('Failed to load SpiderFoot interface')}
      />
    </div>
  );
}

export default SpiderFootPage;
