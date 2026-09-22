const PASSWORD_POLICY_MESSAGE = "Password must be at least 8 characters and include an uppercase letter, lowercase letter, and number.";

const isStrongPassword = (value) => {
  const password = String(value || "");
  return password.length >= 8
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /[0-9]/.test(password);
};

module.exports = { isStrongPassword, PASSWORD_POLICY_MESSAGE };
