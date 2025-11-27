# 🛠️ ANATSCRAWLER Operations Scripts

This directory contains consolidated scripts for deployment, maintenance, and OSINT engine management.

## 🚀 Quick Start

### Main Operations Script
Use the consolidated operations script for all tasks:

```bash
# Check system health
./ops.sh health

# Fix system setup
./ops.sh fix

# Deploy application
./ops.sh deploy

# Test endpoints
./ops.sh test

# Full system setup
./ops.sh full

# Emergency fix (nuclear option)
./ops.sh emergency
```

## 📁 Directory Structure

```
scripts/
├── ops.sh                    # Main consolidated operations script
├── README.md                 # This file
├── archive/                  # Archived old scripts
│   ├── legacy/              # Legacy integration scripts
│   ├── redundant/           # Redundant fix scripts
│   └── obsolete/            # Obsolete test scripts
├── maintenance/             # Maintenance and testing scripts
├── database/               # Database management scripts
└── deployment/             # Deployment-specific scripts
```

## 🔧 Available Commands

### ops.sh Commands

| Command | Description |
|---------|-------------|
| `health` | Check system health and status |
| `fix` | Fix system setup and dependencies |
| `deploy` | Deploy the application |
| `test` | Test all endpoints |
| `cleanup` | Maintenance cleanup |
| `emergency` | Emergency fix (nuclear option) |
| `full` | Complete setup (health + fix + deploy + test) |
| `help` | Show help information |

## 🌍 Environment Support

The script automatically detects the environment:
- **Development**: Local development setup
- **Production**: Remote server deployment

## 🔍 Troubleshooting

### Common Issues

1. **Python Dependencies Missing**
   ```bash
   ./ops.sh fix
   ```

2. **Application Won't Start**
   ```bash
   ./ops.sh emergency
   ```

3. **Endpoint Tests Failing**
   ```bash
   ./ops.sh test
   ```

### Logs

Check logs in the `logs/` directory:
- `combined.log` - All application logs
- `error.log` - Error logs

## 📋 Maintenance

### Regular Maintenance
```bash
# Weekly cleanup
./ops.sh cleanup

# Health check
./ops.sh health
```

### Before Deployment
```bash
# Full system check
./ops.sh full
```

## 🔐 Security

- All scripts use proper permissions
- Virtual environment isolation
- Secure credential handling
- No hardcoded secrets

## 📞 Support

For issues:
1. Run `./ops.sh health` to check system status
2. Check logs in `logs/` directory
3. Run `./ops.sh emergency` for emergency fixes
4. Review archived scripts in `archive/` for reference

---

**Note**: This directory has been consolidated. Old scripts are archived in `archive/` directory.
