import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import { LogLevel } from "@slack/web-api/dist/index.js";
import path from "path";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */

dotenv.config({
  path: [
    ".env.playwright.local",
    ".env.playwright.production",
    ".env.playwright",
  ],
});

const globalSetup = path.resolve("./tests/global-setup.ts");
const globalTeardown = path.resolve("./tests/global-teardown.ts");

// import dotenv from 'dotenv';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup,
  globalTeardown,
  globalTimeout: 3600000,
  timeout: process.env.CI ? 180000 : 130000,
  expect: {
    timeout: process.env.CI ? 10000 : 7000,
  },
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 4 : 5,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    [
      "./node_modules/playwright-slack-report/dist/src/SlackReporter.js",
      {
        channels: [
          process.env.TEST_OAM
            ? "oam-monitoring"
            : process.env.IS_TESTING_BUSINESS_COUNTRIES_IN_A_ROW_AT_INSIGHTS_API
              ? "insights-api-autotests"
              : "api_health_check",
        ], // provide one or more Slack channels
        sendResults: "always", // "always" , "on-failure", "off"
        maxNumberOfFailuresToShow: 100,
        meta: [
          {
            key: `Tests launched 🎬`,
            value: `${process.env.CI ? "Github Actions 🐌" : "Locally"}`,
          },
          {
            key: `Environment 👷🏻‍♂️`,
            value: `${process.env.ENVIRONMENT?.toUpperCase()}`,
          },
          {
            key: `Type ⚙️`,
            value: `${process.env.TEST_OAM ? "OAM" : process.env.TYPE?.toUpperCase() || "API"} tests`,
          },
          {
            key: `Tested user with PRO rights 👤`,
            value: `${process.env.EMAIL_PRO === "test_email" || process.env.TEST_OAM ? "Not relevant" : process.env.EMAIL_PRO}`,
          },
          {
            key: `Tested countries 🗺️`,
            value: `${process.env.COUNTRIES_TO_TEST === "" ? "Random" : process.env.COUNTRIES_TO_TEST || "Not relevant"}`,
          },
          {
            key: `Note`,
            value:
              "📩 For reports, go to Workflow runs (below) -> Any workflow run -> Artifacts 🕵️",
          },
          {
            key: `Workflow runs 🦾`,
            value: `${process.env.TEST_OAM ? "<https://github.com/konturio/front-facing-api-tests/actions/workflows/oam-tests.yml|(see)>" : "<https://github.com/konturio/front-facing-api-tests/actions/workflows/run-tests.yml|(see)>"}`,
          },
        ],
        slackOAuthToken: process.env.SLACK_BOT_USER_OAUTH_TOKEN,
        slackLogLevel: LogLevel.DEBUG,
        disableUnfurl: true,
        showInThread: true,
      },
    ],
    ["html", { open: "always" }], // other reporters
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    trace: "on-first-retry",
    actionTimeout: process.env.CI ? 15000 : 10000,
    navigationTimeout: process.env.CI ? 20000 : 10000,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "setup",
      testMatch: "auth.setup.ts",
    },
    {
      name: "auth_required_api_tests_no_llm",
      dependencies: ["setup"],
      testDir: "./tests/auth-required-api-tests",
      testIgnore: "llmAnalytics.spec.ts",
    },
    {
      name: "llm_analytics",
      dependencies: ["setup"],
      testMatch: "llmAnalytics.spec.ts",
    },
    {
      name: "api_tests_no_auth",
      testDir: "./tests/general-api-tests",
    },
    {
      name: "oam_tests",
      testMatch: "oam.spec.ts",
    },
    {
      name: "insights_api_tests",
      testDir: "./tests/insights-api-tests",
    },
  ],
});
