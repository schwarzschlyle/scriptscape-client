# Segments API Usage

## Queries

### Fetch all segments for a segment collection

```tsx
import { useSegments } from "./queries";

const { data, isLoading, error } = useSegments("collection-id");

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

return (
  <ul>
    {data?.data.map(segment => (
      <li key={segment.id}>{segment.text}</li>
    ))}
  </ul>
);
```

### Fetch a single segment

```tsx
import { useSegment } from "./queries";

const { data, isLoading } = useSegment("segment-id");
```

## Mutations

### Create a segment

```tsx
import { useCreateSegment } from "./mutations";

const createSegment = useCreateSegment("collection-id");

const handleCreate = () => {
  createSegment.mutate({
    segmentIndex: 0,
    text: "Segment text",
    metadata: { foo: "bar" }
  });
};
```

### Update a segment

```tsx
import { useUpdateSegment } from "./mutations";

const updateSegment = useUpdateSegment();

const handleUpdate = () => {
  updateSegment.mutate({
    id: "segment-id",
    data: { text: "Updated text" }
  });
};
```

### Delete a segment

```tsx
import { useDeleteSegment } from "./mutations";

const deleteSegment = useDeleteSegment();

const handleDelete = () => {
  deleteSegment.mutate("segment-id");
};
```

## Types

See `types.ts` for all request and response types.
