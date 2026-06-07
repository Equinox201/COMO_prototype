import {
  departmentOptions,
  readinessChecklistItems,
} from "./constants";
import {
  formatDate,
  getActionPlanSections,
  getPlanTitle,
  getVisibleStatus,
} from "./action-plan-utils";
import { StatusBadge } from "./StatusBadge";
import type {
  AIActionPlan,
  GovernanceReview,
  KPIProgress,
  StoredActionPlan,
  SustainabilityCaseInput,
} from "@/lib/types";
import type { EditorDraft, EditorPanel } from "./types";

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

export function ActionPlanEditor({
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
