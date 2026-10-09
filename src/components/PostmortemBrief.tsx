/**
 * Actionable Incident Postmortem & On-Call Brief
 * One-click incident report for PagerDuty, Slack #incidents, and Jira postmortems.
 */

import React, { useState } from 'react';
import { ParseResult } from '../types/log';
import { Copy, Check, Share2, FileCode } from 'lucide-react';

interface PostmortemBriefProps {
  result: ParseResult;
}

export const PostmortemBrief: React.FC<PostmortemBriefProps> = ({ result }) => {
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const root = result.incidents.find(i => i.isLikelyTrigger) || result.incidents[0];

  const generateMarkdown = () => {
    return `# [INCIDENT TRIAGE BRIEF via Log Lenx.] 3 A.M. Incident Postmortem
**Status**: Triaged & Root Trigger Isolated
**Triage Time**: ${result.processingTimeMs}ms (Local Machine Extraction)
**Observed Window**: ${result.timeRange.start} → ${result.timeRange.end} (${result.timeRange.durationMinutes} minutes)
**Log Scale**: ${result.totalLines.toLocaleString()} raw lines ingested → distilled to ${result.incidents.length} ranked incidents (${((1 - result.incidents.length / result.totalLines) * 100).toFixed(2)}% noise reduction)
**Services Impacted**: ${result.services.join(', ')}

---

## 1. Primary Smoking Gun / Root Trigger
- **Incident**: #${root?.id} — ${root?.title || 'Unknown'}
- **First Observed**: ${root?.firstSeen || 'N/A'} in \`${root?.services.join(', ')}\`
- **What Happened**: ${root?.humanSummary || 'Initiated cascade before downstream services timed out.'}

---

## 2. Ranked Cascading Incidents
${result.incidents.map((inc, i) => `### #${i + 1} - [${inc.id}] ${inc.title}
- **Impact Score**: ${inc.impactScore}/100 | **Severity**: ${inc.severity}
- **Summary**: ${inc.humanSummary}
- **Count**: ${inc.count.toLocaleString()} occurrences (${inc.percentageOfErrors}% of error volume)
- **Services**: ${inc.services.join(', ')}
- **Window**: ${inc.firstSeen} to ${inc.lastSeen} (${inc.durationFormatted})
- **Recommended Action**:
${inc.suggestedMitigation.map(m => `  * ${m}`).join('\n')}
`).join('\n')}

---

## 3. Incident Commander Mitigation Checklist
- [ ] Inspect database / connection pool metrics at \`${root?.services[0] || 'database'}\`.
- [ ] Drain or recycle stuck backend worker pools to release saturated connection slots.
- [ ] Verify ingress rate-limiting to prevent downstream retry storms.
- [ ] Confirm service health restoration across: ${result.services.join(', ')}.
`;
  };

  const copyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const copyJson = () => {
    const exportData = {
      triageTimestamp: new Date().toISOString(),
      latencyMs: result.processingTimeMs,
      totalLines: result.totalLines,
      errorCount: result.errorCount,
      rootTrigger: root ? {
        id: root.id,
        template: root.template,
        firstSeen: root.firstSeen,
        services: root.services,
        rationale: root.triggerRationale,
      } : null,
      incidents: result.incidents.map(i => ({
        id: i.id,
        template: i.template,
        count: i.count,
        severity: i.severity,
        impactScore: i.impactScore,
        services: i.services,
        firstSeen: i.firstSeen,
        lastSeen: i.lastSeen,
        mitigations: i.suggestedMitigation,
      })),
    };

    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="border border-slate-800/80 bg-slate-900/70 rounded-2xl p-6 space-y-6 shadow-xl shadow-slate-950/20 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/70">
        <div>
          <h2 className="text-base font-bold text-white">Incident Commander Action Brief</h2>
          <p className="text-xs text-slate-400">
            Export ready-to-share postmortem report for Slack #incidents, PagerDuty, or Jira.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyMarkdown}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
          >
            {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedMd ? 'Copied Markdown' : 'Copy Slack/Markdown'}</span>
          </button>

          <button
            onClick={copyJson}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700"
          >
            {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileCode className="w-3.5 h-3.5" />}
            <span>{copiedJson ? 'Copied JSON' : 'Copy JSON'}</span>
          </button>
        </div>
      </div>

      {/* Rendered Preview */}
      <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-5 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text">
        {generateMarkdown()}
      </div>
    </div>
  );
};
