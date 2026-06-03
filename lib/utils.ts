import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";

export function generateConsentId(hospitalName: string): string {
  const prefix = hospitalName
    .trim()
    .split(/\s+/)
    .map((w) => (w[0] ?? "X").toUpperCase())
    .join("")
    .slice(0, 4)
    .padEnd(4, "X");
  const dateStr = format(new Date(), "yyyyMMdd");
  const short = uuidv4().split("-")[0].toUpperCase();
  return `${prefix}-${dateStr}-${short}`;
}

export function nowIST(): string {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}