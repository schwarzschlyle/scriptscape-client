export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  CANVAS: '/canvas/:organizationId/:projectId',
  TEST: '/test',
} as const;

export const buildRoute = {
  canvas: (organizationId: string, projectId: string) =>
    `/canvas/${organizationId}/${projectId}`,
};
