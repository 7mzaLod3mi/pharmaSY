const DEVICE_ID_KEY = "pharmasy.device-id";

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "pharmasy-web";

  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = `web-${crypto.randomUUID()}`;
  window.localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}
