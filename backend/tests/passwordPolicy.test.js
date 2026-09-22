const assert = require("node:assert/strict");
const test = require("node:test");
const { isStrongPassword, PASSWORD_POLICY_MESSAGE } = require("../utils/passwordPolicy");

test("accepts passwords with the required length and character classes", () => {
  assert.equal(isStrongPassword("SecurePass1"), true);
  assert.equal(isStrongPassword("1aA-----"), true);
});

test("rejects passwords that do not meet the policy", () => {
  for (const password of ["", null, undefined, "Short1A", "alllowercase1", "ALLUPPERCASE1", "NoNumbersHere"]) {
    assert.equal(isStrongPassword(password), false);
  }
  assert.match(PASSWORD_POLICY_MESSAGE, /at least 8 characters/i);
});
