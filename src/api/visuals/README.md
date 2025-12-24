# Visuals API Usage

## Queries

### Fetch all visuals for a visual set

```tsx
import { useVisuals } from "./queries";

const { data, isLoading, error } = useVisuals("visual-set-id");

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

return (
  <ul>
    {data?.data.map(visual => (
      <li key={visual.id}>{visual.content}</li>
    ))}
  </ul>
);
```

### Fetch a single visual

```tsx
import { useVisual } from "./queries";

const { data, isLoading } = useVisual("visual-id");
```

## Mutations

### Create a visual

```tsx
import { useCreateVisual } from "./mutations";

const createVisual = useCreateVisual("visual-set-id");

const handleCreate = () => {
  createVisual.mutate({
    segmentId: "segment-id",
    content: "Production guidance text",
    metadata: { foo: "bar" }
  });
};
```

### Update a visual

```tsx
import { useUpdateVisual } from "./mutations";

const updateVisual = useUpdateVisual();

const handleUpdate = () => {
  updateVisual.mutate({
    id: "visual-id",
    data: { content: "Updated content" }
  });
};
```

### Delete a visual

```tsx
import { useDeleteVisual } from "./mutations";

const deleteVisual = useDeleteVisual();

const handleDelete = () => {
  deleteVisual.mutate("visual-id");
};
```

## Types

See `types.ts` for all request and response types.
