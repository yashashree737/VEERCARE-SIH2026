import { AuthUser } from "./types";

export interface NavRoute {
  href: string;
  label: string;
}

export function landingRoute(user: AuthUser | null): string {
  if (!user) return "/";
  if (user.role === "commander") {
    return `/dashboard?unit=${user.unit_id || "U012"}`;
  }
  if (user.role === "personnel") {
    return `/personnel/${user.personnel_id || "P0013"}`;
  }
  if (user.role === "welfare" || user.role === "system") {
    return "/dashboard?scope=flagged";
  }
  return "/dashboard";
}

export function routesForRole(user: AuthUser | null): NavRoute[] {
  if (!user) return [];

  if (user.role === "admin") {
    return [
      { href: "/dashboard", label: "Master Operations Dashboard" },
      { href: "/interventions", label: "Interventions Registry" },
      { href: `/personnel/${user.personnel_id || "P0013"}`, label: "Sample Record (P0013)" },
    ];
  }

  if (user.role === "commander") {
    const unitParam = user.unit_id ? `?unit=${user.unit_id}` : "";
    return [
      { href: `/dashboard${unitParam}`, label: `Unit ${user.unit_id || ""} Dashboard` },
      { href: "/interventions", label: "Unit Welfare Actions" },
    ];
  }

  if (user.role === "welfare" || user.role === "system") {
    return [
      { href: "/dashboard?scope=flagged", label: "Triage Watchlist" },
      { href: "/interventions", label: "Interventions Registry" },
    ];
  }

  if (user.role === "personnel") {
    const pId = user.personnel_id || "P0013";
    return [
      { href: `/personnel/${pId}`, label: "My Wellness Space" },
    ];
  }

  return [{ href: "/dashboard", label: "Dashboard" }];
}
