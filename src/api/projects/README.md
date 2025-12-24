# Projects API Usage

## Queries

### Fetch all projects for an organization

```tsx
import { useProjects } from "./queries";

const { data, isLoading, error } = useProjects("organization-id", { page: 1, limit: 20 });

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

return (
  <ul>
    {data?.data.map(project => (
      <li key={project.id}>{project.name}</li>
    ))}
  </ul>
);
```

### Fetch a single project

```tsx
import { useProject } from "./queries";

const { data, isLoading } = useProject("project-id");
```

## Mutations

### Create a project

```tsx
import { useCreateProject } from "./mutations";

const createProject = useCreateProject("organization-id");

const handleCreate = () => {
  createProject.mutate({
    name: "New Project",
    description: "Description",
    metadata: { foo: "bar" }
  });
};
```

### Update a project

```tsx
import { useUpdateProject } from "./mutations";

const updateProject = useUpdateProject();

const handleUpdate = () => {
  updateProject.mutate({
    id: "project-id",
    data: { name: "Updated Name" }
  });
};
```

### Delete a project

```tsx
import { useDeleteProject } from "./mutations";

const deleteProject = useDeleteProject();

const handleDelete = () => {
  deleteProject.mutate("project-id");
};
```

## Types

See `types.ts` for all request and response types.
