# API Integration Guide

This application uses **Axios** (`src/shared/api/client.ts`) for HTTP communication and **TanStack Query** (`src/app/providers/QueryProvider.tsx`) for server-state caching and mutations.

## Architecture Overview

| Layer | Location | Responsibility |
| --- | --- | --- |
| Environment | `src/shared/config/env.ts` | Reads and validates `SETTLE_AFRICA_BASE_URL` and `SETTLE_AFRICA_API_TIMEOUT_MS` from `import.meta.env`. |
| HTTP Client | `src/shared/api/client.ts` | Single Axios instance configured with `withCredentials: true` (cookie auth), JSON headers, timeout, and centralized `401` handling. |
| Error Normalization | `src/shared/api/errors.ts` | Maps network, timeout, `401`, validation (`422`), `5xx`, and malformed responses into `ApiError`. |
| Endpoints | `src/shared/api/endpoints/*.ts` | Resource-grouped URL paths and safe `encodeURIComponent` path builders (no `/api/v1` prefix, no HTTP calls). |
| Query Client | `src/shared/api/query-client.ts` | Shared `QueryClient` defaults (`staleTime`, `gcTime`, retry rules skipping `4xx`). |
| Feature API & Hooks | `src/features/<feature>/api/` & `hooks/` | Request/response DTO types, mappers, service functions, query key factories, and `useQuery` / `useMutation` hooks. |

## Environment Setup

1. Copy `.env.example` to `.env` (already created locally, ignored by git).
2. Set `SETTLE_AFRICA_BASE_URL` to your backend origin without a trailing slash or `/api/v1` prefix:
   ```env
   SETTLE_AFRICA_BASE_URL=https://api.example.com
   ```
3. Never place secrets or private keys in `.env`—variables prefixed with `SETTLE_AFRICA_` or `VITE_` are exposed to the client bundle via `vite.config.ts`.

## Adding a New Feature Endpoint (Step by Step)

Use `src/features/manage-recipients/` as the reference implementation:

1. **Add endpoint paths** in `src/shared/api/endpoints/<resource>.ts` and export them from `src/shared/api/endpoints/index.ts`.
   - Keep paths relative to `SETTLE_AFRICA_BASE_URL` (e.g. `"/transfers"`).
   - Wrap dynamic path segments with `encodeURIComponent`.
2. **Define DTO & request types** in `src/features/<feature>/api/<resource>.types.ts`.
   - Keep raw backend DTOs (`*Dto`), request payloads (`*Request`), and filter types separate from UI domain types.
3. **Add mappers** in `src/features/<feature>/api/<resource>.mapper.ts`.
   - Transform raw DTOs into UI/domain types and validate unexpected shapes by throwing `ApiError` (`code: "INVALID_RESPONSE"`).
4. **Create the service** in `src/features/<feature>/api/<resource>.service.ts`.
   - Call `apiClient` using the centralized endpoints, forward `AbortSignal`, and pass responses through mappers.
   - Do not import React, UI components, or browser storage here.
5. **Define query keys** in `src/features/<feature>/api/<resource>.keys.ts`.
   - Follow the hierarchical pattern: `all` -> `lists()` / `list(filters)` -> `details()` / `detail(id)`.
6. **Expose TanStack Query hooks** in `src/features/<feature>/hooks/`.
   - Use `useQuery` with `placeholderData: keepPreviousData` for paginated/filtered lists, and `enabled` for dependent queries.
   - Use `useMutation` and invalidate or update related query keys in `onSuccess`.
   - Handle loading, empty, and error states (`getErrorMessage(error)`) in UI components without falling back to fake/mock data.

## Auth & 401 Handling

- `apiClient` sends `withCredentials: true` so browser auth cookies are attached automatically.
- `App.tsx` registers a single `401` handler via `registerUnauthorizedHandler` to clear the query cache and return the user to the sign-in screen without redirect loops.
- For public or login requests where a `401` represents invalid credentials rather than an expired session, pass `{ skipUnauthorizedHandler: true }` in the Axios request config.
