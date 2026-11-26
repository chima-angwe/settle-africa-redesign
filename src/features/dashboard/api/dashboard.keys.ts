export const dashboardKeys = {
  all: ["dashboard"] as const,
  central: () => [...dashboardKeys.all, "central"] as const,
};
