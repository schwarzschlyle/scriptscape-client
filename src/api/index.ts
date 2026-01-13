// scriptscape-client/src/api/index.ts

// Barrel exports for all queries and mutations

// Organizations
export * from "./organizations/queries";
export * from "./organizations/mutations";

// Projects
export * from "./projects/queries";
export * from "./projects/mutations";

// Users
export * from "./users/queries";
export * from "./users/mutations";

// Auth
export * from "./auth/queries";
export * from "./auth/mutations";

// Scripts
export * from "./scripts/queries";
export * from "./scripts/mutations";

// Segment Collections
export * from "./segment_collections/queries";
export * from "./segment_collections/mutations";

// Segments
export * from "./segments/queries";
export * from "./segments/mutations";

// Visual Sets
export * from "./visual_sets/queries";
export * from "./visual_sets/mutations";

export * from "./card_positions/queries";
export * from "./card_positions/mutations";

// Visuals
export * from "./visuals/queries";
export * from "./visuals/mutations";

// Search
export * from "./search/queries";

// Query Client
export { default as queryClient } from "./queryClient";

// API Client
export { default as api } from "./client";
