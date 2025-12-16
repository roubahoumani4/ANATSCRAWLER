# 🛡️ Threat Intelligence Feed - Quick Start Guide

## What is the Threat Intelligence Feed?

The Threat Intelligence Feed is a real-time monitoring dashboard that tracks global security breaches and data exposures. It provides actionable intelligence about newly discovered breaches, affected accounts, and threat trends.

## 🎯 What You Can Do

### 1. Monitor Live Breaches
- View the latest security breaches as they're discovered
- See how many accounts were compromised
- Understand what data was exposed
- Check breach verification status

### 2. Analyze Breach Timeline
- Track breach discoveries over the past 12 months
- Identify trends in breach frequency
- Understand historical patterns

### 3. Track Trending Threats
- See the most impactful breach databases
- Sort by severity and recency
- Identify high-priority threats

### 4. View Geographic Distribution
- Understand where threats originate
- See country-based breach statistics
- Analyze global threat landscape

## 🚀 Getting Started

### Step 1: Access the Feature

**Via Navigation Menu:**
1. Log in to your ANATSCRAWLER account
2. Click on **"Dark Web Monitoring"** in the sidebar
3. Select **"Threat Intelligence"**

**Direct URL:**
```
http://your-domain/threat-intelligence
```

### Step 2: Understanding the Dashboard

#### Top Statistics Bar
You'll see 6 key metrics:
- **Total Breaches**: All breaches in the database
- **Accounts Compromised**: Total pwned accounts (12.8B+)
- **Recent Breaches**: Discovered in last 30 days
- **Critical Breaches**: Highest severity threats
- **Verified Breaches**: Confirmed by HaveIBeenPwned
- **Verification Rate**: Quality metric (%)

#### Main Tabs
- **Live Feed**: Real-time breach discoveries
- **Timeline**: Historical breach data
- **Trending**: Most impactful databases
- **Geographic**: Threat origin analysis

### Step 3: Explore Breach Details

1. **Browse the Live Feed**
   - Scroll through recent breach cards
   - Each card shows key information
   - Color-coded by severity (Red=Critical, Orange=High, etc.)

2. **Click a Breach Card**
   - Full details appear in the right sidebar
   - See complete data class list
   - View verification status
   - Check compromise metrics

3. **Check Data Classes**
   - See what types of data were exposed
   - Examples: Emails, Passwords, Names, Phone numbers
   - Sensitive data highlighted in red

## 🔍 How to Use Each Tab

### Live Feed Tab

**What it shows:**
- Most recent 50 breach discoveries
- Sorted by discovery date (newest first)
- Interactive cards with quick stats

**Best for:**
- Checking latest threats
- Understanding current risk landscape
- Detailed breach investigation

**How to use:**
1. Scroll through the breach list
2. Look for breaches relevant to your domain
3. Click cards to see full details
4. Note severity ratings and data types

### Timeline Tab

**What it shows:**
- Monthly aggregation of breaches
- Last 12 months of data
- Breach count and account totals per month

**Best for:**
- Identifying trends over time
- Seeing seasonal patterns
- Historical analysis

**How to use:**
1. Review each month's statistics
2. Compare breach volumes across months
3. Note spikes in activity
4. Click to see breach names

### Trending Tab

**What it shows:**
- Top 20 most impactful breaches
- Sorted by recency + impact
- Quick comparison cards

**Best for:**
- Identifying major threats
- Prioritizing response efforts
- Understanding severity distribution

**How to use:**
1. Review the trending databases
2. Focus on Critical and High severity
3. Check account counts
4. Note discovery dates

### Geographic Tab

**What it shows:**
- Country-based breach origins
- Percentage distribution
- Visual progress bars

**Best for:**
- Understanding threat geography
- Regional threat analysis
- Global threat overview

**How to use:**
1. Review top countries
2. Note percentage distributions
3. Compare relative threat levels
4. Identify regional patterns

## ⚙️ Control Features

### Auto-Refresh

**What it does:**
- Automatically updates data every 5 minutes
- Keeps you informed of latest breaches
- No manual intervention needed

**How to control:**
1. Look for "Live" or "Paused" button (top right)
2. **Live** (Green) = Auto-refresh ON
3. **Paused** (Gray) = Auto-refresh OFF
4. Click to toggle

**When to use:**
- **Live mode**: When actively monitoring
- **Paused mode**: When analyzing specific data

### Manual Refresh

**What it does:**
- Fetches latest data immediately
- Updates all tabs

**How to use:**
1. Click the 🔄 refresh icon (top right)
2. Wait for spinner to complete
3. View updated data

**When to use:**
- When you need immediate updates
- After pausing auto-refresh
- To verify latest information

## 📊 Understanding Severity Ratings

### Critical (Red)
```
🔴 CRITICAL
- 100M+ accounts affected
- Sensitive data exposed (passwords, SSN, etc.)
- Recent discovery (< 3 months)
- Verified breach
```

**Action:** Immediate attention required

### High (Orange)
```
🟠 HIGH
- 10M+ accounts affected
- Important data classes
- Moderately recent
```

**Action:** High priority review

### Medium (Yellow)
```
🟡 MEDIUM
- 1M+ accounts affected
- Standard data classes
- Older breach
```

**Action:** Standard monitoring

### Low (Blue)
```
🔵 LOW
- < 1M accounts affected
- Basic data only
- Historical breach
```

**Action:** Awareness only

## 🔐 What to Look For

### Red Flags in Breach Data

1. **Your Domain Appears**
   - Search for your organization's domain
   - Check if your company was affected
   - Review what data was compromised

2. **Passwords Exposed**
   - Highest risk data class
   - Requires immediate password resets
   - Enable 2FA on affected accounts

3. **Recent Discoveries**
   - "Discovered" date is recent
   - Threat is actively spreading
   - Quick response needed

4. **High Account Count**
   - Millions of accounts affected
   - Wider attack surface
   - More potential for credential reuse

5. **Unverified Breaches**
   - Missing ✓ verification icon
   - May be fabricated or spam
   - Exercise caution

## 📋 Best Practices

### Daily Monitoring
1. Check the Live Feed once per day
2. Review Recent Breaches stat (30-day count)
3. Look for your domain or email patterns
4. Enable auto-refresh during monitoring

### Weekly Analysis
1. Review the Timeline tab
2. Check trending databases
3. Note any severity spikes
4. Document findings

### Monthly Review
1. Analyze geographic distribution
2. Review 12-month timeline
3. Identify patterns and trends
4. Update security policies based on findings

### When a Breach Affects You
1. **Verify the breach details**
   - Click the breach card
   - Read full description
   - Check data classes

2. **Assess the impact**
   - What data was compromised?
   - How many accounts affected?
   - Is it verified?

3. **Take action**
   - Reset passwords immediately
   - Enable 2FA
   - Notify affected users
   - Monitor for suspicious activity

## 🎓 Tips & Tricks

### Efficient Navigation
- Use keyboard shortcuts (arrow keys) in lists
- Click cards for quick details
- Use tabs to switch between views
- Refresh regularly for latest data

### Data Interpretation
- Focus on verified breaches first
- Prioritize by severity rating
- Check "Discovered" date for urgency
- Review all data classes listed

### Performance Tips
- Pause auto-refresh when not needed
- Close detail sidebar when browsing
- Use manual refresh for control
- Monitor during business hours

## ❓ Common Questions

### Q: Is the data real or simulated?
**A:** The data is REAL when configured with HaveIBeenPwned API key. Without API key, sample data is shown with a warning.

### Q: How often is data updated?
**A:** Live mode refreshes every 5 minutes. HIBP updates their database as new breaches are verified.

### Q: Can I search for specific breaches?
**A:** Currently, browse the Live Feed or use browser search (Ctrl+F). Future version will have search functionality.

### Q: What does "Pwned" mean?
**A:** "Pwned" means compromised or exposed in a data breach. It's cybersecurity slang for "owned" by attackers.

### Q: Are passwords shown in plain text?
**A:** NO. The system shows that passwords were compromised, but never displays actual passwords.

### Q: Can I export this data?
**A:** Not in current version. Future updates will include PDF/CSV export.

### Q: What if I find my company's breach?
**A:** Contact your security team immediately. Reset passwords, enable 2FA, and follow your incident response plan.

## 🚨 When to Take Immediate Action

### Critical Situations

**Your domain appears in a recent breach:**
```
⚠️  URGENT ACTION REQUIRED
1. Verify breach authenticity
2. Reset all user passwords
3. Enable 2FA organization-wide
4. Notify affected users
5. Monitor accounts for suspicious activity
```

**Password data was compromised:**
```
⚠️  HIGH PRIORITY
1. Force password resets
2. Check for account takeovers
3. Review access logs
4. Implement additional security measures
```

**Large-scale breach (100M+ accounts):**
```
⚠️  MONITOR CLOSELY
1. Check if your users are affected
2. Watch for credential stuffing attacks
3. Increase security monitoring
4. Educate users about risks
```

## 📞 Getting Help

### Technical Issues
1. Check the documentation: `/docs/THREAT_INTELLIGENCE_SETUP.md`
2. Verify API key configuration
3. Check browser console for errors
4. Contact system administrator

### Understanding Breach Data
1. Click breach card for full details
2. Read the description carefully
3. Review data classes
4. Check verification status

### API Configuration
1. See: `/docs/THREAT_INTELLIGENCE_SETUP.md`
2. Get HIBP API key: https://haveibeenpwned.com/API/Key
3. Add to `server/config.env`
4. Restart server

## 🎯 Next Steps

1. **Explore the Dashboard**
   - Familiarize yourself with all tabs
   - Click through sample breaches
   - Understand the metrics

2. **Set Up Monitoring Routine**
   - Schedule daily checks
   - Enable auto-refresh during work hours
   - Create a response plan

3. **Configure Real Data (Optional)**
   - Get HaveIBeenPwned API key
   - Follow setup guide
   - Verify real data loads

4. **Stay Informed**
   - Check for platform updates
   - Read new breach descriptions
   - Follow security news

## 📚 Additional Resources

**External Links:**
- HaveIBeenPwned: https://haveibeenpwned.com/
- Troy Hunt's Blog: https://www.troyhunt.com/
- NIST Cybersecurity: https://www.nist.gov/cyberframework
- OWASP Top 10: https://owasp.org/www-project-top-ten/

**Platform Documentation:**
- Setup Guide: `/docs/THREAT_INTELLIGENCE_SETUP.md`
- Implementation Details: `/THREAT_INTELLIGENCE_IMPLEMENTATION.md`
- Visual Guide: `/THREAT_INTELLIGENCE_VISUAL_GUIDE.md`

---

**Remember:** The Threat Intelligence Feed is a monitoring tool. It shows you what breaches have been discovered, but you must take action to protect your organization and users.

**Stay vigilant. Stay secure.** 🛡️
