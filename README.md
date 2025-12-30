# ScriptScape Client

A modular, scalable React + TypeScript frontend for the ScriptScape platform. Built with Vite, MUI, TanStack React Query, and a feature-oriented architecture.

---

## Table of Contents

- [Project Structure & Design Pattern](#project-structure--design-pattern)
- [API Hooks & Data Fetching](#api-hooks--data-fetching)
- [Adding Features, Pages, and Components](#adding-features-pages-and-components)
- [Installation & Local Development](#installation--local-development)
- [Best Practices](#best-practices)

---

## Project Structure & Design Pattern

The codebase follows a **feature-folder** and **modular API** pattern for maintainability and scalability.

```
src/
  api/           # API client, hooks, queries, mutations, types (per resource)
  assets/        # Static assets (SVGs, images)
  components/    # Shared UI components (buttons, cards, spinners, etc.)
  hooks/         # Custom React hooks (business logic, state, etc.)
  pages/         # Top-level pages (each as a folder with page.tsx and subcomponents)
  routes/        # Route definitions (React Router)
  App.tsx        # App entry point
  main.tsx       # Vite/React bootstrap
  theme.ts       # MUI theme customization
```

- **Pages**: Each page (e.g., `CanvasPage`, `LoginPage`) is a directory with a `page.tsx` entry and a `components/` subfolder for page-specific components, organized by [atomic design](#atomic-design-in-pages).
- **Components**: Shared UI components live in `src/components` and are used across pages.
- **API**: All API logic is in `src/api`, organized by resource (e.g., `projects`, `scripts`, `users`). Each resource exposes TanStack Query hooks for CRUD operations.

---

## API Hooks & Data Fetching

All data fetching and mutations use [TanStack React Query](https://tanstack.com/query/latest) hooks, auto-generated and exported from `src/api`.

**Example usage:**

```tsx
import { useProjects, useCreateProject } from "src/api";

const { data: projects, isLoading } = useProjects({ organizationId });
const createProject = useCreateProject();

function handleCreate(name: string) {
  createProject.mutate({ name });
}
```

**Available hooks** (per resource):

- `useProjects`, `useProject`, `useCreateProject`, `useUpdateProject`, `useDeleteProject`
- `useScripts`, `useScript`, `useCreateScript`, etc.
- `useUsers`, `useUser`, `useCurrentUser`, etc.
- `useLogin`, `useRegister`, `useLogout`, etc.
- ...and more for segment collections, segments, visual sets, visuals, and search.

See [src/api/README.md](src/api/README.md) for a full list.

---

## Adding Features, Pages, and Components

### Atomic Design in Pages

Each page's `components/` directory follows the [atomic design methodology](https://bradfrost.com/blog/post/atomic-web-design/):

- **atoms/**: Smallest UI elements (e.g., buttons, labels, icons)
- **molecules/**: Combinations of atoms (e.g., input with label, card header)
- **organisms/**: Complex assemblies of molecules and atoms (e.g., forms, modals, card lists)

**Example:**
```
src/pages/CanvasPage/
  page.tsx
  components/
    atoms/
      CanvasTitle.tsx
      ProjectName.tsx
      LogoutButton.tsx
      ...
    molecules/
      CanvasHeader.tsx
      ScriptCard.tsx
      ZoomControls.tsx
      ...
    organisms/
      (optional, for complex assemblies)
```

When adding a new page, use this structure for your components.

### Adding a New Page

1. **Create a folder** in `src/pages/`, e.g., `MyNewPage/`.
2. **Add `page.tsx`** as the main component for the page.
3. **Add a `components/` subfolder** with `atoms/`, `molecules/`, and (optionally) `organisms/` as needed.
4. **Register the route** in `src/routes/` (see existing routes for examples).

**Example:**
```
src/pages/MyNewPage/
  page.tsx
  components/
    atoms/
      MyButton.tsx
    molecules/
      MyForm.tsx
    organisms/
      MyDashboard.tsx
```

### Adding a Page-Specific Component

- Place new UI elements in the appropriate subfolder (`atoms/`, `molecules/`, or `organisms/`) under the page's `components/` directory.

### Adding a Shared Component

- Add a new `.tsx` file in `src/components/`, e.g., `CustomAlert.tsx`.
- Import and use it in any page or component.

### Adding a New API Resource

1. **Create a folder** in `src/api/`, e.g., `widgets/`.
2. **Add `queries.ts`, `mutations.ts`, and `types.ts`** for the resource.
3. **Export hooks** from `src/api/index.ts` for easy import.

---

## Installation & Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)

### Setup

1. **Clone the repository** and navigate to `scriptscape-client`:

   ```bash
   git clone <repo-url>
   cd scriptscape-client
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**:

   - Copy `.env.example` to `.env` and set the API URL if needed:

     ```
     cp .env.example .env
     ```

   - Edit `.env` if your API is not at `http://localhost:3000/v1`.

4. **Start the development server**:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The app will be available at [http://localhost:5173](http://localhost:5173) by default.

---

## Best Practices

- **Use API hooks** from `src/api` for all data fetching and mutations.
- **Organize new features** as page folders with their own components.
- **Reuse shared UI components** from `src/components` to ensure consistency.
- **Write custom hooks** in `src/hooks` for business logic/state that doesn't belong in a component.
- **Follow TypeScript best practices** for type safety.
- **Use MUI** for UI consistency and theming.

---

## License

MIT
