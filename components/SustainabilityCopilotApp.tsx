"use client";

import { useEffect, useRef, useState } from "react";
import { demoActionPlans } from "@/lib/demo-plans";
import type {
  AIActionPlan,
  GovernanceReview,
  KPIProgress,
  ReadinessChecklist,
  StoredActionPlan,
  SustainabilityCaseInput,
  TelemetryEvent,
  TelemetryEventName,
} from "@/lib/types";

const actionPlansStorageKey = "como-sustainability-action-plans";
const telemetryStorageKey = "como-sustainability-telemetry-events";

const departmentOptions = [
  "Housekeeping",
  "Front Office",
  "Food & Beverage",
  "Engineering",
  "Spa & Wellness",
  "Procurement",
  "People & Culture",
  "Finance",
  "Sales & Marketing",
  "Sustainability",
];

const defaultSustainabilityCase: SustainabilityCaseInput = {
  property: "COMO Metropolitan Singapore",
  department: "Housekeeping",
  issue: "Laundry usage increased above baseline",
  currentMetric: "18% increase in laundry volume",
  targetMetric: "Return to baseline within 60 days",
  operationalContext:
    "Inconsistent towel reuse adoption and unclear staff communication",
};

const emptyGovernanceReview: GovernanceReview = {
  humanReviewRequired: true,
  containsGuestPersonalData: false,
  approvedOperationalUse: false,
  reviewerStatus: "Pending",
  auditTimestamp: "",
};

const emptyReadinessChecklist: ReadinessChecklist = {
  actionsAreSpecific: false,
  kpisAreMeasurable: false,
  ownerAssigned: false,
  timelineDefined: false,
  privacyReviewed: false,
  staffMessageReady: false,
};

const emptyKpiProgress: KPIProgress = {
  baseline: "",
  current: "",
  target: "",
  latestUpdate: "",
};

type ActionPlanSection = {
  title: string;
  body?: string;
  items?: string[];
};

type EditorDraft = {
  id: string | null;
  sustainabilityCase: SustainabilityCaseInput;
  actionPlan: AIActionPlan | null;
  governanceReview: GovernanceReview;
  actionNotes: string;
  owner: string;
  priority: StoredActionPlan["priority"];
  targetDate: string;
  nextReviewDate: string;
  readinessChecklist: ReadinessChecklist;
  kpiProgress: KPIProgress;
  approved: boolean;
  completed: boolean;
  createdAt: string | null;
};

type EditorPanel = "case" | "plan" | "kpi" | "notes";
type MainView = "actionPlans" | "insights";

type OverviewMetric = {
  label: string;
  value: number;
  helperText: string;
};

type KnowledgeSource = {
  title: string;
  type: string;
  status: string;
  use: string;
};

const readinessChecklistItems: Array<{
  field: keyof ReadinessChecklist;
  label: string;
}> = [
  {
    field: "actionsAreSpecific",
    label: "Actions are specific enough for the department team",
  },
  {
    field: "kpisAreMeasurable",
    label: "KPIs are measurable",
  },
  {
    field: "ownerAssigned",
    label: "Owner has been assigned",
  },
  {
    field: "timelineDefined",
    label: "Timeline is defined",
  },
  {
    field: "privacyReviewed",
    label: "Privacy and guest data risk reviewed",
  },
  {
    field: "staffMessageReady",
    label: "Staff communication message is ready",
  },
];

const approvedKnowledgeSources: KnowledgeSource[] = [
  {
    title: "COMO Sustainability Operating Principles",
    type: "Group Policy",
    status: "Mock connected",
    use: "Guides sustainability framing and responsible operational recommendations",
  },
  {
    title: "Housekeeping Resource Efficiency SOP",
    type: "Department SOP",
    status: "Mock connected",
    use: "Supports laundry, towel reuse, amenities, and room operations guidance",
  },
  {
    title: "Food Waste Measurement & Buffet Guidelines",
    type: "F&B SOP",
    status: "Mock connected",
    use: "Supports buffet planning, batch replenishment, and food waste tracking",
  },
  {
    title: "Sustainable Procurement Screening Guide",
    type: "Procurement Guide",
    status: "Mock connected",
    use: "Supports supplier review, packaging, sourcing, and lifecycle considerations",
  },
  {
    title: "Sustainability Reporting Reference",
    type: "Reporting Guidance",
    status: "Mock connected",
    use: "Supports KPI definitions, evidence collection, and reporting consistency",
  },
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `plan-${Date.now()}`;
}

function getPlanTitle(input: SustainabilityCaseInput) {
  return `${input.department.trim()} — ${input.issue.trim()}`;
}

function getVisibleStatus(plan: Pick<StoredActionPlan, "approved" | "completed">) {
  if (plan.completed) {
    return "Done";
  }

  if (plan.approved) {
    return "Active";
  }

  return "Pending Approval";
}

function getReviewerStatus(
  approved: boolean,
  completed: boolean,
): GovernanceReview["reviewerStatus"] {
  if (completed || approved) {
    return "Approved";
  }

  return "Pending";
}

function formatDate(value: string) {
  if (!value) {
    return "Not generated";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function hasCompleteCase(input: SustainabilityCaseInput) {
  return (
    input.property.trim().length > 0 &&
    input.department.trim().length > 0 &&
    input.issue.trim().length > 0 &&
    input.currentMetric.trim().length > 0 &&
    input.targetMetric.trim().length > 0 &&
    input.operationalContext.trim().length > 0
  );
}

function trimCase(input: SustainabilityCaseInput): SustainabilityCaseInput {
  return {
    property: input.property.trim(),
    department: input.department.trim(),
    issue: input.issue.trim(),
    currentMetric: input.currentMetric.trim(),
    targetMetric: input.targetMetric.trim(),
    operationalContext: input.operationalContext.trim(),
  };
}

function getActionPlanSections(actionPlan: AIActionPlan): ActionPlanSection[] {
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

function getErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const error = (value as Record<string, unknown>).error;
  return typeof error === "string" ? error : null;
}

function isAIActionPlan(value: unknown): value is AIActionPlan {
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

function getReturnedActionPlan(value: unknown): AIActionPlan | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const actionPlan = (value as Record<string, unknown>).actionPlan;
  return isAIActionPlan(actionPlan) ? actionPlan : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
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

function isReadyForApproval(
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

function normalizeStoredActionPlan(value: unknown): StoredActionPlan | null {
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

function normalizeStoredActionPlans(value: unknown): StoredActionPlan[] | null {
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

function isTelemetryEventName(value: unknown): value is TelemetryEventName {
  return (
    value === "demo_cases_loaded" ||
    value === "action_plan_created" ||
    value === "action_plan_generated" ||
    value === "action_plan_saved" ||
    value === "action_plan_approved" ||
    value === "approval_reset" ||
    value === "action_plan_marked_done" ||
    value === "action_plan_deleted" ||
    value === "action_notes_updated" ||
    value === "kpi_progress_updated"
  );
}

function normalizeTelemetryEvent(value: unknown): TelemetryEvent | null {
  if (!isRecord(value) || !isTelemetryEventName(value.eventName)) {
    return null;
  }

  if (typeof value.id !== "string" || typeof value.timestamp !== "string") {
    return null;
  }

  return {
    id: value.id,
    eventName: value.eventName,
    planId: typeof value.planId === "string" ? value.planId : undefined,
    department:
      typeof value.department === "string" ? value.department : undefined,
    timestamp: value.timestamp,
  };
}

function normalizeTelemetryEvents(value: unknown): TelemetryEvent[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalizedEvents: TelemetryEvent[] = [];

  for (const event of value) {
    const normalizedEvent = normalizeTelemetryEvent(event);

    if (!normalizedEvent) {
      return null;
    }

    normalizedEvents.push(normalizedEvent);
  }

  return normalizedEvents;
}

function copyActionPlan(plan: StoredActionPlan): StoredActionPlan {
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

function getOperationalOverviewMetrics(plans: StoredActionPlan[]) {
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

function countTelemetryEvents(
  telemetryEvents: TelemetryEvent[],
  eventName: TelemetryEventName,
) {
  return telemetryEvents.filter((event) => event.eventName === eventName).length;
}

function getMostActiveDepartments(
  plans: StoredActionPlan[],
  telemetryEvents: TelemetryEvent[],
) {
  const departmentCounts = new Map<string, number>();

  for (const event of telemetryEvents) {
    const department = event.department?.trim();

    if (department) {
      departmentCounts.set(department, (departmentCounts.get(department) ?? 0) + 1);
    }
  }

  if (departmentCounts.size > 0) {
    return Array.from(departmentCounts.entries())
      .sort((first, second) => second[1] - first[1])
      .slice(0, 3)
      .map(([department]) => department);
  }

  return Array.from(
    new Set(
      plans
        .map((plan) => plan.sustainabilityCase.department.trim())
        .filter(Boolean),
    ),
  ).slice(0, 3);
}

function getAdoptionSignals(
  plans: StoredActionPlan[],
  telemetryEvents: TelemetryEvent[],
) {
  const active = plans.filter(
    (plan) => plan.approved && !plan.completed,
  ).length;
  const done = plans.filter((plan) => plan.completed).length;

  return {
    metrics: [
      {
        label: "Generated",
        value: countTelemetryEvents(telemetryEvents, "action_plan_generated"),
        helperText: "AI outputs created",
      },
      {
        label: "Saved",
        value: countTelemetryEvents(telemetryEvents, "action_plan_saved"),
        helperText: "Plans recorded locally",
      },
      {
        label: "Approved",
        value: countTelemetryEvents(telemetryEvents, "action_plan_approved"),
        helperText: "Human review completed",
      },
      {
        label: "Active",
        value: active,
        helperText: "Currently in progress",
      },
      {
        label: "Done",
        value: done,
        helperText: "Completed plans",
      },
      {
        label: "Notes Updated",
        value: countTelemetryEvents(telemetryEvents, "action_notes_updated"),
        helperText: "Implementation updates saved",
      },
    ] satisfies OverviewMetric[],
    departments: getMostActiveDepartments(plans, telemetryEvents),
  };
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "Done"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : status === "Active"
        ? "border-sky-200 bg-sky-50 text-sky-900"
        : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <span
      className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${className}`}
    >
      {status}
    </span>
  );
}

function MainNavigation({
  currentMainView,
  onViewChange,
}: {
  currentMainView: MainView;
  onViewChange: (view: MainView) => void;
}) {
  const baseClassName =
    "min-h-10 rounded-lg px-4 py-2 text-sm font-semibold transition";

  return (
    <nav
      className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-1"
      aria-label="Main sections"
    >
      <button
        className={`${baseClassName} ${
          currentMainView === "actionPlans"
            ? "bg-white text-stone-950 shadow-sm"
            : "text-stone-600 hover:bg-white/70 hover:text-stone-950"
        }`}
        type="button"
        onClick={() => onViewChange("actionPlans")}
      >
        Action Plans
      </button>
      <button
        className={`${baseClassName} ${
          currentMainView === "insights"
            ? "bg-white text-stone-950 shadow-sm"
            : "text-stone-600 hover:bg-white/70 hover:text-stone-950"
        }`}
        type="button"
        onClick={() => onViewChange("insights")}
      >
        Insights & Knowledge
      </button>
    </nav>
  );
}

function AppHeader({
  currentMainView,
  onViewChange,
  onCreate,
}: {
  currentMainView: MainView;
  onViewChange: (view: MainView) => void;
  onCreate: () => void;
}) {
  return (
    <header className="rounded-lg border border-stone-200 bg-white px-6 py-7 shadow-sm sm:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-5 inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-900">
            Internal AI Workflow Prototype
          </div>
          <h1 className="max-w-5xl text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl lg:text-5xl">
            COMO Sustainability Operations Copilot
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600 sm:text-lg">
            Track, generate, review, and manage sustainability action plans
            across hotel operations.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
          <MainNavigation
            currentMainView={currentMainView}
            onViewChange={onViewChange}
          />
          {currentMainView === "actionPlans" ? (
            <button
              className="min-h-12 rounded-lg bg-stone-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
              type="button"
              onClick={onCreate}
            >
              Create New Action Plan
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function OperationalOverview({ plans }: { plans: StoredActionPlan[] }) {
  const { metrics, departments } = getOperationalOverviewMetrics(plans);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            Operational Overview
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-stone-950">
            Implementation Progress
          </h2>
        </div>
        {departments.length > 0 ? (
          <p className="max-w-2xl text-sm leading-6 text-stone-600">
            Departments represented: {departments.join(", ")}
          </p>
        ) : null}
      </div>

      {plans.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm leading-6 text-stone-600">
          Load demo cases or create a new plan to see operational progress.
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-lg border border-stone-200 bg-[#fbfaf7] p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-stone-500">
                {metric.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-stone-950">
                {metric.value}
              </p>
              <p className="mt-2 text-sm leading-5 text-stone-600">
                {metric.helperText}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function AdoptionSignals({
  plans,
  telemetryEvents,
}: {
  plans: StoredActionPlan[];
  telemetryEvents: TelemetryEvent[];
}) {
  const { metrics, departments } = getAdoptionSignals(plans, telemetryEvents);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            Adoption Signals
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-stone-950">
            Workflow Usage
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Local prototype telemetry showing how teams are using the workflow.
          </p>
        </div>
        {departments.length > 0 ? (
          <p className="max-w-2xl text-sm leading-6 text-stone-600">
            Most active departments: {departments.join(", ")}
          </p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-lg border border-stone-200 bg-[#fbfaf7] p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-stone-500">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-stone-950">
              {metric.value}
            </p>
            <p className="mt-2 text-sm leading-5 text-stone-600">
              {metric.helperText}
            </p>
          </article>
        ))}
      </div>

      <p className="mt-5 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">
        Telemetry is stored locally in this browser for demo purposes. In
        production, this would feed a secure analytics and audit pipeline.
      </p>
    </section>
  );
}

function ApprovedKnowledgeSources() {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Approved Knowledge Sources
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-stone-950">
          Future Grounding Layer
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-stone-600">
          In production, AI recommendations would be grounded in approved COMO
          policies, SOPs, and reporting guidance.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {approvedKnowledgeSources.map((source) => (
          <article
            key={source.title}
            className="rounded-lg border border-stone-200 bg-[#fbfaf7] p-4"
          >
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-600">
                {source.type}
              </span>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-900">
                {source.status}
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold leading-6 text-stone-950">
              {source.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              {source.use}
            </p>
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-950">
              Mock source — not used for live generation yet
            </p>
          </article>
        ))}
      </div>

      <p className="mt-5 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">
        Future version: connect approved policies, SOPs, and reporting guidance
        through RAG so generated action plans can cite trusted internal sources.
      </p>
    </section>
  );
}

function ActionPlanList({
  plans,
  onCreate,
  onLoadDemoCases,
  onEdit,
  onDelete,
  onApprove,
  onComplete,
  onClearLocalData,
}: {
  plans: StoredActionPlan[];
  onCreate: () => void;
  onLoadDemoCases: () => void;
  onEdit: (plan: StoredActionPlan) => void;
  onDelete: (planId: string) => void;
  onApprove: (planId: string) => void;
  onComplete: (planId: string) => void;
  onClearLocalData: () => void;
}) {
  const actionButtonBaseClassName =
    "inline-flex min-h-10 w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition sm:w-32";
  const prototypeNote = (
    <div className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Prototype note: saved action plans are stored locally in this browser. In
        production, this would be stored in a secure database with permissions
        and audit history.
      </p>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <button
          className="min-h-10 rounded-lg border border-stone-900 bg-stone-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
          type="button"
          onClick={onLoadDemoCases}
        >
          Load Demo Cases
        </button>
        <button
          className="min-h-10 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
          type="button"
          onClick={onClearLocalData}
        >
          Clear Local Demo Data
        </button>
      </div>
    </div>
  );

  if (plans.length === 0) {
    return (
      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            Action Plans
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-stone-950">
            Current Sustainability Workflow
          </h2>
        </div>
        <OperationalOverview plans={plans} />
        {prototypeNote}
        <div className="rounded-lg border border-dashed border-stone-300 bg-white px-6 py-14 text-center shadow-sm">
          <h2 className="text-2xl font-semibold text-stone-950">
            No action plans yet.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-stone-600">
            Create your first sustainability action plan or load demo cases to
            explore the workflow.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              className="min-h-12 rounded-lg bg-stone-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
              type="button"
              onClick={onCreate}
            >
              Create New Action Plan
            </button>
            <button
              className="min-h-12 rounded-lg border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
              type="button"
              onClick={onLoadDemoCases}
            >
              Load Demo Cases
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Action Plans
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-stone-950">
          Current Sustainability Workflow
        </h2>
      </div>
      <OperationalOverview plans={plans} />
      {prototypeNote}

      <div className="grid gap-4">
        {plans.map((plan) => {
          const status = getVisibleStatus(plan);

          return (
            <article
              key={plan.id}
              className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_max-content] lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-semibold text-stone-950">
                      {plan.title}
                    </h3>
                    <StatusBadge status={status} />
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <dt className="font-medium text-stone-500">Property</dt>
                      <dd className="mt-1 text-stone-900">
                        {plan.sustainabilityCase.property}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-stone-500">Department</dt>
                      <dd className="mt-1 text-stone-900">
                        {plan.sustainabilityCase.department}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-stone-500">Approval</dt>
                      <dd className="mt-1 text-stone-900">
                        {plan.approved ? "Approved" : "Pending review"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-stone-500">Owner</dt>
                      <dd className="mt-1 text-stone-900">
                        {plan.owner || "Unassigned"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-stone-500">Priority</dt>
                      <dd className="mt-1 text-stone-900">{plan.priority}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-stone-500">Target Date</dt>
                      <dd className="mt-1 text-stone-900">
                        {plan.targetDate || "Not set"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-stone-500">Next Review</dt>
                      <dd className="mt-1 text-stone-900">
                        {plan.nextReviewDate || "Not set"}
                      </dd>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <dt className="font-medium text-stone-500">Issue</dt>
                      <dd className="mt-1 leading-6 text-stone-900">
                        {plan.sustainabilityCase.issue}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-stone-500">Created</dt>
                      <dd className="mt-1 text-stone-900">
                        {formatDate(plan.createdAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-stone-500">Updated</dt>
                      <dd className="mt-1 text-stone-900">
                        {formatDate(plan.updatedAt)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                  <button
                    className={`${actionButtonBaseClassName} border border-stone-300 bg-white text-stone-800 hover:bg-stone-50`}
                    type="button"
                    onClick={() => onEdit(plan)}
                  >
                    View / Edit
                  </button>
                  {!plan.approved ? (
                    <button
                      className={`${actionButtonBaseClassName} border border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800`}
                      type="button"
                      onClick={() => onApprove(plan.id)}
                    >
                      Mark Approved
                    </button>
                  ) : null}
                  {plan.approved && !plan.completed ? (
                    <button
                      className={`${actionButtonBaseClassName} border border-stone-900 bg-stone-900 text-white hover:bg-stone-800`}
                      type="button"
                      onClick={() => onComplete(plan.id)}
                    >
                      Mark Done
                    </button>
                  ) : null}
                  <button
                    className={`${actionButtonBaseClassName} border border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100`}
                    type="button"
                    onClick={() => onDelete(plan.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function InsightsKnowledgeView({
  plans,
  telemetryEvents,
}: {
  plans: StoredActionPlan[];
  telemetryEvents: TelemetryEvent[];
}) {
  const hasNoSignals = plans.length === 0 && telemetryEvents.length === 0;

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Local Intelligence
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-stone-950">
          Insights & Knowledge
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-stone-600 sm:text-base">
          Monitor local adoption signals and preview how approved sustainability
          knowledge sources could support future RAG-grounded recommendations.
        </p>
      </div>

      {hasNoSignals ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white px-5 py-5 text-sm leading-6 text-stone-600 shadow-sm">
          Load demo cases or create action plans to see adoption signals.
        </div>
      ) : null}

      <AdoptionSignals plans={plans} telemetryEvents={telemetryEvents} />
      <ApprovedKnowledgeSources />
    </section>
  );
}

function SustainabilityCaseForm({
  value,
  onChange,
  disabled = false,
}: {
  value: SustainabilityCaseInput;
  onChange: (value: SustainabilityCaseInput) => void;
  disabled?: boolean;
}) {
  const fieldClassName =
    "mt-2 block w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/15 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500";

  function updateField(field: keyof SustainabilityCaseInput, nextValue: string) {
    onChange({
      ...value,
      [field]: nextValue,
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Property
        </span>
        <input
          className={`${fieldClassName} min-h-12`}
          type="text"
          value={value.property}
          disabled={disabled}
          onChange={(event) => updateField("property", event.target.value)}
        />
      </label>

      <label>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Department
        </span>
        <select
          className={`${fieldClassName} min-h-12`}
          value={value.department}
          disabled={disabled}
          onChange={(event) => updateField("department", event.target.value)}
        >
          {departmentOptions.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      </label>

      <label className="md:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Sustainability Issue
        </span>
        <input
          className={`${fieldClassName} min-h-12`}
          type="text"
          value={value.issue}
          disabled={disabled}
          onChange={(event) => updateField("issue", event.target.value)}
        />
      </label>

      <label>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Current Metric
        </span>
        <input
          className={`${fieldClassName} min-h-12`}
          type="text"
          value={value.currentMetric}
          disabled={disabled}
          onChange={(event) => updateField("currentMetric", event.target.value)}
        />
      </label>

      <label>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Target Metric
        </span>
        <input
          className={`${fieldClassName} min-h-12`}
          type="text"
          value={value.targetMetric}
          disabled={disabled}
          onChange={(event) => updateField("targetMetric", event.target.value)}
        />
      </label>

      <label className="md:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Operational Context
        </span>
        <textarea
          className={`${fieldClassName} min-h-32 resize-y`}
          value={value.operationalContext}
          disabled={disabled}
          onChange={(event) =>
            updateField("operationalContext", event.target.value)
          }
        />
      </label>
    </div>
  );
}

function AccountabilityFields({
  draft,
  onDraftChange,
  disabled,
}: {
  draft: EditorDraft;
  onDraftChange: (draft: EditorDraft) => void;
  disabled: boolean;
}) {
  const fieldClassName =
    "mt-2 block w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/15 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500";

  return (
    <section className="mt-6 rounded-lg border border-stone-200 bg-[#fbfaf7] p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Accountability
        </p>
        <h4 className="mt-1 text-lg font-semibold text-stone-950">
          Owner and review timeline
        </h4>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Assigning an owner and review timeline helps convert AI
          recommendations into accountable operational follow-up.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Owner
          </span>
          <input
            className={`${fieldClassName} min-h-12`}
            type="text"
            value={draft.owner}
            disabled={disabled}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                owner: event.target.value,
              })
            }
          />
        </label>

        <label>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Priority
          </span>
          <select
            className={`${fieldClassName} min-h-12`}
            value={draft.priority}
            disabled={disabled}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                priority: event.target.value as StoredActionPlan["priority"],
              })
            }
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>

        <label>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Target Date
          </span>
          <input
            className={`${fieldClassName} min-h-12`}
            type="date"
            value={draft.targetDate}
            disabled={disabled}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                targetDate: event.target.value,
              })
            }
          />
        </label>

        <label>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Next Review Date
          </span>
          <input
            className={`${fieldClassName} min-h-12`}
            type="date"
            value={draft.nextReviewDate}
            disabled={disabled}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                nextReviewDate: event.target.value,
              })
            }
          />
        </label>
      </div>
    </section>
  );
}

function ReadinessChecklistForm({
  draft,
  onDraftChange,
  disabled,
}: {
  draft: EditorDraft;
  onDraftChange: (draft: EditorDraft) => void;
  disabled: boolean;
}) {
  return (
    <section className="mt-5 rounded-lg border border-stone-200 bg-white p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
          Readiness Checklist
        </p>
        <h4 className="mt-1 text-lg font-semibold text-stone-950">
          Approval readiness gate
        </h4>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Approval is gated by operational readiness. AI recommendations must be
          assigned to an owner before implementation.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {readinessChecklistItems.map((item) => (
          <label
            key={item.field}
            className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700"
          >
            <input
              className="mt-1 h-4 w-4 rounded border-stone-300 accent-emerald-800 disabled:cursor-not-allowed"
              type="checkbox"
              checked={draft.readinessChecklist[item.field]}
              disabled={disabled}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  readinessChecklist: {
                    ...draft.readinessChecklist,
                    [item.field]: event.target.checked,
                  },
                })
              }
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>

      {draft.approved ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
          Approval confirms this plan is ready for operational implementation.
        </p>
      ) : null}
    </section>
  );
}

function KpiProgressForm({
  draft,
  onDraftChange,
  disabled,
}: {
  draft: EditorDraft;
  onDraftChange: (draft: EditorDraft) => void;
  disabled: boolean;
}) {
  const fieldClassName =
    "mt-2 block w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/15 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500";

  function updateField(field: keyof KPIProgress, value: string) {
    onDraftChange({
      ...draft,
      kpiProgress: {
        ...draft.kpiProgress,
        [field]: value,
      },
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Baseline
        </span>
        <input
          className={`${fieldClassName} min-h-12`}
          type="text"
          value={draft.kpiProgress.baseline}
          disabled={disabled}
          placeholder="1,000 kg laundry/week"
          onChange={(event) => updateField("baseline", event.target.value)}
        />
      </label>

      <label>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Current
        </span>
        <input
          className={`${fieldClassName} min-h-12`}
          type="text"
          value={draft.kpiProgress.current}
          disabled={disabled}
          placeholder="1,180 kg laundry/week"
          onChange={(event) => updateField("current", event.target.value)}
        />
      </label>

      <label className="md:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Target
        </span>
        <input
          className={`${fieldClassName} min-h-12`}
          type="text"
          value={draft.kpiProgress.target}
          disabled={disabled}
          placeholder="Return to 1,000 kg/week within 60 days"
          onChange={(event) => updateField("target", event.target.value)}
        />
      </label>

      <label className="md:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Latest Update
        </span>
        <textarea
          className={`${fieldClassName} min-h-28 resize-y`}
          value={draft.kpiProgress.latestUpdate}
          disabled={disabled}
          placeholder="Week 1: Laundry volume reduced by 4% after renewed towel reuse briefing."
          onChange={(event) => updateField("latestUpdate", event.target.value)}
        />
      </label>
    </div>
  );
}

function ActionPlanOutput({
  actionPlan,
  governanceReview,
}: {
  actionPlan: AIActionPlan;
  governanceReview: GovernanceReview;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
        <p>Generated by AI. Human review is required before implementation.</p>
        <p>Do not enter guest personal data.</p>
        <p>Audit timestamp: {formatDate(governanceReview.auditTimestamp)}</p>
      </div>

      {getActionPlanSections(actionPlan).map((section) => (
        <section
          key={section.title}
          className="rounded-lg border border-stone-200 bg-[#fbfaf7] p-5"
        >
          <h3 className="text-sm font-semibold uppercase tracking-[0.13em] text-stone-700">
            {section.title}
          </h3>
          {section.body ? (
            <p className="mt-3 text-sm leading-6 text-stone-600">
              {section.body}
            </p>
          ) : null}
          {section.items ? (
            <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-600">
              {section.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-800" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-stone-500">
            Confidence Level
          </p>
          <p className="mt-2 text-lg font-semibold text-stone-950">
            {actionPlan.confidenceLevel}
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-stone-500">
            Human Review Required
          </p>
          <p className="mt-2 text-lg font-semibold text-stone-950">
            {actionPlan.humanReviewRequired ? "Yes" : "No"}
          </p>
        </div>
      </section>
    </div>
  );
}

function ActionPlanEditor({
  draft,
  activePanel,
  errorMessage,
  successMessage,
  isGenerating,
  onBack,
  onDraftChange,
  onPanelChange,
  onGenerate,
  onSave,
  onApprove,
  onComplete,
  onResetApproval,
}: {
  draft: EditorDraft;
  activePanel: EditorPanel;
  errorMessage: string | null;
  successMessage: string | null;
  isGenerating: boolean;
  onBack: () => void;
  onDraftChange: (draft: EditorDraft) => void;
  onPanelChange: (panel: EditorPanel) => void;
  onGenerate: () => void;
  onSave: () => void;
  onApprove: () => void;
  onComplete: () => void;
  onResetApproval: () => void;
}) {
  const status = getVisibleStatus({
    approved: draft.approved,
    completed: draft.completed,
  });
  const isApprovedLocked = draft.approved;
  const canSave = Boolean(draft.actionPlan);
  const canApprove = Boolean(draft.actionPlan) && !draft.approved;
  const canComplete = draft.approved && !draft.completed;
  const canResetApproval = draft.approved && !draft.completed;

  return (
    <section className="space-y-5">
      <div className="sticky top-0 z-20 -mx-5 border-b border-stone-200 bg-[#f7f3ec]/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 rounded-lg border border-stone-200 bg-white/95 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
              type="button"
              onClick={onBack}
            >
              Back to Action Plans
            </button>
            <StatusBadge status={status} />
            <span className="inline-flex rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-700">
              {draft.actionPlan ? "Generated" : "Draft"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-stone-950 bg-stone-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
              type="button"
              onClick={onSave}
              disabled={!canSave}
            >
              Save Action Plan
            </button>
            {canApprove ? (
              <button
                className="rounded-lg border border-emerald-700 bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                type="button"
                onClick={onApprove}
              >
                Mark Approved
              </button>
            ) : null}
            {canComplete ? (
              <button
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
                type="button"
                onClick={onComplete}
              >
                Mark Done
              </button>
            ) : null}
            {canResetApproval ? (
              <button
                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-100"
                type="button"
                onClick={onResetApproval}
              >
                Reset Approval
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
              Action Plan Editor
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-stone-950">
              {getPlanTitle(draft.sustainabilityCase)}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={status} />
            <span className="inline-flex rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-700">
              {draft.actionPlan ? "Generated" : "Draft"}
            </span>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
            {successMessage}
          </div>
        ) : null}

        <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
          <p>AI recommendations require human review before implementation.</p>
          <p>Approval is gated by operational readiness.</p>
          <p>
            AI recommendations must be assigned to an owner before
            implementation.
          </p>
          <p>
            KPI progress helps track whether the action plan is creating
            measurable impact.
          </p>
          <p>Approved plans are locked to protect the operational record.</p>
          <p>Implementation notes are available after approval.</p>
        </div>

        {isApprovedLocked ? (
          <div className="mt-5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950">
            This action plan has been approved and locked to protect the
            operational record.
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || isApprovedLocked}
          >
            {isGenerating
              ? "Generating action plan..."
              : draft.actionPlan
                ? "Regenerate Action Plan"
                : "Generate Action Plan"}
          </button>
          {canApprove ? (
            <button
              className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
              type="button"
              onClick={onApprove}
            >
              Mark Approved
            </button>
          ) : null}
          {canComplete ? (
            <button
              className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
              type="button"
              onClick={onComplete}
            >
              Mark Done
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <article className="rounded-lg border border-stone-200 bg-white shadow-sm">
          <button
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left sm:px-7"
            type="button"
            onClick={() => onPanelChange(activePanel === "case" ? "plan" : "case")}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                Section 1
              </p>
              <h3 className="mt-1 text-xl font-semibold text-stone-950">
                Operational Case Form
              </h3>
            </div>
            <span className="text-sm font-semibold text-stone-500">
              {activePanel === "case" ? "Collapse" : "Expand"}
            </span>
          </button>
          {activePanel === "case" ? (
            <div className="border-t border-stone-200 px-6 py-6 sm:px-7">
              {isApprovedLocked ? (
                <div className="mb-5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950">
                  This action plan has been approved and locked to protect the
                  operational record.
                </div>
              ) : null}
              <SustainabilityCaseForm
                value={draft.sustainabilityCase}
                disabled={isApprovedLocked}
                onChange={(sustainabilityCase) =>
                  onDraftChange({
                    ...draft,
                    sustainabilityCase,
                  })
                }
              />
              <AccountabilityFields
                draft={draft}
                disabled={isApprovedLocked}
                onDraftChange={onDraftChange}
              />
              <ReadinessChecklistForm
                draft={draft}
                disabled={isApprovedLocked}
                onDraftChange={onDraftChange}
              />
              <button
                className="mt-5 rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
                type="button"
                onClick={onGenerate}
                disabled={isGenerating || isApprovedLocked}
              >
                {isGenerating ? "Generating action plan..." : "Generate Action Plan"}
              </button>
              {isApprovedLocked ? (
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  Reset approval before making changes or refreshing the AI
                  output.
                </p>
              ) : null}
            </div>
          ) : null}
        </article>

        <article
          className={`rounded-lg border bg-white shadow-sm ${
            draft.actionPlan ? "border-stone-200" : "border-dashed border-stone-300"
          }`}
        >
          <button
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left disabled:cursor-not-allowed sm:px-7"
            type="button"
            disabled={!draft.actionPlan}
            onClick={() => onPanelChange(activePanel === "plan" ? "case" : "plan")}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                Section 2
              </p>
              <h3 className="mt-1 text-xl font-semibold text-stone-950">
                Generated Action Plan
              </h3>
              {!draft.actionPlan ? (
                <p className="mt-2 text-sm text-stone-500">
                  Generate an action plan first to unlock this section.
                </p>
              ) : null}
              {!draft.actionPlan ? (
                <p className="mt-1 text-sm font-medium text-stone-500">
                  Generate an action plan before saving.
                </p>
              ) : null}
            </div>
            <span className="text-sm font-semibold text-stone-500">
              {draft.actionPlan
                ? activePanel === "plan"
                  ? "Collapse"
                  : "Expand"
                : "Locked"}
            </span>
          </button>
          {activePanel === "plan" && draft.actionPlan ? (
            <div className="border-t border-stone-200 px-6 py-6 sm:px-7">
              {isApprovedLocked ? (
                <div className="mb-5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950">
                  This action plan has been approved and locked to protect the
                  operational record.
                </div>
              ) : null}
              <div className="mb-5 flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-950">
                    Save this generated action plan
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    Save Action Plan records this AI output locally so it appears
                    in the action-plan list.
                  </p>
                </div>
                <button
                  className="min-h-11 rounded-lg bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                  type="button"
                  onClick={onSave}
                  disabled={!canSave}
                >
                  Save Action Plan
                </button>
              </div>
              <ActionPlanOutput
                actionPlan={draft.actionPlan}
                governanceReview={draft.governanceReview}
              />
            </div>
          ) : !draft.actionPlan ? (
            <div className="border-t border-stone-200 px-6 py-5 sm:px-7">
              <button
                className="rounded-lg bg-stone-300 px-4 py-2.5 text-sm font-semibold text-white"
                type="button"
                disabled
              >
                Save Action Plan
              </button>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Generate an action plan before saving.
              </p>
            </div>
          ) : null}
        </article>

        <article className="rounded-lg border border-stone-200 bg-white shadow-sm">
          <button
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left sm:px-7"
            type="button"
            onClick={() => onPanelChange(activePanel === "kpi" ? "plan" : "kpi")}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                Section 3
              </p>
              <h3 className="mt-1 text-xl font-semibold text-stone-950">
                KPI Progress
              </h3>
              <p className="mt-2 text-sm text-stone-500">
                Use this section to record whether the action plan is producing
                measurable operational improvement.
              </p>
            </div>
            <span className="text-sm font-semibold text-stone-500">
              {activePanel === "kpi" ? "Collapse" : "Expand"}
            </span>
          </button>
          {activePanel === "kpi" ? (
            <div className="border-t border-stone-200 px-6 py-6 sm:px-7">
              {draft.completed ? (
                <div className="mb-5 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">
                  KPI progress is read-only once the action plan is marked done.
                </div>
              ) : null}
              <KpiProgressForm
                draft={draft}
                disabled={draft.completed}
                onDraftChange={onDraftChange}
              />
            </div>
          ) : null}
        </article>

        <article
          className={`rounded-lg border bg-white shadow-sm ${
            draft.approved ? "border-stone-200" : "border-dashed border-stone-300"
          }`}
        >
          <button
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left disabled:cursor-not-allowed sm:px-7"
            type="button"
            disabled={!draft.approved}
            onClick={() =>
              onPanelChange(activePanel === "notes" ? "plan" : "notes")
            }
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                Section 4
              </p>
              <h3 className="mt-1 text-xl font-semibold text-stone-950">
                Action Notes
              </h3>
              {!draft.approved ? (
                <p className="mt-2 text-sm text-stone-500">
                  Approve this action plan to unlock implementation notes.
                </p>
              ) : null}
            </div>
            <span className="text-sm font-semibold text-stone-500">
              {draft.approved
                ? activePanel === "notes"
                  ? "Collapse"
                  : "Expand"
                : "Locked"}
            </span>
          </button>
          {activePanel === "notes" && draft.approved ? (
            <div className="border-t border-stone-200 px-6 py-6 sm:px-7">
              <label>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Implementation Progress Notes
                </span>
                <textarea
                  className="mt-2 block min-h-40 w-full resize-y rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/15"
                  value={draft.actionNotes}
                  onChange={(event) =>
                    onDraftChange({
                      ...draft,
                      actionNotes: event.target.value,
                    })
                  }
                />
              </label>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Use this space to record implementation progress, observations,
                and follow-up actions.
              </p>
            </div>
          ) : !draft.approved ? (
            <div className="border-t border-stone-200 px-6 py-5 sm:px-7">
              <p className="text-sm leading-6 text-stone-500">
                Approve this action plan to unlock implementation notes.
              </p>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}

export default function SustainabilityCopilotApp() {
  const [plans, setPlans] = useState<StoredActionPlan[]>([]);
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([]);
  const [hasHydratedPlans, setHasHydratedPlans] = useState(false);
  const [hasHydratedTelemetry, setHasHydratedTelemetry] = useState(false);
  const [currentMainView, setCurrentMainView] =
    useState<MainView>("actionPlans");
  const [editorDraft, setEditorDraft] = useState<EditorDraft | null>(null);
  const [activePanel, setActivePanel] = useState<EditorPanel>("case");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const skipNextPlansPersistRef = useRef(false);
  const skipNextTelemetryPersistRef = useRef(false);

  useEffect(() => {
    let isActive = true;
    let nextPlans: StoredActionPlan[] | null = null;

    try {
      const storedPlans = localStorage.getItem(actionPlansStorageKey);

      if (storedPlans) {
        const parsedPlans: unknown = JSON.parse(storedPlans);
        nextPlans = normalizeStoredActionPlans(parsedPlans);
      }
    } catch {
      // Invalid browser storage should not block the prototype workflow.
    }

    queueMicrotask(() => {
      if (!isActive) {
        return;
      }

      if (nextPlans) {
        setPlans(nextPlans);
      }

      setHasHydratedPlans(true);
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedPlans) {
      return;
    }

    if (skipNextPlansPersistRef.current) {
      skipNextPlansPersistRef.current = false;
      return;
    }

    try {
      localStorage.setItem(actionPlansStorageKey, JSON.stringify(plans));
    } catch {
      // Local storage can fail in private browsing or quota-limited contexts.
    }
  }, [hasHydratedPlans, plans]);

  useEffect(() => {
    let isActive = true;
    let nextTelemetryEvents: TelemetryEvent[] | null = null;

    try {
      const storedTelemetry = localStorage.getItem(telemetryStorageKey);

      if (storedTelemetry) {
        const parsedTelemetry: unknown = JSON.parse(storedTelemetry);
        nextTelemetryEvents = normalizeTelemetryEvents(parsedTelemetry);
      }
    } catch {
      // Invalid browser telemetry should not block the prototype workflow.
    }

    queueMicrotask(() => {
      if (!isActive) {
        return;
      }

      if (nextTelemetryEvents) {
        setTelemetryEvents(nextTelemetryEvents);
      }

      setHasHydratedTelemetry(true);
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedTelemetry) {
      return;
    }

    if (skipNextTelemetryPersistRef.current) {
      skipNextTelemetryPersistRef.current = false;
      return;
    }

    try {
      localStorage.setItem(
        telemetryStorageKey,
        JSON.stringify(telemetryEvents),
      );
    } catch {
      // Local telemetry can fail in private browsing or quota-limited contexts.
    }
  }, [hasHydratedTelemetry, telemetryEvents]);

  function recordTelemetry({
    eventName,
    planId,
    department,
  }: {
    eventName: TelemetryEventName;
    planId?: string;
    department?: string;
  }) {
    const event: TelemetryEvent = {
      id: createId(),
      eventName,
      planId,
      department,
      timestamp: new Date().toISOString(),
    };

    setTelemetryEvents((currentEvents) => [event, ...currentEvents]);
  }

  function openNewEditor() {
    recordTelemetry({
      eventName: "action_plan_created",
      department: defaultSustainabilityCase.department,
    });
    setEditorDraft({
      id: null,
      sustainabilityCase: defaultSustainabilityCase,
      actionPlan: null,
      governanceReview: emptyGovernanceReview,
      actionNotes: "",
      owner: "",
      priority: "Medium",
      targetDate: "",
      nextReviewDate: "",
      readinessChecklist: { ...emptyReadinessChecklist },
      kpiProgress: { ...emptyKpiProgress },
      approved: false,
      completed: false,
      createdAt: null,
    });
    setActivePanel("case");
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function openExistingEditor(plan: StoredActionPlan) {
    setEditorDraft({
      id: plan.id,
      sustainabilityCase: plan.sustainabilityCase,
      actionPlan: plan.actionPlan,
      governanceReview: plan.governanceReview,
      actionNotes: plan.actionNotes ?? "",
      owner: plan.owner,
      priority: plan.priority,
      targetDate: plan.targetDate,
      nextReviewDate: plan.nextReviewDate,
      readinessChecklist: plan.readinessChecklist,
      kpiProgress: plan.kpiProgress,
      approved: plan.approved,
      completed: plan.completed,
      createdAt: plan.createdAt,
    });
    setActivePanel(plan.actionPlan ? "plan" : "case");
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function closeEditor() {
    setEditorDraft(null);
    setActivePanel("case");
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function deletePlan(planId: string) {
    if (window.confirm("Delete this sustainability action plan?")) {
      const plan = plans.find((currentPlan) => currentPlan.id === planId);

      if (plan) {
        recordTelemetry({
          eventName: "action_plan_deleted",
          planId,
          department: plan.sustainabilityCase.department,
        });
      }

      setPlans((currentPlans) =>
        currentPlans.filter((plan) => plan.id !== planId),
      );
    }
  }

  function clearLocalDemoData() {
    if (
      !window.confirm(
        "Clear all locally saved sustainability action plans for this browser?",
      )
    ) {
      return;
    }

    skipNextPlansPersistRef.current = true;
    skipNextTelemetryPersistRef.current = true;
    localStorage.removeItem(actionPlansStorageKey);
    localStorage.removeItem(telemetryStorageKey);
    setPlans([]);
    setTelemetryEvents([]);
  }

  function loadDemoCases() {
    const existingPlanIds = new Set(plans.map((plan) => plan.id));
    const demoPlansToAdd = demoActionPlans
      .filter((plan) => !existingPlanIds.has(plan.id))
      .map(copyActionPlan);

    if (demoPlansToAdd.length === 0) {
      window.alert("Demo action plans are already loaded.");
      return;
    }

    if (
      plans.length > 0 &&
      !window.confirm(
        "This will add demo action plans to your local list. Continue?",
      )
    ) {
      return;
    }

    setPlans((currentPlans) => [...demoPlansToAdd, ...currentPlans]);
    recordTelemetry({
      eventName: "demo_cases_loaded",
    });
  }

  function markPlanApproved(planId: string) {
    const now = new Date().toISOString();
    const plan = plans.find((currentPlan) => currentPlan.id === planId);

    setPlans((currentPlans) =>
      currentPlans.map((plan) =>
        plan.id === planId && isReadyForApproval(plan)
          ? {
              ...plan,
              approved: true,
              completed: false,
              updatedAt: now,
              governanceReview: {
                ...plan.governanceReview,
                approvedOperationalUse: true,
                reviewerStatus: "Approved",
              },
            }
          : plan,
      ),
    );

    if (plan && !isReadyForApproval(plan)) {
      window.alert(
        "Complete the readiness checklist and accountability fields before approval.",
      );
    } else if (plan) {
      recordTelemetry({
        eventName: "action_plan_approved",
        planId,
        department: plan.sustainabilityCase.department,
      });
    }
  }

  function markPlanDone(planId: string) {
    const plan = plans.find((currentPlan) => currentPlan.id === planId);

    if (!plan || !plan.approved || plan.completed) {
      return;
    }

    if (!window.confirm("Mark this sustainability action plan as done?")) {
      return;
    }

    const now = new Date().toISOString();

    setPlans((currentPlans) =>
      currentPlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              approved: true,
              completed: true,
              updatedAt: now,
              governanceReview: {
                ...plan.governanceReview,
                approvedOperationalUse: true,
                reviewerStatus: "Approved",
              },
            }
          : plan,
      ),
    );
    recordTelemetry({
      eventName: "action_plan_marked_done",
      planId,
      department: plan.sustainabilityCase.department,
    });
  }

  function updateDraft(nextDraft: EditorDraft) {
    setEditorDraft(nextDraft);
    setSuccessMessage(null);
  }

  async function generateForDraft() {
    if (!editorDraft) {
      return;
    }

    if (editorDraft.approved) {
      setErrorMessage(
        "This action plan is approved and locked. Reset approval before regenerating.",
      );
      setSuccessMessage(null);
      return;
    }

    if (!hasCompleteCase(editorDraft.sustainabilityCase)) {
      setErrorMessage(
        "Please complete all required fields before generating an action plan.",
      );
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGenerating(true);

    try {
      const sustainabilityCase = trimCase(editorDraft.sustainabilityCase);
      const response = await fetch("/api/action-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sustainabilityCase),
      });
      const data: unknown = await response.json();

      if (!response.ok) {
        setErrorMessage(
          getErrorMessage(data) ??
            "The action plan could not be generated. Please review the case details and try again.",
        );
        return;
      }

      const returnedActionPlan = getReturnedActionPlan(data);

      if (!returnedActionPlan) {
        setErrorMessage("The action plan response was not in the expected format.");
        return;
      }

      setEditorDraft((currentDraft) => {
        if (!currentDraft) {
          return currentDraft;
        }

        return {
          ...currentDraft,
          sustainabilityCase,
          actionPlan: returnedActionPlan,
          approved: false,
          completed: false,
          governanceReview: {
            humanReviewRequired: returnedActionPlan.humanReviewRequired,
            containsGuestPersonalData: false,
            approvedOperationalUse: false,
            reviewerStatus: "Pending",
            auditTimestamp: new Date().toISOString(),
          },
        };
      });
      setActivePanel("plan");
      recordTelemetry({
        eventName: "action_plan_generated",
        planId: editorDraft.id ?? undefined,
        department: sustainabilityCase.department,
      });
    } catch {
      setErrorMessage(
        "The request failed. Check your connection and try generating the action plan again.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function saveDraft() {
    if (!editorDraft) {
      return;
    }

    if (!hasCompleteCase(editorDraft.sustainabilityCase)) {
      setErrorMessage(
        "Please complete all required fields before saving an action plan.",
      );
      setSuccessMessage(null);
      return;
    }

    if (!editorDraft.actionPlan) {
      setErrorMessage("Generate an action plan before saving.");
      setSuccessMessage(null);
      return;
    }

    const now = new Date().toISOString();
    const sustainabilityCase = trimCase(editorDraft.sustainabilityCase);
    const owner = editorDraft.owner.trim();
    const title = getPlanTitle(sustainabilityCase);
    const governanceReview = {
      ...editorDraft.governanceReview,
      reviewerStatus: getReviewerStatus(
        editorDraft.approved,
        editorDraft.completed,
      ),
      approvedOperationalUse: editorDraft.approved,
    };

    if (editorDraft.id) {
      setPlans((currentPlans) =>
        currentPlans.map((plan) =>
          plan.id === editorDraft.id
            ? {
                ...plan,
                title,
                sustainabilityCase,
                actionPlan: editorDraft.actionPlan,
                governanceReview,
                actionNotes: editorDraft.actionNotes,
                owner,
                priority: editorDraft.priority,
                targetDate: editorDraft.targetDate,
                nextReviewDate: editorDraft.nextReviewDate,
                readinessChecklist: editorDraft.readinessChecklist,
                kpiProgress: editorDraft.kpiProgress,
                approved: editorDraft.approved,
                completed: editorDraft.completed,
                updatedAt: now,
              }
            : plan,
        ),
      );
      setEditorDraft({
        ...editorDraft,
        sustainabilityCase,
        owner,
        governanceReview,
      });
      recordTelemetry({
        eventName: "action_plan_saved",
        planId: editorDraft.id,
        department: sustainabilityCase.department,
      });

      if (editorDraft.actionNotes.trim().length > 0) {
        recordTelemetry({
          eventName: "action_notes_updated",
          planId: editorDraft.id,
          department: sustainabilityCase.department,
        });
      }

      if (
        editorDraft.kpiProgress.baseline.trim().length > 0 ||
        editorDraft.kpiProgress.current.trim().length > 0 ||
        editorDraft.kpiProgress.target.trim().length > 0 ||
        editorDraft.kpiProgress.latestUpdate.trim().length > 0
      ) {
        recordTelemetry({
          eventName: "kpi_progress_updated",
          planId: editorDraft.id,
          department: sustainabilityCase.department,
        });
      }
    } else {
      const id = createId();
      const newPlan: StoredActionPlan = {
        id,
        title,
        sustainabilityCase,
        actionPlan: editorDraft.actionPlan,
        governanceReview,
        actionNotes: editorDraft.actionNotes,
        owner,
        priority: editorDraft.priority,
        targetDate: editorDraft.targetDate,
        nextReviewDate: editorDraft.nextReviewDate,
        readinessChecklist: editorDraft.readinessChecklist,
        kpiProgress: editorDraft.kpiProgress,
        approved: editorDraft.approved,
        completed: editorDraft.completed,
        createdAt: now,
        updatedAt: now,
      };

      setPlans((currentPlans) => [newPlan, ...currentPlans]);
      setEditorDraft({
        ...editorDraft,
        id,
        sustainabilityCase,
        owner,
        governanceReview,
        createdAt: now,
      });
      recordTelemetry({
        eventName: "action_plan_saved",
        planId: id,
        department: sustainabilityCase.department,
      });

      if (editorDraft.actionNotes.trim().length > 0) {
        recordTelemetry({
          eventName: "action_notes_updated",
          planId: id,
          department: sustainabilityCase.department,
        });
      }

      if (
        editorDraft.kpiProgress.baseline.trim().length > 0 ||
        editorDraft.kpiProgress.current.trim().length > 0 ||
        editorDraft.kpiProgress.target.trim().length > 0 ||
        editorDraft.kpiProgress.latestUpdate.trim().length > 0
      ) {
        recordTelemetry({
          eventName: "kpi_progress_updated",
          planId: id,
          department: sustainabilityCase.department,
        });
      }
    }

    setErrorMessage(null);
    setSuccessMessage("Action plan saved locally.");
  }

  function markDraftApproved() {
    if (!editorDraft || !editorDraft.actionPlan) {
      return;
    }

    if (!isReadyForApproval(editorDraft)) {
      setErrorMessage(
        "Complete the readiness checklist and accountability fields before approval.",
      );
      setSuccessMessage(null);
      setActivePanel("case");
      return;
    }

    setEditorDraft({
      ...editorDraft,
      approved: true,
      completed: false,
      governanceReview: {
        ...editorDraft.governanceReview,
        approvedOperationalUse: true,
        reviewerStatus: "Approved",
      },
    });
    setActivePanel("notes");
    setErrorMessage(null);
    setSuccessMessage(null);
    recordTelemetry({
      eventName: "action_plan_approved",
      planId: editorDraft.id ?? undefined,
      department: editorDraft.sustainabilityCase.department,
    });
  }

  function markDraftDone() {
    if (!editorDraft || !editorDraft.approved || editorDraft.completed) {
      return;
    }

    if (!window.confirm("Mark this sustainability action plan as done?")) {
      return;
    }

    setEditorDraft({
      ...editorDraft,
      approved: true,
      completed: true,
      governanceReview: {
        ...editorDraft.governanceReview,
        approvedOperationalUse: true,
        reviewerStatus: "Approved",
      },
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    recordTelemetry({
      eventName: "action_plan_marked_done",
      planId: editorDraft.id ?? undefined,
      department: editorDraft.sustainabilityCase.department,
    });
  }

  function resetDraftApproval() {
    if (!editorDraft || editorDraft.completed) {
      return;
    }

    setEditorDraft({
      ...editorDraft,
      approved: false,
      completed: false,
      governanceReview: {
        ...editorDraft.governanceReview,
        approvedOperationalUse: false,
        reviewerStatus: "Pending",
      },
    });
    setActivePanel("case");
    setErrorMessage(null);
    setSuccessMessage("Approval reset. Changes require a new approval before implementation.");
    recordTelemetry({
      eventName: "approval_reset",
      planId: editorDraft.id ?? undefined,
      department: editorDraft.sustainabilityCase.department,
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-stone-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
        {editorDraft ? (
          <ActionPlanEditor
            draft={editorDraft}
            activePanel={activePanel}
            errorMessage={errorMessage}
            successMessage={successMessage}
            isGenerating={isGenerating}
            onBack={closeEditor}
            onDraftChange={updateDraft}
            onPanelChange={setActivePanel}
            onGenerate={generateForDraft}
            onSave={saveDraft}
            onApprove={markDraftApproved}
            onComplete={markDraftDone}
            onResetApproval={resetDraftApproval}
          />
        ) : (
          <>
            <AppHeader
              currentMainView={currentMainView}
              onViewChange={setCurrentMainView}
              onCreate={openNewEditor}
            />
            {currentMainView === "actionPlans" ? (
              <ActionPlanList
                plans={plans}
                onCreate={openNewEditor}
                onLoadDemoCases={loadDemoCases}
                onEdit={openExistingEditor}
                onDelete={deletePlan}
                onApprove={markPlanApproved}
                onComplete={markPlanDone}
                onClearLocalData={clearLocalDemoData}
              />
            ) : (
              <InsightsKnowledgeView
                plans={plans}
                telemetryEvents={telemetryEvents}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
