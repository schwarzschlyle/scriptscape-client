# Users API Usage

## Queries

### Fetch all users

```tsx
import { useUsers } from "./queries";

const { data, isLoading, error } = useUsers({ page: 1, limit: 20 });

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

return (
  <ul>
    {data?.data.map(user => (
      <li key={user.id}>{user.email}</li>
    ))}
  </ul>
);
```

### Fetch a single user

```tsx
import { useUser } from "./queries";

const { data, isLoading } = useUser("user-id");
```

### Fetch the current user

```tsx
import { useCurrentUser } from "./queries";

const { data, isLoading } = useCurrentUser();
```

## Mutations

### Update a user

```tsx
import { useUpdateUser } from "./mutations";

const updateUser = useUpdateUser();

const handleUpdate = () => {
  updateUser.mutate({
    id: "user-id",
    data: { firstName: "New Name" }
  });
};
```

### Delete a user

```tsx
import { useDeleteUser } from "./mutations";

const deleteUser = useDeleteUser();

const handleDelete = () => {
  deleteUser.mutate("user-id");
};
```

## Types

See `types.ts` for all request and response types.
