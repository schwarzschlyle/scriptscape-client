export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  PROJECTS: '/projects/:organizationId',
  CANVAS: '/projects/:organizationId/canvas/:projectId',
  TEST: '/test',
} as const;

export const buildRoute = {
  projects: (organizationId: string) => `/projects/${organizationId}`,
  canvas: (organizationId: string, projectId: string) =>
    `/projects/${organizationId}/canvas/${projectId}`,
};
