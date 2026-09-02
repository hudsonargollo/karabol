export const Role = {
  PATRON: 'PATRON',
  VENUE_STAFF: 'VENUE_STAFF',
  VENUE_ADMIN: 'VENUE_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

// Route a freshly authenticated user to the right frontend based on RBAC.
export const ROLE_HOME_ROUTE: Record<Role, string> = {
  PATRON: '/app',
  VENUE_STAFF: '/venue',
  VENUE_ADMIN: '/venue',
  SUPER_ADMIN: '/admin',
};
