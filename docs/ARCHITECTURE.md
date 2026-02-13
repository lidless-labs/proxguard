# Architecture

## System Overview

ProxGuard is a client-side firewall rule visualizer and conflict analyzer. All rules, conflict detection, and audit history are managed in the browser with Zustand, providing zero-latency interaction and full offline capability.

## Tech Stack

### Frontend Only
- **React 18** with TypeScript for type-safe UI
- **Vite** for lightning-fast builds
- **Tailwind CSS** for styling with 5 theme variants
- **Zustand** with `persist` middleware for localStorage persistence
- **React Beautiful DnD** for drag-and-drop reordering
- Runs on **port 5190**

No backend required. All data is stored in localStorage and can be exported/imported.

## Data Flow

```
Load Rules from localStorage
    |
    v
Display Rule List (with conflict highlighting)
    |
    v
User Action (drag, edit, delete)
    |
    v
Conflict Detection Engine
    |
    v
Update State (Zustand) -> localStorage
    |
    v
Re-render with Visual Feedback
    |
    v
Log Change to Audit Trail
```

## State Management (Zustand)

The main store tracks:

```javascript
{
  rules: Array<Rule>,
  auditTrail: Array<AuditEntry>,
  selectedRuleId: string | null,
  conflictMap: Map<RuleId, Conflict[]>,
  filters: {
    direction: 'IN' | 'OUT' | 'GROUP' | null,
    enabled: boolean | null,
    searchTerm: string,
  },
  viewMode: 'list' | 'audit' | 'import-export',
}
```

Persisted to localStorage under key `proxguard-v1`.

## Conflict Detection Engine

The engine runs automatically whenever rules change:

```
For each rule in list:
  Check against all rules with higher priority (lower index):
    - Does it shadow this rule?
    - Does it contradict it?
    - Is it unreachable?
    - Port overlap?
    - Protocol mismatch?
  
  Assign conflict severity (warning / critical / info)
  Store in conflictMap[ruleId]
```

### Shadowing Detection

Rule B shadows Rule A if:
1. Rule A has higher priority (earlier in list)
2. Both rules match the same source IP
3. Both rules match the same destination IP
4. Both rules match the same protocol and port
5. Rule A's action is ALLOW and Rule B's action is ALLOW (or both DENY)

### Contradiction Detection

Two rules contradict if:
1. All matching conditions are identical
2. Actions are opposite (ALLOW vs DENY)
3. Both rules are enabled

### Unreachable Detection

A rule is unreachable if all possible traffic it could match is already handled by higher-priority rules.

### Port Overlap

Detected when:
1. Rules have overlapping port ranges
2. Both match the same protocol
3. Different actions without clear separation

## Rule Model

```typescript
interface Rule {
  id: string;              // UUID
  name: string;
  direction: 'IN' | 'OUT' | 'GROUP';
  source: {
    type: 'ip' | 'subnet' | 'any';
    value?: string;
  };
  dest: {
    type: 'ip' | 'subnet' | 'any';
    value?: string;
  };
  protocol: 'tcp' | 'udp' | 'icmp' | 'any';
  port?: number | { start: number; end: number };
  action: 'ALLOW' | 'DENY' | 'REJECT' | 'DROP';
  enabled: boolean;
  priority: number;         // Lower = higher priority
  tags: string[];
  notes: string;
  created_at: Date;
  modified_at: Date;
}
```

## Conflict Model

```typescript
interface Conflict {
  id: string;
  type: 'shadowing' | 'contradiction' | 'unreachable' | 'port_overlap' | 'protocol_mismatch';
  severity: 'info' | 'warning' | 'critical';
  affectedRules: string[];  // Rule IDs involved
  description: string;
  suggestion?: string;
}
```

## Audit Trail

```typescript
interface AuditEntry {
  id: string;
  timestamp: Date;
  user: string;              // From localStorage or user setting
  action: 'create' | 'update' | 'delete' | 'reorder' | 'bulk_edit' | 'import';
  affectedRules: string[];
  changeset: {
    before: Partial<Rule> | Rule[];
    after: Partial<Rule> | Rule[];
  };
  description: string;
}
```

Immutable log in localStorage under `proxguard-audit-v1`.

## Drag-and-Drop Reordering

Uses `react-beautiful-dnd` for accessible drag-and-drop:

1. User drags rule from position N to position M
2. Local array is reordered
3. Conflict detection runs on new ordering
4. Changes are persisted to localStorage
5. Audit trail entry is created with before/after state

The DnD interface respects rule groups and respects dependencies (rules with cross-references).

## Import/Export

### Supported Formats

**JSON** (native)
```json
{
  "version": 1,
  "rules": [...],
  "exportedAt": "2026-02-09T10:00:00Z"
}
```

**CSV**
```
name,direction,source,dest,protocol,port,action,enabled
Allow SSH from Admin,IN,203.0.113.10,any,tcp,22,ALLOW,true
```

**Palo Alto XML** (read-only)
```xml
<rules>
  <rule>...</rule>
</rules>
```

**Proxmox CLI Format** (export)
```bash
proxmox firewall enable
proxmox firewall rule add IN ALLOW -p tcp -dport 22 -source 203.0.113.10
```

## 5 Variants

Each variant provides a unique visual identity over the same core engine:

| Variant | Theme | Use Case |
|---------|-------|----------|
| **Tactical** | Dark slate, red accents | Security operations |
| **Analyst** | Light white, blue accents | Policy review |
| **Terminal** | Black, matrix green | Technical analysis |
| **Command** | OD green, amber | Military-style |
| **Cyber** | Neon cyan/magenta | Cyberpunk aesthetic |

Switching themes is instant. All state persists across theme changes.

## Offline-First Architecture

ProxGuard is 100% offline:
1. Rules loaded from localStorage on startup
2. All edits are instant (no network calls)
3. Export rules to backup when needed
4. Import from Proxmox API or previous exports

Optional: Connect to a Proxmox API backend (not included) to fetch and sync live rules.
