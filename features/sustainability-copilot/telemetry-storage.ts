import type { TelemetryEvent } from "@/lib/types";
import { normalizeTelemetryEvents } from "./telemetry-utils";

export const telemetryStorageKey = "como-sustainability-telemetry-events";

export function readStoredTelemetryEvents(): TelemetryEvent[] | null {
  const storedTelemetry = localStorage.getItem(telemetryStorageKey);

  if (!storedTelemetry) {
    return null;
  }

  const parsedTelemetry: unknown = JSON.parse(storedTelemetry);
  return normalizeTelemetryEvents(parsedTelemetry);
}

export function writeStoredTelemetryEvents(telemetryEvents: TelemetryEvent[]) {
  localStorage.setItem(telemetryStorageKey, JSON.stringify(telemetryEvents));
}

export function clearStoredTelemetryEvents() {
  localStorage.removeItem(telemetryStorageKey);
}
