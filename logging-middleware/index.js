const axios = require("axios");
const { getAccessToken } = require("./auth");
const { BASE_URL } = require("./config");

const VALID_STACKS = ["backend", "frontend"];
const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];
const BACKEND_PACKAGES = ["cache", "controller", "cron_job", "db", "domain", "handler", "repository", "route", "service"];
const FRONTEND_PACKAGES = ["api", "component", "hook", "page", "state"];
const SHARED_PACKAGES = ["auth", "config", "middleware", "utils", "style"];

function validateInputs(stack, level, pkg, message) {
  if (!VALID_STACKS.includes(stack)) {
    throw new Error(`Invalid stack: ${stack}. Must be one of ${VALID_STACKS.join(", ")}`);
  }
  if (!VALID_LEVELS.includes(level)) {
    throw new Error(`Invalid level: ${level}. Must be one of ${VALID_LEVELS.join(", ")}`);
  }

  const allowedPackages = stack === "backend"
    ? [...BACKEND_PACKAGES, ...SHARED_PACKAGES]
    : [...FRONTEND_PACKAGES, ...SHARED_PACKAGES];

  if (!allowedPackages.includes(pkg)) {
    throw new Error(`Invalid package: ${pkg} for stack: ${stack}`);
  }

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    throw new Error("Log message must be a non-empty string");
  }
}

async function Log(stack, level, pkg, message) {
  try {
    validateInputs(stack, level, pkg, message);

    const token = await getAccessToken();

    const response = await axios.post(
      `${BASE_URL}/logs`,
      { stack, level, package: pkg, message },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message;
    process.stderr.write(`[logging-middleware] Failed to send log: ${errorMessage}\n`);
    return null;
  }
}

module.exports = { Log };
