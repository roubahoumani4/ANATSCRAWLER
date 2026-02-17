# OS Audit Feature - Quick Start Guide

## What is OS Audit?

OS Audit is a security monitoring feature integrated with Lynis that allows you to:
- Register your machines and servers
- Run automated security audits
- Track security scores and compliance
- Get detailed findings and recommendations
- Monitor audit history over time

## Getting Started

### Step 1: Register Your First Machine

1. Navigate to **OS Audit** in the main menu (Shield icon)
2. Click **"Register Machine"** button
3. Fill in the following details:
   - **Your Name**: Your actual name (appears in all reports)
   - **Machine Name**: Friendly name for this machine (e.g., "Production Server 1")
   - **IP Address**: The IP address of the machine (e.g., 192.168.1.100)
   - **Operating System** (optional): e.g., Ubuntu 22.04 LTS
   - **Machine Hostname** (optional): e.g., prod-server-01

4. Click **"Register Machine"**
5. An installation dialog will appear with instructions

### Step 2: Install the Audit Agent

1. In the installation dialog, click **"Download Installation Script"**
2. A script file will be downloaded: `os-audit-agent-[machineId].sh`
3. Transfer this file to the target machine
4. On the target machine, run:
   ```bash
   sudo bash os-audit-agent-[machineId].sh
   ```
5. The script will:
   - Install required dependencies
   - Install Lynis security auditor
   - Configure the audit agent
   - Set up automatic daily audits

### Step 3: View Audit Reports

1. After the agent installs and runs its first audit, go to the **"Audit Reports"** tab
2. Reports will appear with:
   - **Machine Name**: The machine being audited
   - **Score**: Overall security score (0-100)
   - **Warnings**: Number of security warnings found
   - **Suggestions**: Number of improvement suggestions
   - **Date**: When the audit was performed

3. Click the **Eye icon** on any report to view detailed findings

## Dashboard Statistics

The dashboard shows:
- **Total Machines**: How many machines you've registered
- **Active Agents**: How many agents are currently reporting
- **Total Reports**: Total number of audits performed
- **Avg Score**: Average security score across all machines

## Machine Status Indicators

- **Active** (Green): Agent is actively reporting
- **Inactive** (Red): Agent hasn't reported recently
- **Pending** (Yellow): Waiting for first agent report

## Agent Features

### Automatic Daily Audits
- Audits run automatically every day at 2 AM
- Results are automatically sent to the server
- Accessible via dashboard reports

### Manual Audits
To run an audit manually on the target machine:
```bash
sudo /opt/anat-os-audit/agent.sh
```

### View Agent Logs
```bash
tail -f /opt/anat-os-audit/agent.log
```

## Understanding Audit Reports

### Audit Score
- Range: 0-100
- Higher is better
- Indicates overall system hardening level
- Includes security configurations, patches, and best practices

### Warnings
- Critical security issues
- Should be addressed immediately
- Examples: Root login allowed, weak SSH configurations

### Suggestions
- Non-critical improvements
- Enhance security posture
- Examples: Enable automatic updates, configure firewall rules

### Findings Detail
Each finding includes:
- **Test ID**: Unique identifier for the test
- **Description**: What was tested
- **Result**: PASS, WARNING, SUGGESTION, or INFO
- **Severity**: low, medium, high, or critical
- **Recommendation**: How to fix or improve

## Machine Management

### Viewing Machine Details
1. Go to **"Machines"** tab
2. Click on any machine to see:
   - IP address
   - Owner name
   - Operating system
   - Last audit date
   - Agent status

### Updating Machine Info
1. Click on a machine
2. Click **Edit** button (pencil icon)
3. Update any field
4. Click **Save**

### Deleting a Machine
1. Click the **Delete** button (trash icon)
2. Confirm deletion
   - **Note**: This also deletes all associated reports

### Downloading Agent Again
1. Click the **Download** button (down arrow icon)
2. This allows you to reinstall or copy the agent to another machine

## Tips & Best Practices

### For Best Results:
1. **Keep Agents Updated**: Periodically check for updated agent scripts
2. **Monitor Regularly**: Check the dashboard weekly for audit trends
3. **Act on Warnings**: Address critical warnings promptly
4. **Track Improvements**: Monitor score changes over time
5. **Test Before Production**: Test agent installation on non-critical systems first

### Common Scenarios:

**After Initial Installation**
- First audit may take 5-10 minutes
- Results will appear in dashboard after completion
- Check agent logs if results don't appear

**Agent Stopped Reporting**
- SSH to the machine
- Check logs: `tail -f /opt/anat-os-audit/agent.log`
- Manually run audit: `sudo /opt/anat-os-audit/agent.sh`
- Verify server connectivity

**Multiple Machines**
- Register each machine separately
- Each gets unique installation token
- Download agent script for each machine
- Install on each machine individually

**Comparing Scores**
- Compare same machine over time
- Or compare different machines
- Use the dashboard to spot patterns
- Look for improvement trends

## System Requirements

### On ANATSCRAWLER Server
- Node.js and npm
- MongoDB
- Running ANATSCRAWLER application

### On Target Machines
- Linux/Unix-based operating system
- Internet connectivity to server
- Root/sudo access (for agent installation)
- ~100MB free disk space for Lynis
- curl or wget for report submission

### Supported Operating Systems
- Ubuntu/Debian
- RHEL/CentOS/Fedora
- Arch Linux
- Any systemd-based Linux distribution

## Security & Privacy

### Data Protection
- Machine IDs are unique and non-guessable
- Installation tokens are one-time use
- Audit reports are user-isolated
- IP addresses are stored securely
- Owner names help identify audit context

### What Gets Collected
- System information (OS, hostname, IP)
- Security configurations
- Installed packages and versions
- System hardening metrics
- Audit findings and recommendations

### What Doesn't Get Collected
- User data or passwords
- Personal files or content
- Sensitive application data
- SSH keys or certificates

## Troubleshooting

### "Agent Installation Failed"
```bash
# Check internet connection
ping 8.8.8.8

# Run with elevated privileges
sudo bash os-audit-agent-[machineId].sh

# Check disk space
df -h
```

### "Report Not Appearing"
```bash
# Check agent logs
cat /opt/anat-os-audit/agent.log

# Verify token is correct
grep "AGENT_TOKEN" /opt/anat-os-audit/agent.sh

# Run audit manually
sudo /opt/anat-os-audit/agent.sh
```

### "Agent Shows Inactive"
```bash
# Check if cron job is configured
crontab -l

# Manually trigger audit
sudo /opt/anat-os-audit/agent.sh

# Check server connectivity
curl -X POST http://server-ip:3000/api/v1/os-audit/agent/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"agentInstallationToken": "your-token-here"}'
```

### "Permission Denied"
```bash
# Make sure you use sudo
sudo bash os-audit-agent-[machineId].sh

# Or add yourself to sudoers (advanced)
sudo visudo
```

## Support & Help

1. **Check Logs**: Review server and agent logs for errors
2. **Verify Setup**: Ensure all prerequisites are met
3. **Test Connectivity**: Verify network connectivity between machines and server
4. **Review This Guide**: Check if your question is answered here
5. **Contact Support**: Reach out to the ANATSCRAWLER team

## Next Steps

After installing your first agent:
1. Review the initial audit report
2. Identify and address any critical warnings
3. Set up monitoring for regular compliance
4. Add additional machines as needed
5. Track improvements over time

Enjoy monitoring your system security with OS Audit! 🛡️
