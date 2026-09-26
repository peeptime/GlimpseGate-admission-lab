export const MERCURY_RULESET_VERSION = "2026.09.26.1";

export function createRuleVersionRecord(input = {}) {
  return {
    packet_id: input.packet_id || input.packetId || "",
    ruleset_version: input.ruleset_version || input.rulesetVersion || MERCURY_RULESET_VERSION,
    evaluated_at: input.evaluated_at || input.evaluatedAt || new Date().toISOString(),
    route: input.route || input.routing_decision || "",
    reviewer: input.reviewer || "host_system_pending",
    notes: input.notes || ""
  };
}

export function compareRuleVersions(left, right) {
  const a = parseRuleVersion(left);
  const b = parseRuleVersion(right);
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const delta = (a[index] || 0) - (b[index] || 0);
    if (delta !== 0) return delta > 0 ? 1 : -1;
  }
  return 0;
}

export function needsReaudit(record = {}, currentVersion = MERCURY_RULESET_VERSION) {
  const storedVersion = record.ruleset_version || record.rulesetVersion || "";
  if (!storedVersion) {
    return {
      required: true,
      reason: "missing_ruleset_version"
    };
  }
  if (compareRuleVersions(storedVersion, currentVersion) < 0) {
    return {
      required: true,
      reason: "ruleset_version_outdated",
      from: storedVersion,
      to: currentVersion
    };
  }
  return {
    required: false,
    reason: "ruleset_version_current",
    from: storedVersion,
    to: currentVersion
  };
}

function parseRuleVersion(value) {
  return String(value || "")
    .split(/[.\-]/)
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part));
}
