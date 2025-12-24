# Scripts API Usage

## Queries

### Fetch all scripts for a project

```tsx
import { useScripts } from "./queries";

const { data, isLoading, error } = useScripts("project-id", { page: 1, limit: 20 });

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

return (
  <ul>
    {data?.data.map(script => (
      <li key={script.id}>{script.name}</li>
    ))}
  </ul>
);
```

### Fetch a single script

```tsx
import { useScript } from "./queries";

const { data, isLoading } = useScript("script-id");
```

## Mutations

### Create a script

```tsx
import { useCreateScript } from "./mutations";

const createScript = useCreateScript("project-id");

const handleCreate = () => {
  createScript.mutate({
    name: "New Script",
    text: "Script content...",
    metadata: { foo: "bar" }
  });
};
```

### Update a script

```tsx
import { useUpdateScript } from "./mutations";

const updateScript = useUpdateScript();

const handleUpdate = () => {
  updateScript.mutate({
    id: "script-id",
    data: { name: "Updated Name" }
  });
};
```

### Delete a script

```tsx
import { useDeleteScript } from "./mutations";

const deleteScript = useDeleteScript();

const handleDelete = () => {
  deleteScript.mutate("script-id");
};
```

## Types

See `types.ts` for all request and response types.
