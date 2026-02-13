# Configuration

## Frontend Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
VITE_APP_PORT=5190
VITE_STORAGE_KEY=proxguard-v1
VITE_AUDIT_STORAGE_KEY=proxguard-audit-v1
VITE_THEME_VARIANTS=tactical,analyst,terminal,command,cyber
```

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_PORT` | Frontend port | 5190 |
| `VITE_STORAGE_KEY` | localStorage key for rules | proxguard-v1 |
| `VITE_AUDIT_STORAGE_KEY` | localStorage key for audit trail | proxguard-audit-v1 |
| `VITE_THEME_VARIANTS` | Available theme list (comma-separated) | all five |

## Theme Variants

Access ProxGuard at:
- `http://localhost:5190/` - Tactical theme (default)
- `http://localhost:5190/?theme=analyst` - Analyst theme
- `http://localhost:5190/?theme=terminal` - Terminal theme
- `http://localhost:5190/?theme=command` - Command theme
- `http://localhost:5190/?theme=cyber` - Cyber Noir theme

Theme preference is saved to localStorage.

## Running the Application

### Development

```bash
npm install
npm run dev
```

Starts on `http://localhost:5190`

### Production Build

```bash
npm run build
npm run preview
```

## Data Storage

### localStorage Keys

ProxGuard stores all data in browser localStorage:

| Key | Purpose | Max Size |
|-----|---------|----------|
| `proxguard-v1` | Current ruleset | ~5MB |
| `proxguard-audit-v1` | Audit trail history | ~5MB |
| `proxguard-theme` | User theme preference | <1KB |
| `proxguard-filters` | Last-used filters | <1KB |

### Backup Rules

Export rules regularly to preserve your ruleset:

1. Click **Settings** or **Import/Export**
2. Choose **Export Rules**
3. Select format (JSON, CSV, Proxmox CLI)
4. Save file locally

### Restore Rules

1. Click **Import/Export**
2. Choose **Import Rules**
3. Select file (JSON or CSV)
4. Review conflicts
5. Confirm import

Imports are non-destructive by default. Choose to append or overwrite.

## Conflict Detection Settings

Configure detection sensitivity in the app settings:

| Setting | Options | Default |
|---------|---------|---------|
| **Detect Shadowing** | On/Off | On |
| **Detect Contradictions** | On/Off | On |
| **Detect Unreachable** | On/Off | On |
| **Detect Port Overlap** | On/Off | On |
| **Detect Protocol Mismatch** | On/Off | On |
| **Strict Mode** | On/Off | Off |

**Strict Mode** flags additional edge cases like:
- Rules with overlapping CIDR blocks
- Rules with incomplete specifications
- Rules missing descriptions

## User Profile

Configure your identity in settings:

| Setting | Default |
|---------|---------|
| **Username** | Anonymous |
| **Email** | (none) |
| **Organization** | (none) |

This information appears in the audit trail for tracking.

## Rule Templates

ProxGuard includes common rule templates:

- **Allow SSH** - `tcp/22 from specific IP`
- **Allow HTTP** - `tcp/80 to any`
- **Allow HTTPS** - `tcp/443 to any`
- **Block DNS Tunneling** - `drop udp/53 to except:8.8.8.8`
- **Allow Ping** - `icmp from any`
- **Rate Limiting** - `drop if > 1000 pps`

Access templates via **New Rule** button or **Templates** tab.

## Firewall Rule Syntax

### IP Specifications

```
192.0.2.1              # Single IP
192.0.2.0/24           # CIDR subnet
192.0.2.1-192.0.2.50   # IP range
any                    # Any IP
```

### Ports

```
22                     # Single port
22-25                  # Port range
80,443,8080            # Multiple ports
any                    # Any port
```

### Protocols

```
tcp                    # TCP only
udp                    # UDP only
icmp                   # ICMP (ping)
any                    # All protocols
```

## Rule Priority

Rules are evaluated top-to-bottom. Higher priority (lower position) rules take precedence.

To reorder:
1. Drag a rule up or down in the list
2. Conflict detection runs automatically
3. Changes are saved to localStorage
4. Audit trail logs the reorder

## Exporting to Proxmox

To export rules to an actual Proxmox host:

1. Click **Export Rules**
2. Choose **Proxmox CLI Format**
3. Copy the CLI commands
4. SSH to your Proxmox host
5. Paste and run the commands

Example output:
```bash
proxmox firewall enable
proxmox firewall rule add IN ALLOW -p tcp -dport 22 -source 203.0.113.10
proxmox firewall rule add IN DENY -p tcp -dport 23
```

## Browser Compatibility

ProxGuard requires:
- Modern browser with ES2020 support
- localStorage enabled (required for offline operation)
- 5MB+ localStorage quota

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Performance Notes

- Up to 1,000 rules: smooth, instant updates
- 1,000-5,000 rules: slight delay in conflict detection (< 1 second)
- 5,000+ rules: recommended to split across multiple rule sets

For large deployments, export rules by prefix or VLAN into separate rulesets.
