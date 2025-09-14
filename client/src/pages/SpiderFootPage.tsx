import * as React from 'react';

function SpiderFootPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const base = '/osint';

  // Check OSINT health on mount
  React.useEffect(() => {
    const checkHealth = async () => {
      try {
        console.log('🔍 Checking OSINT health...');
        
        // First, test if main server is responding at all
        try {
          console.log('🔍 Testing main server health first...');
          const mainHealthResponse = await fetch('/health');
          console.log('📊 Main server health response:', mainHealthResponse.status);
          
          if (!mainHealthResponse.ok) {
            throw new Error(`Main server not responding: ${mainHealthResponse.status}`);
          }
          
          const mainHealthData = await mainHealthResponse.json();
          console.log('✅ Main server is healthy:', mainHealthData);
        } catch (mainError) {
          console.error('❌ Main server health check failed:', mainError);
          throw new Error(`Main server unavailable: ${mainError instanceof Error ? mainError.message : 'Unknown error'}`);
        }
        
        // Now test OSINT specifically
        const response = await fetch('/osint/health');
        
        if (!response.ok) {
          // Try to get error details from response
          try {
            const errorData = await response.json();
            console.error('OSINT health check failed with details:', errorData);
            throw new Error(`OSINT engine not ready: ${response.status} - ${errorData.error || errorData.debug?.targetUrl || 'Unknown error'}`);
          } catch (parseError) {
            console.error('OSINT health check failed (no JSON):', parseError);
            throw new Error(`OSINT engine not ready: ${response.status}`);
          }
        }
        
        const healthData = await response.json();
        console.log('✅ OSINT health check passed:', healthData);
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
        <div className="text-center p-8 max-w-lg">
          <div className="text-red-400 text-xl mb-4">⚠️ OSINT Engine Unavailable</div>
          <div className="text-gray-300 mb-6 text-sm font-mono bg-gray-800 p-3 rounded">{error}</div>
          <div className="space-y-3">
            <button 
              onClick={() => {
                setError(null);
                setIsLoading(true);
                // Retry health check
                const checkHealth = async () => {
                  try {
                    const response = await fetch('/osint/health');
                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(`OSINT engine not ready: ${response.status} - ${errorData.error || 'Unknown error'}`);
                    }
                    setIsLoading(false);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to connect to OSINT engine');
                    setIsLoading(false);
                  }
                };
                checkHealth();
              }} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-3"
            >
              Retry Health Check
            </button>
            <button 
              onClick={() => {
                setError(null);
                setIsLoading(false);
                // Force load anyway
              }} 
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Load Anyway (Debug)
            </button>
          </div>
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
