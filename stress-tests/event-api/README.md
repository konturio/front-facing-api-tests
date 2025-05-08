# Stress tests for event API

Tests are written in TypeScript and are run by Node.js, provide outputs to console and files, analyze this outputs and provide a report. The tests can run in the CI pipeline, both one by one and in parallel. Written for the Kontur Events API. See more https://apps.kontur.io/events/swagger-ui/index.html?configUrl=/events/v3/api-docs/swagger-config#/. You can run just one test at once.

## Running api tests

### 0. Ensure Node.js and npm are installed on your system.

```bash
node -v
npm -v
```

### 1. Set up the environment variables

Create a `.env.event-api-stress.local` file in the root of the project with the following content:

```bash

FEED=<feed>
TYPES=<types-delimited-by-comma>
EPISODE_FILTER_TYPE=<episode-filter-type>
NUMBER_OF_PARALLEL_REQUESTS=<number-of-parallel-requests>
LIMIT=<limit-for-events>
TOKEN=<token>
PAUSE_BETWEEN_BANCHES_OF_REQUESTS=<timeout-between-bunches-of-requests>
BBOX=<four-numbers-delimited-by-comma-for-bbox>
AFTER=<date-after-which-to-get-events-in-ISO-format>
SHIFTSTEP=<number-on-which-to-shift-bbox-on-each-request>
NUMBER_OF_REQUESTS=<total-number-of-requests-to-run>
```

- `<feed>` is the feed to test. Example: kontur-private.
- `<types-delimited-by-comma>` are the types of tests to run. It can be `FLOOD`, `WILDFIRE`, `EARTHQUAKE`, `CYCLONE`, `STORM` or other. Example: FLOOD, WILDFIRE, EARTHQUAKE, CYCLONE, STORM. Devided with comma.
- `<episode_filter_type>` is the episode filter type to test on. ANY, LATEST or NONE.
- `<numbers_of_parallel_requests>` is the number of parallel requests to run in a bunch of requests.
- `<limit>` is the limit for the number of events to get. Example: 1000.
- `<token>` is the token to use for the requests. Get it after login to platform from keycloak.
- `<timeout-between-bunches-of-requests>` is the pause between bunches of requests in ms.
- `<four-numbers-delimited-by-comma-for-bbox>` is the bbox to start requesting at search events test, devided by comma.
- `<date-after-which-to-get-events-in-ISO-format>` is the after date to start requesting at search events test, in ISO format.
- `<number-on-which-to-shift-bbox-on-each-request>` is the number on which to shift bbox on each request for search events test. Example: 0.00001.
- `<total-number-of-requests-to-run>` is the total number of requests to run.

### 3. Run the api tests

Search events by areas test with moving bbox and after date for each request:

```bash
node --experimental-strip-types searchEventsTest.ts
```

Get events by ids test (for all events available at feed):

```bash
node --experimental-strip-types returnEventsTest.ts
```

Get observations by ids test (for all events available at feed):

```bash
node --experimental-strip-types returnObservationsTest.ts
```

If using more modern version of Node.js, you can avoid using `--experimental-strip-types` flag.

## CI integration

The CI pipeline is configured using GitHub Actions to automate load testing of the Event API in a production environment. The workflow sends high volumes of requests with customizable parameters, enables flexible analyzing of event API endpoints performance under stress, reports results.

It is triggered manually by the user, with input values displayed in the GitHub Actions UI.

The workflow writes analysis to the console, outputs analytics to `analytics.txt`, and uploads results as artifacts. It also sends test results analytics to a Slack channel for extra visibility.

## Architecture

The system includes three load tests that do not include assertions for performance, but generate outputs to the console and files for review. Each test run is configured using process.env environment variables. The helpers folder contains separate files for:

- Static analysis of test results.
- A request profiler class to build requests, fetch data, and set parameters.
- Runner utilities to manage batches of requests and handle run-related tasks.
- A function to retrieve all disasters and observations from the feed for use in tests.

Each test runs as a separate process. The tests for retrieving events and observations simply request each event and observation from the feed. The search events test adjusts the after parameter and bbox for each request.
