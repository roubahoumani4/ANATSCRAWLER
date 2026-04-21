// Helper for fetching dark-web domain-monitoring breach data and reusing it
// inside the OSINT Assessment flow (REAL DATA BREACH ANALYSIS section).
//
// This mirrors the logic used by `DomainMonitoringPage.tsx` so that running an
// assessment against a target automatically pulls the same breach results that
// the user would see by manually searching the Domain Monitoring page.

export interface DarkWebBreachResult {
  email: string;
  password: string;
  database_source: string;
  score: number;
}

export interface DarkWebBreachStats {
  domain: string;
  totalExposed: number;
  databases: Record<string, number>;
  results: DarkWebBreachResult[];
  riskScore: number;
  passwordStrength: {
    weak: number;
    medium: number;
    strong: number;
  };
  error?: string;
}

// Extract the registrable domain from a user-supplied target. Accepts things
// like `https://www.itworks.me.com/path`, `www.itworks.me.com`, or raw
// `itworks.me.com` and returns the lowercased host without scheme/path.
export const extractDomainFromTarget = (target: string): string => {
  if (!target) return '';
  let t = target.trim().toLowerCase();
  // Strip scheme
  t = t.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  // Strip credentials
  t = t.replace(/^[^@/]*@/, '');
  // Strip path, query, fragment, port
  t = t.split('/')[0].split('?')[0].split('#')[0].split(':')[0];
  // Strip leading `www.`
  t = t.replace(/^www\./, '');
  return t;
};

// Fetch dark-web breach data for a given domain using the same backend
// endpoint and post-processing as the Domain Monitoring page.
export const fetchDarkWebBreachData = async (
  rawTarget: string,
  opts: { timeoutMs?: number } = {}
): Promise<DarkWebBreachStats> => {
  const domain = extractDomainFromTarget(rawTarget);
  const empty: DarkWebBreachStats = {
    domain,
    totalExposed: 0,
    databases: {},
    results: [],
    riskScore: 0,
    passwordStrength: { weak: 0, medium: 0, strong: 0 },
  };

  if (!domain) {
    return { ...empty, error: 'Invalid target' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? 20000
  );

  try {
    const response = await fetch('/api/v1/search/darkweb-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `@${domain}`, limit: 500 }),
      signal: controller.signal,
      credentials: 'include',
    });

    if (!response.ok) {
      return { ...empty, error: `Search failed (HTTP ${response.status})` };
    }

    const data = await response.json();
    if (!data?.success || !Array.isArray(data.results)) {
      return { ...empty, error: 'No results returned' };
    }

    const results: DarkWebBreachResult[] = data.results
      .filter(
        (r: any) =>
          r?.email &&
          typeof r.email === 'string' &&
          r.email.toLowerCase().includes(`@${domain}`)
      )
      .map((r: any) => ({
        email: r.email || r.name || '',
        password: r.password || '',
        database_source:
          r.database_source && r.database_source !== 'Unknown'
            ? r.database_source
            : r.index || 'Unknown',
        score: r.score || 0,
      }));

    const databases: Record<string, number> = {};
    let weak = 0;
    let medium = 0;
    let strong = 0;

    results.forEach((result) => {
      if (result.database_source && result.database_source !== 'Unknown') {
        databases[result.database_source] =
          (databases[result.database_source] || 0) + 1;
      }
      const pwd = result.password;
      if (!pwd) {
        weak++;
      } else if (
        pwd.length < 8 ||
        /^[0-9]+$/.test(pwd) ||
        pwd.toLowerCase() === pwd
      ) {
        weak++;
      } else if (
        pwd.length >= 12 &&
        /[A-Z]/.test(pwd) &&
        /[0-9]/.test(pwd) &&
        /[^A-Za-z0-9]/.test(pwd)
      ) {
        strong++;
      } else {
        medium++;
      }
    });

    const accountScore = Math.min(60, results.length * 2);
    const weakPasswordScore = Math.min(30, weak * 3);
    const databaseScore = Math.min(10, Object.keys(databases).length * 5);
    const riskScore = Math.min(
      100,
      Math.round(accountScore + weakPasswordScore + databaseScore)
    );

    return {
      domain,
      totalExposed: results.length,
      databases,
      results: results.slice(0, 100),
      riskScore,
      passwordStrength: { weak, medium, strong },
    };
  } catch (error: any) {
    return { ...empty, error: error?.message || String(error) };
  } finally {
    clearTimeout(timeout);
  }
};
