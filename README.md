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
ENVIRONMENT=<env>
SLACK_BOT_USER_OAUTH_TOKEN=token
```

- <env> is the environment where the tests will run. It can be `prod`, `test`, or `dev`.
- <SLACK_BOT_USER_OAUTH_TOKEN> is the Slack bot user OAuth token for the channel you want to send the test results to.
- <pro-test-email> and <pro-test-password> are the credentials for a user with PRO rights.

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
