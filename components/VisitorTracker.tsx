"use client";
import { useEffect } from "react";
declare global { interface Window { __visitorEvent?: (type: string, data?: Record<string, unknown>, page?: string) => void; } }
export function trackVisitor(type: string, data?: Record<string, unknown>, page?: string) {
  if (typeof window !== "undefined") window.__visitorEvent?.(type, data, page);
}
export default function VisitorTracker() {
  useEffect(() => { trackVisitor("start_reading"); }, []);
  return null;
}
