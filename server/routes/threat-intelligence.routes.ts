import { Router } from 'express';
import axios from 'axios';
import type { Request, Response } from 'express';

const router = Router();

/**
 * Threat Intelligence Feed Routes
 * Provides real-time data from various breach and threat intelligence sources
 */

// HaveIBeenPwned API configuration
const HIBP_API_KEY = process.env.HIBP_API_KEY || '';
const HIBP_BASE_URL = 'https://haveibeenpwned.com/api/v3';

// VirusTotal API configuration
const VT_API_KEY = process.env.VT_API_KEY || '';
const VT_BASE_URL = 'https://www.virustotal.com/api/v3';

/**
 * GET /api/v1/threat-intel/recent-breaches
 * Fetches recent breach data from HaveIBeenPwned
 */
router.get('/recent-breaches', async (req: Request, res: Response) => {
  try {
    // Fetch all breaches from HIBP (cached on their end, updates periodically)
    const response = await axios.get(`${HIBP_BASE_URL}/breaches`, {
      headers: {
        'hibp-api-key': HIBP_API_KEY,
        'user-agent': 'ANATSCRAWLER-ThreatIntel'
      }
    });

    const breaches = response.data;
    
    // Sort by breach date (most recent first)
    const sortedBreaches = breaches
      .sort((a: any, b: any) => new Date(b.BreachDate).getTime() - new Date(a.BreachDate).getTime())
      .slice(0, 50); // Get top 50 most recent

    // Transform data for our UI
    const transformedBreaches = sortedBreaches.map((breach: any) => ({
      id: breach.Name,
      name: breach.Title,
      domain: breach.Domain,
      breachDate: breach.BreachDate,
      addedDate: breach.AddedDate,
      modifiedDate: breach.ModifiedDate,
      pwnCount: breach.PwnCount,
      description: breach.Description,
      dataClasses: breach.DataClasses,
      isVerified: breach.IsVerified,
      isFabricated: breach.IsFabricated,
      isSensitive: breach.IsSensitive,
      isRetired: breach.IsRetired,
      isSpamList: breach.IsSpamList,
      isMalware: breach.IsMalware,
      logoPath: breach.LogoPath,
      severity: calculateSeverity(breach)
    }));

    res.json({
      success: true,
      data: transformedBreaches,
      timestamp: new Date().toISOString(),
      source: 'HaveIBeenPwned'
    });

  } catch (error: any) {
    console.error('Error fetching breach data:', error.message);
    
    // If HIBP API is not configured, return mock data with warning
    if (!HIBP_API_KEY) {
      return res.json({
        success: true,
        data: getMockBreachData(),
        timestamp: new Date().toISOString(),
        source: 'Mock Data (Configure HIBP_API_KEY for real data)',
        warning: 'HIBP API key not configured. Showing sample data.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch breach data',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/threat-intel/breach-timeline
 * Returns timeline data for breach visualization
 */
router.get('/breach-timeline', async (req: Request, res: Response) => {
  try {
    const { days = 365 } = req.query;
    const daysAgo = parseInt(days as string);
    
    const response = await axios.get(`${HIBP_BASE_URL}/breaches`, {
      headers: {
        'hibp-api-key': HIBP_API_KEY,
        'user-agent': 'ANATSCRAWLER-ThreatIntel'
      }
    });

    const breaches = response.data;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    // Filter breaches within the time range
    const recentBreaches = breaches.filter((breach: any) => 
      new Date(breach.AddedDate) >= cutoffDate
    );

    // Group by month
    const timelineData = groupByMonth(recentBreaches);

    res.json({
      success: true,
      data: timelineData,
      timestamp: new Date().toISOString(),
      source: 'HaveIBeenPwned'
    });

  } catch (error: any) {
    if (!HIBP_API_KEY) {
      return res.json({
        success: true,
        data: getMockTimelineData(),
        timestamp: new Date().toISOString(),
        source: 'Mock Data',
        warning: 'HIBP API key not configured. Showing sample data.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch timeline data',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/threat-intel/trending-databases
 * Returns trending breach databases and threat sources
 */
router.get('/trending-databases', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${HIBP_BASE_URL}/breaches`, {
      headers: {
        'hibp-api-key': HIBP_API_KEY,
        'user-agent': 'ANATSCRAWLER-ThreatIntel'
      }
    });

    const breaches = response.data;
    
    // Sort by impact (pwn count) and recency
    const trending = breaches
      .filter((b: any) => !b.IsRetired && !b.IsSpamList)
      .sort((a: any, b: any) => {
        const scoreA = calculateTrendingScore(a);
        const scoreB = calculateTrendingScore(b);
        return scoreB - scoreA;
      })
      .slice(0, 20);

    res.json({
      success: true,
      data: trending.map((breach: any) => ({
        name: breach.Title,
        domain: breach.Domain,
        pwnCount: breach.PwnCount,
        addedDate: breach.AddedDate,
        severity: calculateSeverity(breach),
        dataTypes: breach.DataClasses.length
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    if (!HIBP_API_KEY) {
      return res.json({
        success: true,
        data: getMockTrendingData(),
        timestamp: new Date().toISOString(),
        source: 'Mock Data'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending data'
    });
  }
});

/**
 * GET /api/v1/threat-intel/geographic-distribution
 * Returns geographic distribution of threats (based on domain origins and breach data)
 */
router.get('/geographic-distribution', async (req: Request, res: Response) => {
  try {
    // This would ideally integrate with GeoIP and WHOIS data
    // For now, we'll provide intelligent estimates based on domain analysis
    
    const response = await axios.get(`${HIBP_BASE_URL}/breaches`, {
      headers: {
        'hibp-api-key': HIBP_API_KEY,
        'user-agent': 'ANATSCRAWLER-ThreatIntel'
      }
    });

    const breaches = response.data;
    const geoDistribution = analyzeGeographicDistribution(breaches);

    res.json({
      success: true,
      data: geoDistribution,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    if (!HIBP_API_KEY) {
      return res.json({
        success: true,
        data: getMockGeoData(),
        timestamp: new Date().toISOString(),
        source: 'Mock Data'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch geographic data'
    });
  }
});

/**
 * GET /api/v1/threat-intel/live-stats
 * Returns real-time statistics about the threat landscape
 */
router.get('/live-stats', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${HIBP_BASE_URL}/breaches`, {
      headers: {
        'hibp-api-key': HIBP_API_KEY,
        'user-agent': 'ANATSCRAWLER-ThreatIntel'
      }
    });

    const breaches = response.data;
    
    // Calculate statistics
    const totalBreaches = breaches.length;
    const totalAccounts = breaches.reduce((sum: number, b: any) => sum + b.PwnCount, 0);
    const recentBreaches = breaches.filter((b: any) => {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return new Date(b.AddedDate) >= monthAgo;
    }).length;
    
    const criticalBreaches = breaches.filter((b: any) => 
      calculateSeverity(b) === 'critical'
    ).length;

    const verifiedBreaches = breaches.filter((b: any) => b.IsVerified).length;

    res.json({
      success: true,
      data: {
        totalBreaches,
        totalAccounts,
        recentBreaches,
        criticalBreaches,
        verifiedBreaches,
        verificationRate: ((verifiedBreaches / totalBreaches) * 100).toFixed(1)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    if (!HIBP_API_KEY) {
      return res.json({
        success: true,
        data: {
          totalBreaches: 617,
          totalAccounts: 12847362891,
          recentBreaches: 23,
          criticalBreaches: 89,
          verifiedBreaches: 523,
          verificationRate: '84.7'
        },
        timestamp: new Date().toISOString(),
        source: 'Mock Data'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Helper functions

function calculateSeverity(breach: any): 'critical' | 'high' | 'medium' | 'low' {
  let score = 0;
  
  // Pwn count factor
  if (breach.PwnCount > 100000000) score += 4;
  else if (breach.PwnCount > 10000000) score += 3;
  else if (breach.PwnCount > 1000000) score += 2;
  else score += 1;
  
  // Sensitive data factor
  if (breach.IsSensitive) score += 2;
  
  // Data classes factor
  const sensitiveClasses = ['Passwords', 'Credit cards', 'SSN', 'Bank account numbers', 'Health records'];
  const hasSensitiveData = breach.DataClasses.some((dc: string) => 
    sensitiveClasses.some(sc => dc.toLowerCase().includes(sc.toLowerCase()))
  );
  if (hasSensitiveData) score += 2;
  
  // Verification factor
  if (breach.IsVerified) score += 1;
  
  // Recency factor
  const monthsAgo = (new Date().getTime() - new Date(breach.AddedDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsAgo < 3) score += 2;
  else if (monthsAgo < 12) score += 1;
  
  if (score >= 8) return 'critical';
  if (score >= 6) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function calculateTrendingScore(breach: any): number {
  const recency = (new Date().getTime() - new Date(breach.AddedDate).getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 365 - recency) / 365;
  const impactScore = Math.log10(breach.PwnCount + 1) / 10;
  
  return recencyScore * 0.6 + impactScore * 0.4;
}

function groupByMonth(breaches: any[]): any[] {
  const grouped: { [key: string]: any } = {};
  
  breaches.forEach(breach => {
    const date = new Date(breach.AddedDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        month: key,
        breaches: [],
        totalAccounts: 0,
        count: 0
      };
    }
    
    grouped[key].breaches.push(breach.Title);
    grouped[key].totalAccounts += breach.PwnCount;
    grouped[key].count++;
  });
  
  return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
}

function analyzeGeographicDistribution(breaches: any[]): any[] {
  // Simplified geo analysis based on domain TLDs and known origins
  const geoData: { [key: string]: number } = {
    'United States': 0,
    'China': 0,
    'Russia': 0,
    'India': 0,
    'Brazil': 0,
    'United Kingdom': 0,
    'Germany': 0,
    'France': 0,
    'Other': 0
  };
  
  breaches.forEach(breach => {
    const domain = breach.Domain || '';
    
    // Simple heuristic based on TLD and known patterns
    if (domain.endsWith('.com') || domain.endsWith('.us')) geoData['United States']++;
    else if (domain.endsWith('.cn')) geoData['China']++;
    else if (domain.endsWith('.ru')) geoData['Russia']++;
    else if (domain.endsWith('.in')) geoData['India']++;
    else if (domain.endsWith('.br')) geoData['Brazil']++;
    else if (domain.endsWith('.uk')) geoData['United Kingdom']++;
    else if (domain.endsWith('.de')) geoData['Germany']++;
    else if (domain.endsWith('.fr')) geoData['France']++;
    else geoData['Other']++;
  });
  
  return Object.entries(geoData)
    .map(([country, count]) => ({ country, count, percentage: 0 }))
    .sort((a, b) => b.count - a.count)
    .map(item => ({
      ...item,
      percentage: ((item.count / breaches.length) * 100).toFixed(1)
    }));
}

// Mock data functions for when API keys aren't configured

function getMockBreachData() {
  return [
    {
      id: 'LinkedIn2023',
      name: 'LinkedIn',
      domain: 'linkedin.com',
      breachDate: '2023-11-15',
      addedDate: '2023-12-01',
      pwnCount: 165000000,
      description: 'A significant data breach exposing user profile information',
      dataClasses: ['Email addresses', 'Names', 'Phone numbers', 'Professional information'],
      isVerified: true,
      severity: 'critical'
    },
    {
      id: 'Twitter2023',
      name: 'Twitter/X',
      domain: 'twitter.com',
      breachDate: '2023-10-20',
      addedDate: '2023-11-05',
      pwnCount: 235000000,
      description: 'Major breach affecting millions of user accounts',
      dataClasses: ['Email addresses', 'Usernames', 'Phone numbers'],
      isVerified: true,
      severity: 'critical'
    }
  ];
}

function getMockTimelineData() {
  const data: any[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    data.push({
      month,
      count: Math.floor(Math.random() * 20) + 5,
      totalAccounts: Math.floor(Math.random() * 50000000) + 10000000
    });
  }
  return data;
}

function getMockTrendingData() {
  return [
    { name: 'LinkedIn', domain: 'linkedin.com', pwnCount: 165000000, severity: 'critical', dataTypes: 8 },
    { name: 'Twitter', domain: 'twitter.com', pwnCount: 235000000, severity: 'critical', dataTypes: 6 },
    { name: 'Adobe', domain: 'adobe.com', pwnCount: 153000000, severity: 'high', dataTypes: 7 }
  ];
}

function getMockGeoData() {
  return [
    { country: 'United States', count: 245, percentage: '42.3' },
    { country: 'China', count: 87, percentage: '15.0' },
    { country: 'Russia', count: 64, percentage: '11.0' },
    { country: 'India', count: 52, percentage: '9.0' },
    { country: 'Other', count: 131, percentage: '22.7' }
  ];
}

export default router;
