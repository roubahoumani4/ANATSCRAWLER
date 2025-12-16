# Threat Intelligence Feed Configuration

This document explains how to configure real threat intelligence data sources for the Threat Intelligence Feed feature.

## Overview

The Threat Intelligence Feed integrates with real-world breach databases and threat intelligence APIs to provide:
- Live feed of newly discovered breaches
- Timeline of when credentials were exposed
- Trending breach databases
- Breach severity ratings
- Geographic distribution of threats

## Data Sources

### 1. HaveIBeenPwned (HIBP)

**Primary data source for breach information**

- Website: https://haveibeenpwned.com/API/v3
- Sign up: https://haveibeenpwned.com/API/Key

#### How to get an API key:

1. Visit https://haveibeenpwned.com/API/Key
2. Purchase an API key (supports the service)
3. Add to your environment configuration

#### Configuration:

Add to `server/config.env`:
```bash
HIBP_API_KEY=your_api_key_here
```

**Features provided:**
- Comprehensive breach database (600+ breaches)
- 12+ billion compromised accounts
- Verified breach data
- Data classification (passwords, emails, etc.)
- Breach dates and discovery dates
- Real-time updates

### 2. VirusTotal (Optional)

**Additional threat intelligence and malware data**

- Website: https://www.virustotal.com/
- API: https://developers.virustotal.com/reference/overview

#### How to get an API key:

1. Create account at https://www.virustotal.com/
2. Go to your profile settings
3. Copy your API key

#### Configuration:

Add to `server/config.env`:
```bash
VT_API_KEY=your_virustotal_api_key_here
```

**Features provided:**
- Malware analysis
- URL/Domain reputation
- File hash analysis
- Threat scoring

## Mock Data Mode

If API keys are not configured, the system automatically falls back to **mock data mode**:

- Sample breach data from recent major incidents
- Simulated timeline data for the last 12 months
- Trending database examples
- Geographic distribution estimates

**Mock data includes:**
- LinkedIn breach (165M accounts)
- Twitter/X breach (235M accounts)
- Adobe breach (153M accounts)
- And more...

## Environment Setup

### Development Environment

1. Copy the example environment file:
```bash
cp server/config.dev.env server/config.env
```

2. Add your API keys:
```bash
# Threat Intelligence APIs
HIBP_API_KEY=your_hibp_api_key_here
VT_API_KEY=your_virustotal_api_key_here
```

3. Restart the server:
```bash
npm run dev:server
```

### Production Environment

1. Set environment variables in your production system:

```bash
export HIBP_API_KEY=your_hibp_api_key_here
export VT_API_KEY=your_virustotal_api_key_here
```

2. Or add to PM2 ecosystem configuration:

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'anatscrawler',
    script: 'dist/index.js',
    env: {
      HIBP_API_KEY: 'your_hibp_api_key_here',
      VT_API_KEY: 'your_virustotal_api_key_here',
      // ... other env vars
    }
  }]
}
```

## API Endpoints

The Threat Intelligence feature exposes these endpoints:

### GET /api/v1/threat-intel/recent-breaches
Returns the 50 most recent breach discoveries

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "LinkedIn2023",
      "name": "LinkedIn",
      "domain": "linkedin.com",
      "breachDate": "2023-11-15",
      "addedDate": "2023-12-01",
      "pwnCount": 165000000,
      "description": "...",
      "dataClasses": ["Email addresses", "Names", ...],
      "isVerified": true,
      "severity": "critical"
    }
  ],
  "timestamp": "2025-12-16T10:00:00Z",
  "source": "HaveIBeenPwned"
}
```

### GET /api/v1/threat-intel/breach-timeline
Returns breach timeline data for visualization

**Query params:**
- `days` (default: 365) - Number of days to look back

### GET /api/v1/threat-intel/trending-databases
Returns the 20 most impactful and recent breach databases

### GET /api/v1/threat-intel/geographic-distribution
Returns geographic distribution of threat origins

### GET /api/v1/threat-intel/live-stats
Returns real-time statistics about the threat landscape

## Auto-Refresh

The frontend automatically refreshes data every **5 minutes** when the "Live" mode is active.

Users can:
- Manually refresh using the refresh button
- Toggle auto-refresh on/off
- View last update timestamp

## Rate Limiting

**HIBP API Limits:**
- Free tier: Not available
- Paid API: 10 requests per minute per IP
- Our implementation caches HIBP responses

**Best Practices:**
- Enable auto-refresh only when needed
- Use manual refresh for on-demand updates
- HIBP data is updated periodically (not real-time)

## Troubleshooting

### "Mock Data" warning appears

**Problem:** API keys not configured or invalid

**Solution:**
1. Verify API keys are set in environment
2. Check API key is valid by testing directly
3. Ensure server has been restarted after adding keys

### No data appears

**Problem:** API request failing

**Solution:**
1. Check browser console for errors
2. Check server logs for API errors
3. Verify network connectivity
4. Test API endpoints directly with curl

### Rate limit errors

**Problem:** Too many requests to HIBP

**Solution:**
1. Reduce auto-refresh frequency
2. Implement additional caching
3. Upgrade to higher tier API plan

## Data Privacy & Security

**Important considerations:**

1. **API Keys**: Never commit API keys to version control
2. **Data Storage**: Breach data is fetched on-demand, not stored
3. **User Privacy**: No personal breach data is queried without explicit user request
4. **Compliance**: HIBP data is for breach notification purposes only

## Cost Considerations

### HaveIBeenPwned API
- **Cost**: ~$3.50 USD per month
- **Included**: Unlimited breach list queries
- **Updates**: Real-time as breaches are added

### VirusTotal API
- **Free tier**: 500 requests/day, 4 requests/minute
- **Premium**: Starting at $10/month for higher limits

## Future Enhancements

Potential additional data sources:

1. **Shodan** - Internet-connected device intelligence
2. **GreyNoise** - Internet scanner and malicious IP data
3. **AlienVault OTX** - Open threat exchange
4. **ThreatCrowd** - Threat intelligence search engine
5. **URLhaus** - Malware URL sharing
6. **PhishTank** - Phishing URL database

## Support

For issues or questions:
- HIBP Support: https://haveibeenpwned.com/API/v3#Support
- VirusTotal Support: https://support.virustotal.com/

## Credits

Data provided by:
- **HaveIBeenPwned** by Troy Hunt
- **VirusTotal** by Chronicle Security (Google)
