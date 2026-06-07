"use client";

import { useEffect, useRef, useState } from "react";
import { demoActionPlans } from "@/lib/demo-plans";
import {
  defaultSustainabilityCase,
  emptyGovernanceReview,
  emptyKpiProgress,
  emptyReadinessChecklist,
} from "./constants";
import { AdoptionSignals } from "./AdoptionSignals";
import { ActionPlanEditor } from "./ActionPlanEditor";
import { ActionPlanList } from "./ActionPlanList";
import { KnowledgeSourcesPanel } from "./KnowledgeSourcesPanel";
import {
  clearStoredActionPlans,
  readStoredActionPlans,
  writeStoredActionPlans,
} from "./action-plan-storage";
import {
  clearStoredTelemetryEvents,
  readStoredTelemetryEvents,
  writeStoredTelemetryEvents,
} from "./telemetry-storage";
import {
  copyActionPlan,
  createId,
  getErrorMessage,
  getPlanTitle,
  getReturnedActionPlan,
  getReviewerStatus,
  hasCompleteCase,
  isReadyForApproval,
  trimCase,
} from "./action-plan-utils";
import type {
  EditorDraft,
  EditorPanel,
  MainView,
} from "./types";
import type {
  StoredActionPlan,
  TelemetryEvent,
  TelemetryEventName,
} from "@/lib/types";

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
      <KnowledgeSourcesPanel />
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
      nextPlans = readStoredActionPlans();
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
      writeStoredActionPlans(plans);
    } catch {
      // Local storage can fail in private browsing or quota-limited contexts.
    }
  }, [hasHydratedPlans, plans]);

  useEffect(() => {
    let isActive = true;
    let nextTelemetryEvents: TelemetryEvent[] | null = null;

    try {
      nextTelemetryEvents = readStoredTelemetryEvents();
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
      writeStoredTelemetryEvents(telemetryEvents);
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
    clearStoredActionPlans();
    clearStoredTelemetryEvents();
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
