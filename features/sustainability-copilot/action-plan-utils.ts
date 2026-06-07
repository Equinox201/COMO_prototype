import type {
  AIActionPlan,
  GovernanceReview,
  KPIProgress,
  ReadinessChecklist,
  StoredActionPlan,
  SustainabilityCaseInput,
} from "@/lib/types";
import type { ActionPlanSection, OverviewMetric } from "./types";

export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `plan-${Date.now()}`;
}

export function getPlanTitle(input: SustainabilityCaseInput) {
  return `${input.department.trim()} — ${input.issue.trim()}`;
}

export function getVisibleStatus(
  plan: Pick<StoredActionPlan, "approved" | "completed">,
) {
  if (plan.completed) {
    return "Done";
  }

  if (plan.approved) {
    return "Active";
  }

  return "Pending Approval";
}

export function getReviewerStatus(
  approved: boolean,
  completed: boolean,
): GovernanceReview["reviewerStatus"] {
  if (completed || approved) {
    return "Approved";
  }

  return "Pending";
}

export function formatDate(value: string) {
  if (!value) {
    return "Not generated";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function hasCompleteCase(input: SustainabilityCaseInput) {
  return (
    input.property.trim().length > 0 &&
    input.department.trim().length > 0 &&
    input.issue.trim().length > 0 &&
    input.currentMetric.trim().length > 0 &&
    input.targetMetric.trim().length > 0 &&
    input.operationalContext.trim().length > 0
  );
}

export function trimCase(
  input: SustainabilityCaseInput,
): SustainabilityCaseInput {
  return {
    property: input.property.trim(),
    department: input.department.trim(),
    issue: input.issue.trim(),
    currentMetric: input.currentMetric.trim(),
    targetMetric: input.targetMetric.trim(),
    operationalContext: input.operationalContext.trim(),
  };
}

export function getActionPlanSections(
  actionPlan: AIActionPlan,
): ActionPlanSection[] {
  return [
    {
      title: "Situation Summary",
      body: actionPlan.situationSummary,
    },
    {
      title: "Likely Root Causes",
      items: actionPlan.likelyRootCauses,
    },
    {
      title: "Recommended Operational Actions",
      items: actionPlan.recommendedOperationalActions,
    },
    {
      title: "Staff Micro-Training Message",
      body: actionPlan.staffMicroTrainingMessage,
    },
    {
      title: "Manager Checklist",
      items: actionPlan.managerChecklist,
    },
    {
      title: "KPIs to Monitor",
      items: actionPlan.kpisToMonitor,
    },
    {
      title: "Governance & Privacy Notes",
      items: actionPlan.governancePrivacyNotes,
    },
    {
      title: "Follow-Up Recommendations",
      items: actionPlan.followUpRecommendations,
    },
  ];
}

export function getErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const error = (value as Record<string, unknown>).error;
  return typeof error === "string" ? error : null;
}

export function isAIActionPlan(value: unknown): value is AIActionPlan {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.situationSummary === "string" &&
    Array.isArray(candidate.likelyRootCauses) &&
    Array.isArray(candidate.recommendedOperationalActions) &&
    typeof candidate.staffMicroTrainingMessage === "string" &&
    Array.isArray(candidate.managerChecklist) &&
    Array.isArray(candidate.kpisToMonitor) &&
    Array.isArray(candidate.governancePrivacyNotes) &&
    Array.isArray(candidate.followUpRecommendations) &&
    (candidate.confidenceLevel === "Low" ||
      candidate.confidenceLevel === "Medium" ||
      candidate.confidenceLevel === "High") &&
    typeof candidate.humanReviewRequired === "boolean"
  );
}

export function getReturnedActionPlan(value: unknown): AIActionPlan | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const actionPlan = (value as Record<string, unknown>).actionPlan;
  return isAIActionPlan(actionPlan) ? actionPlan : null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSustainabilityCaseInput(
  value: unknown,
): value is SustainabilityCaseInput {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.property === "string" &&
    typeof value.department === "string" &&
    typeof value.issue === "string" &&
    typeof value.currentMetric === "string" &&
    typeof value.targetMetric === "string" &&
    typeof value.operationalContext === "string"
  );
}

function isGovernanceReview(value: unknown): value is GovernanceReview {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.humanReviewRequired === "boolean" &&
    typeof value.containsGuestPersonalData === "boolean" &&
    typeof value.approvedOperationalUse === "boolean" &&
    (value.reviewerStatus === "Pending" ||
      value.reviewerStatus === "Approved" ||
      value.reviewerStatus === "Needs Revision") &&
    typeof value.auditTimestamp === "string"
  );
}

function normalizePriority(value: unknown): StoredActionPlan["priority"] {
  if (value === "Low" || value === "Medium" || value === "High") {
    return value;
  }

  return "Medium";
}

function normalizeReadinessChecklist(value: unknown): ReadinessChecklist {
  const candidate = isRecord(value) ? value : {};

  return {
    actionsAreSpecific: candidate.actionsAreSpecific === true,
    kpisAreMeasurable: candidate.kpisAreMeasurable === true,
    ownerAssigned: candidate.ownerAssigned === true,
    timelineDefined: candidate.timelineDefined === true,
    privacyReviewed: candidate.privacyReviewed === true,
    staffMessageReady: candidate.staffMessageReady === true,
  };
}

function normalizeKpiProgress(value: unknown): KPIProgress {
  const candidate = isRecord(value) ? value : {};

  return {
    baseline:
      typeof candidate.baseline === "string" ? candidate.baseline : "",
    current: typeof candidate.current === "string" ? candidate.current : "",
    target: typeof candidate.target === "string" ? candidate.target : "",
    latestUpdate:
      typeof candidate.latestUpdate === "string"
        ? candidate.latestUpdate
        : "",
  };
}

function isReadinessChecklistComplete(
  readinessChecklist: ReadinessChecklist,
) {
  return (
    readinessChecklist.actionsAreSpecific &&
    readinessChecklist.kpisAreMeasurable &&
    readinessChecklist.ownerAssigned &&
    readinessChecklist.timelineDefined &&
    readinessChecklist.privacyReviewed &&
    readinessChecklist.staffMessageReady
  );
}

export function isReadyForApproval(
  plan: Pick<
    StoredActionPlan,
    "owner" | "targetDate" | "nextReviewDate" | "readinessChecklist"
  >,
) {
  return (
    plan.owner.trim().length > 0 &&
    plan.targetDate.trim().length > 0 &&
    plan.nextReviewDate.trim().length > 0 &&
    isReadinessChecklistComplete(plan.readinessChecklist)
  );
}

export function normalizeStoredActionPlan(
  value: unknown,
): StoredActionPlan | null {
  if (!isRecord(value)) {
    return null;
  }

  const actionNotes =
    typeof value.actionNotes === "string" ? value.actionNotes : "";
  const owner = typeof value.owner === "string" ? value.owner : "";
  const priority = normalizePriority(value.priority);
  const targetDate = typeof value.targetDate === "string" ? value.targetDate : "";
  const nextReviewDate =
    typeof value.nextReviewDate === "string" ? value.nextReviewDate : "";
  const readinessChecklist = normalizeReadinessChecklist(
    value.readinessChecklist,
  );
  const kpiProgress = normalizeKpiProgress(value.kpiProgress);

  if (
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    !isSustainabilityCaseInput(value.sustainabilityCase) ||
    !(value.actionPlan === null || isAIActionPlan(value.actionPlan)) ||
    !isGovernanceReview(value.governanceReview) ||
    typeof value.approved !== "boolean" ||
    typeof value.completed !== "boolean" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    title: value.title,
    sustainabilityCase: value.sustainabilityCase,
    actionPlan: value.actionPlan,
    governanceReview: value.governanceReview,
    actionNotes,
    owner,
    priority,
    targetDate,
    nextReviewDate,
    readinessChecklist,
    kpiProgress,
    approved: value.approved,
    completed: value.completed,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function normalizeStoredActionPlans(
  value: unknown,
): StoredActionPlan[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalizedPlans: StoredActionPlan[] = [];

  for (const plan of value) {
    const normalizedPlan = normalizeStoredActionPlan(plan);

    if (!normalizedPlan) {
      return null;
    }

    normalizedPlans.push(normalizedPlan);
  }

  return normalizedPlans;
}

export function copyActionPlan(plan: StoredActionPlan): StoredActionPlan {
  return {
    ...plan,
    sustainabilityCase: { ...plan.sustainabilityCase },
    actionPlan: plan.actionPlan
      ? {
          ...plan.actionPlan,
          likelyRootCauses: [...plan.actionPlan.likelyRootCauses],
          recommendedOperationalActions: [
            ...plan.actionPlan.recommendedOperationalActions,
          ],
          managerChecklist: [...plan.actionPlan.managerChecklist],
          kpisToMonitor: [...plan.actionPlan.kpisToMonitor],
          governancePrivacyNotes: [...plan.actionPlan.governancePrivacyNotes],
          followUpRecommendations: [
            ...plan.actionPlan.followUpRecommendations,
          ],
        }
      : null,
    governanceReview: { ...plan.governanceReview },
    readinessChecklist: { ...plan.readinessChecklist },
    kpiProgress: { ...plan.kpiProgress },
  };
}

export function getOperationalOverviewMetrics(plans: StoredActionPlan[]) {
  const pendingApproval = plans.filter(
    (plan) => !plan.approved && !plan.completed,
  ).length;
  const active = plans.filter(
    (plan) => plan.approved && !plan.completed,
  ).length;
  const done = plans.filter((plan) => plan.completed).length;
  const highPriority = plans.filter((plan) => plan.priority === "High").length;
  const upcomingReviews = plans.filter(
    (plan) => plan.nextReviewDate.trim().length > 0 && !plan.completed,
  ).length;

  return {
    metrics: [
      {
        label: "Total Plans",
        value: plans.length,
        helperText: "Saved locally in this prototype",
      },
      {
        label: "Pending Approval",
        value: pendingApproval,
        helperText: "Awaiting readiness review",
      },
      {
        label: "Active",
        value: active,
        helperText: "Approved and in progress",
      },
      {
        label: "Done",
        value: done,
        helperText: "Completed implementation",
      },
      {
        label: "High Priority",
        value: highPriority,
        helperText: "Requires closer follow-up",
      },
      {
        label: "Reviews Scheduled",
        value: upcomingReviews,
        helperText: "Review dates assigned",
      },
    ] satisfies OverviewMetric[],
    departments: Array.from(
      new Set(
        plans
          .map((plan) => plan.sustainabilityCase.department.trim())
          .filter(Boolean),
      ),
    ),
  };
}
