export const CONSENT_KEY = "hp_consent_v1";
export const CONSENT_EVENT = "hp:consent-change";

export type ConsentValue = "granted" | "denied" | null;

export function readConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(v: "granted" | "denied") {
  try {
    window.localStorage.setItem(CONSENT_KEY, v);
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: v }));
  } catch {}
}
