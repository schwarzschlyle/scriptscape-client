# Auth API Usage

## Mutations

### Register

```tsx
import { useRegister } from "./mutations";

const register = useRegister();

const handleRegister = () => {
  register.mutate({
    email: "user@example.com",
    password: "SecurePass123!",
    firstName: "John",
    lastName: "Doe",
    organizationId: "org-id"
  });
};
```

### Login

```tsx
import { useLogin } from "./mutations";

const login = useLogin();

const handleLogin = () => {
  login.mutate({
    email: "user@example.com",
    password: "SecurePass123!"
  });
};
```

### Refresh Token

```tsx
import { useRefreshToken } from "./mutations";

const refreshToken = useRefreshToken();

const handleRefresh = () => {
  refreshToken.mutate({
    refreshToken: "your-refresh-token"
  });
};
```

### Logout

```tsx
import { useLogout } from "./mutations";

const logout = useLogout();

const handleLogout = () => {
  logout.mutate();
};
```

## Queries

### Fetch the current user

```tsx
import { useCurrentUser } from "./queries";

const { data, isLoading } = useCurrentUser();
```

## Types

See `types.ts` for all request and response types.
