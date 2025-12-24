# Organizations API Usage

## Queries

### Fetch all organizations

```tsx
import { useOrganizations } from "./queries";

const { data, isLoading, error } = useOrganizations({ page: 1, limit: 20 });

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

return (
  <ul>
    {data?.data.map(org => (
      <li key={org.id}>{org.name}</li>
    ))}
  </ul>
);
```

### Fetch a single organization

```tsx
import { useOrganization } from "./queries";

const { data, isLoading } = useOrganization("organization-id");
```

## Mutations

### Create an organization

```tsx
import { useCreateOrganization } from "./mutations";

const createOrg = useCreateOrganization();

const handleCreate = () => {
  createOrg.mutate({
    name: "New Org",
    description: "Description",
    metadata: { foo: "bar" }
  });
};
```

### Update an organization

```tsx
import { useUpdateOrganization } from "./mutations";

const updateOrg = useUpdateOrganization();

const handleUpdate = () => {
  updateOrg.mutate({
    id: "organization-id",
    data: { name: "Updated Name" }
  });
};
```

### Delete an organization

```tsx
import { useDeleteOrganization } from "./mutations";

const deleteOrg = useDeleteOrganization();

const handleDelete = () => {
  deleteOrg.mutate("organization-id");
};
```

## Types

See `types.ts` for all request and response types.
