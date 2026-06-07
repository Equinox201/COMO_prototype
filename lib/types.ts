export type SustainabilityCaseInput = {
  property: string;
  department: string;
  issue: string;
  currentMetric: string;
  targetMetric: string;
  operationalContext: string;
};

export type AIActionPlan = {
  situationSummary: string;
  likelyRootCauses: string[];
  recommendedOperationalActions: string[];
  staffMicroTrainingMessage: string;
  managerChecklist: string[];
  kpisToMonitor: string[];
  governancePrivacyNotes: string[];
  followUpRecommendations: string[];
  confidenceLevel: "Low" | "Medium" | "High";
  humanReviewRequired: boolean;
};

export type GovernanceReview = {
  humanReviewRequired: boolean;
  containsGuestPersonalData: boolean;
  approvedOperationalUse: boolean;
  reviewerStatus: "Pending" | "Approved" | "Needs Revision";
  auditTimestamp: string;
};

export type ReadinessChecklist = {
  actionsAreSpecific: boolean;
  kpisAreMeasurable: boolean;
  ownerAssigned: boolean;
  timelineDefined: boolean;
  privacyReviewed: boolean;
  staffMessageReady: boolean;
};

export type KPIProgress = {
  baseline: string;
  current: string;
  target: string;
  latestUpdate: string;
};

export type StoredActionPlan = {
  id: string;
  title: string;
  sustainabilityCase: SustainabilityCaseInput;
  actionPlan: AIActionPlan | null;
  governanceReview: GovernanceReview;
  actionNotes: string;
  owner: string;
  priority: "Low" | "Medium" | "High";
  targetDate: string;
  nextReviewDate: string;
  readinessChecklist: ReadinessChecklist;
  kpiProgress: KPIProgress;
  approved: boolean;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};
