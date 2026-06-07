import type { StoredActionPlan } from "@/lib/types";
import { normalizeStoredActionPlans } from "./action-plan-utils";

export const actionPlansStorageKey = "como-sustainability-action-plans";

export function readStoredActionPlans(): StoredActionPlan[] | null {
  const storedPlans = localStorage.getItem(actionPlansStorageKey);

  if (!storedPlans) {
    return null;
  }

  const parsedPlans: unknown = JSON.parse(storedPlans);
  return normalizeStoredActionPlans(parsedPlans);
}

export function writeStoredActionPlans(plans: StoredActionPlan[]) {
  localStorage.setItem(actionPlansStorageKey, JSON.stringify(plans));
}

export function clearStoredActionPlans() {
  localStorage.removeItem(actionPlansStorageKey);
}
