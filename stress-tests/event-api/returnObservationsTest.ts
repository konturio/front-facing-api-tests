import { calculateLoadAnalytics } from "./helpers/resultsAnalytics.ts";
import EventApiRequestProfiler from "./helpers/requestProfiler.ts";
import getAllDisastersAndObservations from "./helpers/returnAllDisastersObservations.ts";
import runBunchesOfRequests, { parseEnv } from "./helpers/runnerUtils.ts";
import fs from "fs";
import * as dotenv from "dotenv";
import type { Types } from "./helpers/requestProfiler.ts";

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

const eventApiRequestProfiler = new EventApiRequestProfiler(token);
const searchAllEventsUrl = eventApiRequestProfiler.buildUrl(
  "https://apps.kontur.io/events/v1/",
  {
    feed,
    types,
    limit,
  }
);

console.log("Started getting all observations...");
const { observationIDs } = await getAllDisastersAndObservations(
  searchAllEventsUrl,
  eventApiRequestProfiler
);
console.log("Finished getting all observations...");
console.log("Preparing all requests for testing...");

const observationsRequests = observationIDs.map((observationID) => {
  return async function () {
    const getObservationsUrl = eventApiRequestProfiler.buildUrl(
      `https://apps.kontur.io/events/v1/observations/${observationID}`
    );
    const { startTime, responseStatus, payloadSize, error, responseTimeMs } =
      await eventApiRequestProfiler.fetchWithMetrics(getObservationsUrl);
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
