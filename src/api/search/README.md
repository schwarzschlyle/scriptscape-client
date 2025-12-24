# Search API Usage

## Query

### Perform a search

```tsx
import { useSearch } from "./queries";

const { data, isLoading, error } = useSearch({
  q: "coffee shop",
  types: ["script", "segment"],
  page: 1,
  limit: 20
});

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

return (
  <ul>
    {data?.data.map(result => (
      <li key={result.id}>
        <strong>{result.type}</strong>: {result.title}
        <div dangerouslySetInnerHTML={{ __html: result.excerpt }} />
      </li>
    ))}
  </ul>
);
```

## Types

See `types.ts` for all request and response types.
