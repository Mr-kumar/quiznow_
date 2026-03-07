export const userKeys = {
  all: () => ["users"] as const,
  lists: () => [...userKeys.all(), "list"] as const,
  list: (params: object) => [...userKeys.lists(), params] as const,
  detail: (id: string) => [...userKeys.all(), "detail", id] as const,
};

export const questionKeys = {
  all: () => ["questions"] as const,
  lists: () => [...questionKeys.all(), "list"] as const,
  list: (params: object) => [...questionKeys.lists(), params] as const,
  detail: (id: string) => [...questionKeys.all(), "detail", id] as const,
  cursor: (params: object) =>
    [...questionKeys.all(), "cursor", params] as const,
};

export const testKeys = {
  all: () => ["tests"] as const,
  lists: () => [...testKeys.all(), "list"] as const,
  list: (params: object) => [...testKeys.lists(), params] as const,
  detail: (id: string) => [...testKeys.all(), "detail", id] as const,
};

export const analyticsKeys = {
  all: () => ["analytics"] as const,
  metrics: () => [...analyticsKeys.all(), "metrics"] as const,
  users: () => [...analyticsKeys.all(), "users"] as const,
  tests: () => [...analyticsKeys.all(), "tests"] as const,
  attempts: () => [...analyticsKeys.all(), "attempts"] as const,
};

export const auditLogKeys = {
  all: () => ["audit-logs"] as const,
  lists: () => [...auditLogKeys.all(), "list"] as const,
  list: (params: object) => [...auditLogKeys.lists(), params] as const,
};

export const settingsKeys = {
  all: () => ["settings"] as const,
};

export const subjectKeys = {
  all: () => ["subjects"] as const,
  lists: () => [...subjectKeys.all(), "list"] as const,
  list: (params: object) => [...subjectKeys.lists(), params] as const,
  detail: (id: string) => [...subjectKeys.all(), "detail", id] as const,
  topics: (subjectId: string) =>
    [...subjectKeys.all(), subjectId, "topics"] as const,
};

export const planKeys = {
  all: () => ["plans"] as const,
  lists: () => [...planKeys.all(), "list"] as const,
  list: (params: object) => [...planKeys.lists(), params] as const,
  detail: (id: string) => [...planKeys.all(), "detail", id] as const,
};

export const subscriptionKeys = {
  all: () => ["subscriptions"] as const,
  lists: () => [...subscriptionKeys.all(), "list"] as const,
  list: (params: object) => [...subscriptionKeys.lists(), params] as const,
  detail: (id: string) => [...subscriptionKeys.all(), "detail", id] as const,
};
