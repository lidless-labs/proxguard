/**
 * ProxGuard Scoring Engine
 *
 * Category weights: SSH=25, Auth=20, Firewall=25, Container=15, Storage=10, API=5
 * Deductions per failed rule: critical=-40, high=-25, medium=-10, info=-5
 * Grade: A=90+, B=80+, C=70+, D=60+, F=<60
 */
import type {
  AuditCategory,
  Severity,
  Grade,
  Finding,
  CategoryScore,
  AuditReport,
  ParsedConfig,
  SecurityRule,
  ConfigFileType,
} from '../types';

/** Category weight configuration */
const CATEGORY_WEIGHTS: Record<AuditCategory, number> = {
  ssh: 25,
  auth: 20,
  firewall: 25,
  container: 15,
  storage: 10,
  api: 5,
};

/** Severity deduction values */
const SEVERITY_DEDUCTIONS: Record<Severity, number> = {
  critical: 40,
  high: 25,
  medium: 10,
  info: 5,
};

/** Map score to letter grade */
export function scoreToGrade(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/** Calculate score for a single category based on its findings */
export function calculateCategoryScore(
  category: AuditCategory,
  findings: Finding[]
): CategoryScore {
  let score = 100;

  for (const finding of findings) {
    if (!finding.result.passed) {
      score -= SEVERITY_DEDUCTIONS[finding.rule.severity];
    }
  }

  // Floor at 0
  score = Math.max(0, score);

  return {
    category,
    score,
    findings,
    maxScore: 100,
  };
}

/** Calculate overall weighted score from category scores */
export function calculateOverallScore(categories: CategoryScore[]): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const cat of categories) {
    const weight = CATEGORY_WEIGHTS[cat.category];
    weightedSum += cat.score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
}

/** Map supplied config files to audit categories that can be assessed. */
function categoriesFromInputFiles(inputFiles: ConfigFileType[]): AuditCategory[] {
  const assessed = new Set<AuditCategory>();

  for (const file of inputFiles) {
    switch (file) {
      case 'sshd_config':
        assessed.add('ssh');
        break;
      case 'user.cfg':
        assessed.add('auth');
        assessed.add('api');
        break;
      case 'cluster.fw':
      case 'iptables':
        assessed.add('firewall');
        break;
      case 'lxc.conf':
        assessed.add('container');
        break;
      case 'storage.cfg':
        assessed.add('storage');
        break;
    }
  }

  // Stable category order for report consumers
  const order: AuditCategory[] = ['ssh', 'firewall', 'auth', 'container', 'storage', 'api'];
  return order.filter((cat) => assessed.has(cat));
}

/** Run rules for supplied categories only and generate a full audit report */
export function generateAuditReport(
  parsedConfig: ParsedConfig,
  rules: SecurityRule[]
): AuditReport {
  // Determine which files had input (presence drives assessment scope)
  const inputFiles: ConfigFileType[] = (
    Object.entries(parsedConfig.raw) as [ConfigFileType, string][]
  )
    .filter(([, value]) => value.trim().length > 0)
    .map(([key]) => key);

  const assessedCategories = categoriesFromInputFiles(inputFiles);
  const assessedSet = new Set(assessedCategories);

  // Evaluate only rules whose category has a supplied source
  const allFindings: Finding[] = rules
    .filter((rule) => assessedSet.has(rule.category))
    .map((rule) => ({
      rule,
      result: rule.test(parsedConfig),
    }));

  // Group findings by assessed category
  const categoryFindings = new Map<AuditCategory, Finding[]>();
  for (const cat of assessedCategories) {
    categoryFindings.set(cat, []);
  }

  for (const finding of allFindings) {
    const catFindings = categoryFindings.get(finding.rule.category) ?? [];
    catFindings.push(finding);
    categoryFindings.set(finding.rule.category, catFindings);
  }

  // Score only assessed categories — missing sources do not contribute
  const categories: CategoryScore[] = assessedCategories.map((cat) =>
    calculateCategoryScore(cat, categoryFindings.get(cat) ?? [])
  );

  // Calculate overall score and grade from assessed categories only
  const overallScore = calculateOverallScore(categories);
  const overallGrade = scoreToGrade(overallScore);

  return {
    timestamp: Date.now(),
    overallGrade,
    overallScore,
    categories,
    findings: allFindings,
    inputFiles,
  };
}
