import {
  AUTO_RELEASE_MS_MAX,
  AUTO_RELEASE_MS_MIN,
} from "./dashboardConstants";

export function randomAutoReleaseDurationMs(): number {
  const min = AUTO_RELEASE_MS_MIN;
  const max = AUTO_RELEASE_MS_MAX;
  return min + Math.floor(Math.random() * (max - min + 1));
}
