# Visual Sets API Usage

## Queries

### Fetch all visual sets for a segment collection

```tsx
import { useVisualSets } from "./queries";

const { data, isLoading, error } = useVisualSets("collection-id", { page: 1, limit: 20 });

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

return (
  <ul>
    {data?.data.map(visualSet => (
      <li key={visualSet.id}>{visualSet.name}</li>
    ))}
  </ul>
);
```

### Fetch a single visual set

```tsx
import { useVisualSet } from "./queries";

const { data, isLoading } = useVisualSet("visual-set-id");
```

## Mutations

### Create a visual set

```tsx
import { useCreateVisualSet } from "./mutations";

const createVisualSet = useCreateVisualSet("collection-id");

const handleCreate = () => {
  createVisualSet.mutate({
    name: "New Visual Set",
    description: "Description",
    metadata: { foo: "bar" }
  });
};
```

### Update a visual set

```tsx
import { useUpdateVisualSet } from "./mutations";

const updateVisualSet = useUpdateVisualSet();

const handleUpdate = () => {
  updateVisualSet.mutate({
    id: "visual-set-id",
    data: { name: "Updated Name" }
  });
};
```

### Delete a visual set

```tsx
import { useDeleteVisualSet } from "./mutations";

const deleteVisualSet = useDeleteVisualSet();

const handleDelete = () => {
  deleteVisualSet.mutate("visual-set-id");
};
```

## Types

See `types.ts` for all request and response types.
