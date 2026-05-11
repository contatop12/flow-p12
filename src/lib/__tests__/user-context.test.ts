import { describe, it, expect } from "vitest";
import { emailToUserId, emailToOrgId, emailToOrgName } from "../user-context";

describe("emailToUserId", () => {
  it("converts email to deterministic user ID", () => {
    expect(emailToUserId("alice@acme.com")).toBe("user_alice_acme_com");
  });
  it("lowercases the result", () => {
    expect(emailToUserId("ALICE@ACME.COM")).toBe("user_alice_acme_com");
  });
  it("replaces all non-alphanumeric chars with underscore", () => {
    expect(emailToUserId("a+b@c.d")).toBe("user_a_b_c_d");
  });
});

describe("emailToOrgId", () => {
  it("uses domain as org base", () => {
    expect(emailToOrgId("alice@acme.com")).toBe("org_acme_com");
  });
  it("handles missing domain gracefully", () => {
    expect(emailToOrgId("noatsign")).toBe("org_noatsign");
  });
});

describe("emailToOrgName", () => {
  it("returns domain as org name", () => {
    expect(emailToOrgName("alice@acme.com")).toBe("acme.com");
  });
  it("returns full email when no @ sign", () => {
    expect(emailToOrgName("noatsign")).toBe("noatsign");
  });
});
