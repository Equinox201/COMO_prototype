import type { StoredActionPlan } from "@/lib/types";
import { formatDate, getVisibleStatus } from "./action-plan-utils";
import { OperationalOverview } from "./OperationalOverview";
import { StatusBadge } from "./StatusBadge";

type ActionPlanListProps = {
  plans: StoredActionPlan[];
  onCreate: () => void;
  onLoadDemoCases: () => void;
  onEdit: (plan: StoredActionPlan) => void;
  onDelete: (planId: string) => void;
  onApprove: (planId: string) => void;
  onComplete: (planId: string) => void;
  onClearLocalData: () => void;
};

export function ActionPlanList({
  plans,
  onCreate,
  onLoadDemoCases,
  onEdit,
  onDelete,
  onApprove,
  onComplete,
  onClearLocalData,
}: ActionPlanListProps) {
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
