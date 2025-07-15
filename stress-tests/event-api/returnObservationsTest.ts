import { calculateLoadAnalytics } from "./helpers/resultsAnalytics.ts";
import EventApiLoadTester from "./helpers/loadTester.ts";
import getAllDisastersAndObservations from "./helpers/returnAllDisastersObservations.ts";
import runBunchesOfRequests, { parseEnv } from "./helpers/runnerUtils.ts";
import fs from "fs";
import dotenv from "dotenv";
import { Types } from "../../tests/helpers/types.ts";
import { EventApiURLBuilder } from "../../tests/helpers/event-api-profiler.ts";

dotenv.config({
  path: [".env.event-api-stress", ".env.event-api-stress.local"],
});

const desiredData = [
  "NUMBER_OF_PARALLEL_REQUESTS",
  "FEED",
  "TYPES",
  "LIMIT",
  "TOKEN",
  "PAUSE_BETWEEN_BANCHES_OF_REQUESTS",
] as const;

const [numberOfRequestsPerTestRun, feed, types, limit, token, timeout] =
  desiredData.map((variable) => parseEnv(variable)) as [
    number,
    string,
    Types,
    number,
    string,
    number,
  ];

const loadTester = new EventApiLoadTester(token);
const searchAllEventsUrl = new EventApiURLBuilder()
  .setType("event api search")
  .setParams({ feed, types, limit })
  .buildUrl();

console.log("Started getting all observations...");
const { observationIDs } = await getAllDisastersAndObservations(
  searchAllEventsUrl,
  loadTester
);
console.log("Finished getting all observations...");
console.log("Preparing all requests for testing...");

const observationsRequests = observationIDs.map((observationID) => {
  return async function () {
    const getObservationsUrl = new EventApiURLBuilder()
      .setType(`event api raw data (observations)`)
      .setExtraPath(`${observationID}`)
      .buildUrl();

    const { startTime, responseStatus, payloadSize, error, responseTimeMs } =
      await loadTester.fetchWithMetrics(getObservationsUrl);
    return {
      startTime: new Date(startTime).toISOString(),
      url: getObservationsUrl.toString(),
      disasterIds: "Not relevant",
      responseStatus,
      responseTimeMs,
      payloadSize,
      error,
    };
  };
});

const { results, testingTime } = await runBunchesOfRequests({
  arrOfFunctions: observationsRequests,
  numberOfRequests: observationIDs.length,
  numberOfRequestsPerTestRun,
  timeoutBetweenBunchesOfRequestsMs: timeout,
});

console.log("Logging results...");
fs.writeFileSync(
  "returnedObservationsData.json",
  JSON.stringify(results, null, 2)
);

console.log("Started analytics calculation...");

console.log(
  calculateLoadAnalytics(results, {
    numberOfRequests: observationIDs.length,
    testingTimeMs: testingTime,
    pauseBetweenBunchesOfRequestsMs: timeout,
  })
);
