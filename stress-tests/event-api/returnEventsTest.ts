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
  "EPISODE_FILTER_TYPE",
  "FEED",
  "TYPES",
  "LIMIT",
  "TOKEN",
  "PAUSE_BETWEEN_BANCHES_OF_REQUESTS",
] as const;

const [
  numberOfRequestsPerTestRun,
  episodeFilterType,
  feed,
  types,
  limit,
  token,
  timeout,
] = desiredData.map((variable) => parseEnv(variable)) as [
  number,
  "ANY" | "NONE" | "LATEST",
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
