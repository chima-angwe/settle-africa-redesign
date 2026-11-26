export const localesKeys = {
  all: ["locales"] as const,
  list: () => [...localesKeys.all, "list"] as const,
} as const;
