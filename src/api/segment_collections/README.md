# Segment Collections API Usage

## Queries

### Fetch all segment collections for a script

```tsx
import { useSegmentCollections } from "./queries";

const { data, isLoading, error } = useSegmentCollections("script-id", { page: 1, limit: 20 });

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

return (
  <ul>
    {data?.data.map(collection => (
      <li key={collection.id}>{collection.name}</li>
    ))}
  </ul>
);
```

### Fetch a single segment collection

```tsx
import { useSegmentCollection } from "./queries";

const { data, isLoading } = useSegmentCollection("collection-id");
```

## Mutations

### Create a segment collection

```tsx
import { useCreateSegmentCollection } from "./mutations";

const createCollection = useCreateSegmentCollection("script-id");

const handleCreate = () => {
  createCollection.mutate({
    name: "New Collection",
    metadata: { foo: "bar" }
  });
};
```

### Update a segment collection

```tsx
import { useUpdateSegmentCollection } from "./mutations";

const updateCollection = useUpdateSegmentCollection();

const handleUpdate = () => {
  updateCollection.mutate({
    id: "collection-id",
    data: { name: "Updated Name" }
  });
};
```

### Delete a segment collection

```tsx
import { useDeleteSegmentCollection } from "./mutations";

const deleteCollection = useDeleteSegmentCollection();

const handleDelete = () => {
  deleteCollection.mutate("collection-id");
};
```

## Types

See `types.ts` for all request and response types.
