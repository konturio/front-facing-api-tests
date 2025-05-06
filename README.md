# front-facing-api-tests

Autotests for front facing apis of Kontur products. Tests are written in TypeScript and use the Playwright framework. The tests run in the CI pipeline. Tests run in parallel to speed up the execution.

## Running api tests with Playwright

0. Ensure Node.js and npm are installed on your system.

```bash
node -v
npm -v
```

1. Install Playwright

```bash
npx playwright install
```

2. Set up the environment variables

Create a `.env.playwright.local` file in the root of the project with the following content:

```bash
EMAIL_PRO=<pro-test-email>
PASSWORD_PRO=<pro-test-password>
EMAIL_NO_RIGHTS=<no-rights-test-email>
PASSWORD_NO_RIGHTS=<no-rights-test-password>
ENVIRONMENT=<env>
SLACK_BOT_USER_OAUTH_TOKEN=token
COUNTRIES_TO_TEST=<countries-to-test-delimited-by-comma>
TYPE=all
```

- `<env>` is the environment where the tests will run. It can be `prod`, `test` or `dev`. Remember that 'dev' is not supported well by this tests.
- `<SLACK_BOT_USER_OAUTH_TOKEN>` is the Slack bot user OAuth token for the channel you want to send the test results to.
- `<pro-test-email>` and `<pro-test-password>` are the credentials for a user with PRO rights.
- `<no-rights-test-email>` and `<no-rights-test-password>` are the credentials for a user with no rights.
- `<countries-to-test-delimited-by-comma>` is a comma-delimited list of countries to test. It is used by worlwide tests.

3. Run the api tests

```bash
npx playwright test
```

Add the `--ui` flag to run the tests in debug mode, which opens Playwright's interactive UI for step-by-step execution and debugging:

```bash
npx playwright test --ui
```

## Running specific tests

To run a specific test, add the name of the test after the `test` command. For example, to run the `liveSensor.spec.ts` test, run:

```bash
npx playwright test liveSensor.spec.ts
```

To run a specific test group, add the `@<tag>` info. For example, to run the `guest` tests, run:

```bash
npx playwright test --grep @guest
```

## CI integration

The CI pipeline is configured using GitHub Actions to automate testing for the crucial APIs and to allow running tests without any set up. Below are the details of the workflows that run the Insights API tests, OAM tests, and all API tests.

1. Insights API tests workflow

- Sheduled to run every 30 minutes only in production. Tests in system level Geocint outputs on prod produced by Insights API.
- Runs tests that check countries business is interested in in a row, focusing on tests tagged with @fitsLoadTesting. Takes 5 countries for a run, then at the next run takes the next 5 countries and so on. So during a day tests run through all countries business is interested in.
- All the time uploads the tested countries list to the Gist to use it at the next workflow run. Sends a Slack message with the results.

2. OAM tests workflow

- Sheduled every 30 minutes OAM tests run only in production. Workflow executes OAM-specific tests defined in oam.spec.ts.
- Tests OAM endpoints and clusters to be sure that OAM mosaic layer works as expected and can be used by rescue teams.
- Sends a Slack message with the results. If tests fail, sends an email notification on failure to all stakeholders using Gmail SMTP, including links to the Slack channel and workflow runs for debugging.

3. All API tests workflow

- For manual trigger there are input options for environment (dev, test, prod), test type (all, oam, llm, insights, frequent), and countries to test by insights api tests. Runs in the environment you choose. By default on prod.
- Health checks on prod are scheduled daily at 9:30 AM for llm tests (UTC) and every 10 minutes for frequent tests.
- By frequent means all tests that can be safely run every 10 minutes (llm tests are costy, so run less often and not included).

All workflows can be triggered manually and use caching to optimize dependency installation. Test results are retained for 30 days to allow debugging and analysis. When choosing brunch name, it is about the name of the branch from what you want to run your tests from (not a version of application).

## Architecture
