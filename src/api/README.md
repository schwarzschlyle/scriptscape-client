# ScriptScape API Client: Queries & Mutations Summary

This directory provides TanStack Query hooks for all ScriptScape API endpoints, organized by resource. All hooks are available as named exports from `src/api`.

---

## Organizations

- `useOrganizations` — List organizations
- `useOrganization` — Get organization by ID
- `useCreateOrganization` — Create organization
- `useUpdateOrganization` — Update organization
- `useDeleteOrganization` — Delete organization

## Projects

- `useProjects` — List projects for an organization
- `useProject` — Get project by ID
- `useCreateProject` — Create project
- `useUpdateProject` — Update project
- `useDeleteProject` — Delete project

## Users

- `useUsers` — List users
- `useUser` — Get user by ID
- `useCurrentUser` — Get current user
- `useUpdateUser` — Update user
- `useDeleteUser` — Delete user

## Auth

- `useRegister` — Register new user
- `useLogin` — Login
- `useRefreshToken` — Refresh JWT
- `useLogout` — Logout

## Scripts

- `useScripts` — List scripts for a project
- `useScript` — Get script by ID
- `useCreateScript` — Create script
- `useUpdateScript` — Update script
- `useDeleteScript` — Delete script

## Segment Collections

- `useSegmentCollections` — List segment collections for a script
- `useSegmentCollection` — Get segment collection by ID
- `useCreateSegmentCollection` — Create segment collection
- `useUpdateSegmentCollection` — Update segment collection
- `useDeleteSegmentCollection` — Delete segment collection

## Segments

- `useSegments` — List segments for a collection
- `useSegment` — Get segment by ID
- `useCreateSegment` — Create segment
- `useUpdateSegment` — Update segment
- `useDeleteSegment` — Delete segment

## Visual Sets

- `useVisualSets` — List visual sets for a segment collection
- `useVisualSet` — Get visual set by ID
- `useCreateVisualSet` — Create visual set
- `useUpdateVisualSet` — Update visual set
- `useDeleteVisualSet` — Delete visual set

## Visuals

- `useVisuals` — List visuals for a visual set
- `useVisual` — Get visual by ID
- `useCreateVisual` — Create visual
- `useUpdateVisual` — Update visual
- `useDeleteVisual` — Delete visual

## Search

- `useSearch` — Search across all resources

---

**Usage:**  
Import any hook directly from `src/api`:

```tsx
import { useProjects, useCreateProject, useSearch } from "src/api";
```

See each resource's README for detailed usage and type information.
