import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import { LogLevel } from "@slack/web-api/dist/index.js";

dotenv.config({
  path: ".env.playwright",
});
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalTimeout: process.env.CI ? 900000 : 600000,
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
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 4 : 6,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    [
      "./node_modules/playwright-slack-report/dist/src/SlackReporter.js",
      {
        channels: ["health_check"], // provide one or more Slack channels
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
            value: `API tests`,
          },
          {
            key: "Tested user with PRO rights",
            value: process.env.EMAIL_PRO,
          },
          {
            key: `Note`,
            value:
              "📩 For reports, go to Workflow runs (below) -> Any workflow run -> Artifacts 🕵️",
          },
          {
            key: `Workflow runs 🦾`,
            value:
              "<https://github.com/konturio/front-facing-api-tests/actions/workflows/run-tests.yml|(see)>",
          },
        ],
        slackOAuthToken: process.env.SLACK_BOT_USER_OAUTH_TOKEN,
        slackLogLevel: LogLevel.DEBUG,
        disableUnfurl: true,
        showInThread: true,
      },
    ],
    ["html"], // other reporters
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    trace: "on-first-retry",
    actionTimeout: process.env.CI ? 15000 : 10000,
    navigationTimeout: process.env.CI ? 20000 : 10000,
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "setup",
      testMatch: "auth.setup.ts",
    },
    {
      name: "guest",
      use: { ...devices["Desktop Chrome"] },
      testMatch: ["ping.spec.ts", "upsAssets.spec.ts"],
    },
    {
      name: "pro_user",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testMatch: ["pingAsProUsr.spec.ts", "liveSensor.spec.ts"],
    },
  ],
});
