<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Zustand-4-FFD43B?style=flat-square" alt="Zustand" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" />
</p>

# 🛡️ Solomon's ProxGuard

**Proxmox firewall rule visualizer with drag-drop ordering and conflict detection.**

ProxGuard brings sanity to complex Proxmox firewall rulesets. Visualize rules in a flat list, reorder them with drag-and-drop, detect conflicts before they cause outages, and track every change with an immutable audit trail.

![ProxGuard](docs/screenshots/dashboard.png)

---

## Features

- **Rule Visualization** - Flat list view of all firewall rules with color-coded in/out/group indicators
- **Drag-Drop Reordering** - Reorder rules by dragging, see impact on rule priority instantly
- **Conflict Detection** - Automatic flagging of shadowing, contradictions, and unreachable rules
- **Audit Trail** - Immutable changelog showing who changed what and when
- **Inline Editing** - Edit rule properties (direction, protocol, port, action) in-place
- **Bulk Operations** - Enable/disable multiple rules, delete groups
- **Search & Filter** - Find rules by IP, port, protocol, or action
- **5 Visual Themes** - Tactical, Analyst, Terminal, Command, Cyber variants
- **Rule Import/Export** - Backup and restore firewall configs in multiple formats
- **Offline-First** - All changes staged locally, sync when ready

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/solomonneas/proxguard.git
cd proxguard

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open **http://localhost:5190** in your browser

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18 | Interactive UI |
| **Language** | TypeScript 5 | Type safety |
| **Styling** | Tailwind CSS 3 | Utility-first CSS |
| **State** | Zustand | Global state and persistence |
| **Bundler** | Vite 5 | Dev server and build |
| **Icons** | Lucide React | Consistent icon set |
| **DnD** | React Beautiful DnD | Drag-and-drop reordering |

---

## Rule Conflict Types

ProxGuard detects five types of rule conflicts:

1. **Shadowing** - A rule is completely blocked by higher-priority rules
2. **Contradictions** - Two rules match the same traffic but have opposite actions
3. **Unreachable** - A rule can never be reached due to preceding rules
4. **Port Overlap** - Rules have overlapping port ranges without clear separation
5. **Protocol Mismatch** - Rules conflict on protocol-specific conditions

Each conflict is highlighted with a severity indicator and a clear explanation.

---

## Project Structure

```text
proxguard/
├── src/
│   ├── components/
│   │   ├── RuleList.tsx          # Main rule list with DnD
│   │   ├── RuleCard.tsx          # Individual rule display
│   │   ├── ConflictAlert.tsx     # Conflict indicator
│   │   ├── AuditTrail.tsx        # Change history
│   │   └── ...
│   ├── pages/
│   │   ├── Dashboard.tsx         # Main view
│   │   ├── AuditPage.tsx         # Changelog view
│   │   ├── ImportExport.tsx      # Backup and restore
│   │   └── SettingsPage.tsx
│   ├── store/
│   │   └── useRuleStore.ts       # Zustand state (persisted)
│   ├── utils/
│   │   ├── conflictDetection.ts  # Conflict analysis engine
│   │   └── ruleParser.ts         # Rule format parsers
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── variants/
│       ├── tactical/Layout.tsx
│       ├── analyst/Layout.tsx
│       ├── terminal/Layout.tsx
│       ├── command/Layout.tsx
│       └── cyber/Layout.tsx
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Rule Format

Rules are stored with this structure:

```json
{
  "id": "uuid",
  "name": "Allow SSH from Admin",
  "direction": "IN",
  "source": {
    "type": "ip",
    "value": "203.0.113.10"
  },
  "dest": {
    "type": "any"
  },
  "protocol": "tcp",
  "port": 22,
  "action": "ALLOW",
  "enabled": true,
  "priority": 10,
  "created_at": "2026-02-09T10:00:00Z",
  "modified_at": "2026-02-09T10:00:00Z"
}
```

---

## Audit Trail

Every change is logged immutably:

```json
{
  "id": "uuid",
  "timestamp": "2026-02-09T11:30:00Z",
  "user": "admin@example.com",
  "action": "reorder",
  "affected_rules": ["rule-123", "rule-456"],
  "before": {
    "priority": 20
  },
  "after": {
    "priority": 10
  },
  "change_set": {...}
}
```

---

## 5 Variants

| Variant | Theme | Aesthetic |
|---------|-------|-----------|
| **Tactical** | Dark slate, red | SOC operations |
| **Analyst** | Clean white, blue | Professional policy |
| **Terminal** | Black, matrix green | Hacker/OSINT |
| **Command** | OD green, amber | Military command |
| **Cyber** | Neon cyan/magenta | Cyberpunk |

All variants share the same conflict detection and audit trail. Switching themes is instant.

---

## License

MIT - see [LICENSE](LICENSE) for details.
