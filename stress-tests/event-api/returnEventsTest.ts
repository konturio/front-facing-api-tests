import { calculateLoadAnalytics } from "./helpers/resultsAnalytics.ts";
import EventApiRequestProfiler from "./helpers/requestProfiler.ts";
import getAllDisastersAndObservations from "./helpers/returnAllDisastersObservations.ts";
import runBunchesOfRequests from "./helpers/runnerUtils.ts";
import fs from "fs";

const numberOfRequestsPerTestRun = 1000;
const episodeFilterType = "ANY";
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

console.log("Started getting all disasters...");

const { disasterIDs } = await getAllDisastersAndObservations(
  searchAllEventsUrl,
  eventApiRequestProfiler
);
console.log("Finished getting all disasters...");

console.log("Preparing all requests for testing...");
const disasterRequests = disasterIDs.map((disasterID) => {
  return async function () {
    const getEventsUrl = eventApiRequestProfiler.buildUrl(
      `https://apps.kontur.io/events/v1/event`,
      {
        feed,
        episodeFilterType,
        eventId: String(disasterID),
      }
    );
    const {
      startTime,
      responseStatus,
      payloadSize,
      body,
      error: fetchError,
      responseTimeMs,
    } = await eventApiRequestProfiler.fetchWithMetrics(getEventsUrl);

    const responseBody = body as { eventId: string; observations: string[] };
    let error = fetchError;

    if (responseBody && Object.keys(responseBody).length > 0) {
      const eventId = responseBody?.eventId;
      if (eventId !== disasterID) {
        error =
          error +
          `, Requested disaster ID ${disasterID} is not equal to got disaster ID ${eventId} `;
      }
    } else {
      error = error + `, Response body is empty`;
    }
    return {
      startTime: new Date(startTime).toISOString(),
      url: getEventsUrl.toString(),
      disasterIds: "Not relevant",
      responseStatus,
      responseTimeMs,
      payloadSize,
      error,
    };
  };
});

const { results, testingTime } = await runBunchesOfRequests({
  arrOfFunctions: disasterRequests,
  numberOfRequests: disasterIDs.length,
  numberOfRequestsPerTestRun,
  timeoutBetweenBunchesOfRequestsMs: timeout,
});

console.log("Logging results...");
fs.writeFileSync("returnedEventsData.json", JSON.stringify(results, null, 2));

console.log("Started analytics calculation...");

console.log(
  calculateLoadAnalytics(results, {
    numberOfRequests: disasterIDs.length,
    episodeFilterType,
    feed,
    testingTimeMs: testingTime,
  })
);
