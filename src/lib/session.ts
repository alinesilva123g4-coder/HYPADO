const KEY = "hypado:sid:v1";

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let sid = localStorage.getItem(KEY);
    if (!sid) {
      sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem(KEY, sid);
    }
    return sid;
  } catch {
    return "anon";
  }
}
