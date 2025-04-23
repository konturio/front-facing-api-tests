import { calculateLoadAnalytics } from "./helpers/resultsAnalytics.ts";
import EventApiRequestProfiler from "./helpers/requestProfiler.ts";
import getAllDisastersAndObservations from "./helpers/returnAllDisastersObservations.ts";
import runBunchesOfRequests from "./helpers/runnerUtils.ts";
import fs from "fs";

const numberOfRequestsPerTestRun = 1000;
const feed = "kontur-private";
const types = ["FLOOD", "WILDFIRE", "EARTHQUAKE", "CYCLONE", "STORM"] as [
  "FLOOD",
  "WILDFIRE",
  "EARTHQUAKE",
  "CYCLONE",
  "STORM",
];
const limit = 1000;
const token = "token";
const timeout = 0;

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
