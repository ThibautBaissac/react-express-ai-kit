import { describe, expect, it } from "vitest";
import { defineAbilityFor, subject, type AbilityContributor } from "./ability";

// A sample feature contributor. Real ones live in their slice as
// `<feature>.ability.ts` and import nothing environment-specific.
const articleRules: AbilityContributor = (can, _cannot, user) => {
  can("read", "Article");
  if (!user) return;
  can("create", "Article");
  can("update", "Article", { authorId: user.id });
  if (user.roles?.includes("admin")) can("manage", "all");
};

describe("defineAbilityFor", () => {
  it("grants anonymous read-only access", () => {
    const ability = defineAbilityFor(null, [articleRules]);
    expect(ability.can("read", "Article")).toBe(true);
    expect(ability.can("create", "Article")).toBe(false);
  });

  it("lets an owner update only their own record", () => {
    const ability = defineAbilityFor({ id: "u1" }, [articleRules]);
    expect(ability.can("update", subject("Article", { authorId: "u1" }))).toBe(
      true,
    );
    expect(ability.can("update", subject("Article", { authorId: "u2" }))).toBe(
      false,
    );
  });

  it("lets an admin manage everything", () => {
    const ability = defineAbilityFor({ id: "u1", roles: ["admin"] }, [
      articleRules,
    ]);
    expect(ability.can("delete", "Article")).toBe(true);
  });
});
