import { useMemo, type ReactNode } from "react";
import {
  AbilityProvider as CaslAbilityProvider,
  useAbility as useCaslAbility,
} from "@casl/react";
import {
  defineAbilityFor,
  type AbilityContributor,
  type AppAbility,
  type Principal,
} from "./ability";

// React side of the isomorphic ability. The provider builds the SAME ability
// from the SAME feature contributors as the server, so the UI hides what the
// API would reject. This only hides/disables UI — it is never a security
// boundary; the server enforces (see `authorize.ts`).

// `<Can I="update" a="Invoice">…</Can>` — renders children only when allowed.
// For per-record checks pass a tagged subject via the `this` prop.
export { Can } from "@casl/react";

// Read the current ability directly, e.g. `useAbility().can("create", "Invoice")`.
export function useAbility(): AppAbility {
  return useCaslAbility<AppAbility>();
}

// Wrap the app once. Pass a STABLE module-level `contributors` array so the
// ability is not rebuilt every render. `user` comes from the auth query hook
// (TanStack Query owns auth state); the ability recomputes when it changes.
export function AbilityProvider({
  user,
  contributors,
  children,
}: {
  user: Principal | null;
  contributors: readonly AbilityContributor[];
  children: ReactNode;
}) {
  const ability = useMemo(
    () => defineAbilityFor(user, contributors),
    [user, contributors],
  );
  return <CaslAbilityProvider value={ability}>{children}</CaslAbilityProvider>;
}
