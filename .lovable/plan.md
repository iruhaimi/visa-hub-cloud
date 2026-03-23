

# Plan: Fix All Issues from Claude.ai Production Review

This plan addresses every issue from the report, prioritized by severity.

---

## Phase 1: Critical Security Fixes (Database)

### 1.1 Fix `wallet_transactions` self-insert policy
The current INSERT policy allows any authenticated user to add wallet transactions if they're admin. **Reviewing the current RLS**: the policy already says `is_admin(auth.uid())` — this was already fixed. No action needed.

### 1.2 Fix `notifications` INSERT policy
Current policy allows agents and admins plus self-notifications. The `WITH CHECK (true)` policy mentioned in the report does NOT exist in our current schema — the current policy properly checks auth. **No action needed.**

### 1.3 Fix `application_status_history` INSERT policy
Current policy: `WITH CHECK (can_access_application(application_id, auth.uid()))` — this allows customers who own the app to insert fake status records. **This needs fixing.** Will create a migration to drop the current INSERT policy and replace it with one restricted to admins and agents only.

### 1.4 Fix `profiles.wallet_balance` self-update
Users can currently update their own profile, which includes `wallet_balance`. Will create a database trigger that prevents client-side updates to `wallet_balance` (only `service_role` allowed).

---

## Phase 2: High Priority Fixes (Code)

### 2.1 Clear password from React state after 2FA (`SecureStaffAuth.tsx`)
After successful 2FA verification and re-authentication, immediately clear the password state variable.

### 2.2 Add `.env` to `.gitignore`
Add `.env`, `.env.local`, `.env.*.local`, `.env.production` entries.

---

## Phase 3: Medium Priority Fixes (Code)

### 3.1 Move Google Fonts from CSS `@import` to `index.html` `<link>` tags
Add `<link rel="preconnect">` and `<link rel="stylesheet">` in `index.html`, remove the `@import` from `index.css`.

### 3.2 Add lazy loading / code splitting (`App.tsx`)
Wrap all page imports with `React.lazy()` and add `<Suspense>` fallback around `<Routes>`.

### 3.3 Restore `useAuth()` throw behavior
Change the fallback in `useAuth()` back to `throw new Error(...)` so bugs are caught early.

### 3.4 Add `MyApplicationDetail` redirect when `?id` is missing
If no `id` query param, redirect to `/my-applications`.

---

## Phase 4: Low Priority Cleanup (Code)

### 4.1 Delete dead files
Remove `src/pages/Home.tsx` and `src/pages/Index.tsx` (unused, never routed).

### 4.2 Add global React ErrorBoundary
Wrap `<App>` in an ErrorBoundary component in `main.tsx`.

### 4.3 Configure QueryClient with retry/stale settings
Add sensible defaults: `retry: 1`, `staleTime: 5 * 60 * 1000`.

---

## Technical Details

### Database Migrations Required
1. **Replace `application_status_history` INSERT policy** — restrict to `is_admin(auth.uid()) OR is_agent(auth.uid())`
2. **Add `wallet_balance` protection trigger** — `BEFORE UPDATE` on `profiles` that raises exception if `wallet_balance` changes and caller is not `service_role`

### Files to Modify
- `index.html` — font preconnect/stylesheet links
- `src/index.css` — remove `@import` line
- `src/main.tsx` — add ErrorBoundary wrapper
- `src/App.tsx` — lazy imports + Suspense
- `src/contexts/AuthContext.tsx` — restore throw in `useAuth()`
- `src/pages/SecureStaffAuth.tsx` — clear password after 2FA
- `src/pages/MyApplicationDetail.tsx` — redirect when no `?id`
- `.gitignore` — add `.env` entries

### Files to Delete
- `src/pages/Home.tsx`
- `src/pages/Index.tsx`

### Notes on Items NOT Being Changed
- **CSP headers**: Cannot be set from Vite config alone; requires hosting/CDN configuration (Lovable handles this at the platform level)
- **Staff portal URL**: Acceptable as-is since RLS + 2FA provide real security
- **Security views not queried**: Informational; switching queries to views is a larger refactor with no immediate security impact
- **RTL `space-x-*` overrides**: Working correctly for the Arabic-first app; changing would risk regressions
- **UUID overflow on mobile**: Minor UI polish, can be addressed separately
- **Anon key rotation**: The anon key is a **publishable** key by design — it's safe to be public. No rotation needed.

