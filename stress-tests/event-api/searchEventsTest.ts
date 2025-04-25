import { calculateLoadAnalytics } from "./helpers/resultsAnalytics.ts";
import EventApiRequestProfiler from "./helpers/requestProfiler.ts";
import runBunchesOfRequests, { parseEnv } from "./helpers/runnerUtils.ts";
import fs from "fs";
import dotenv from "dotenv";
import type { Types } from "./helpers/requestProfiler.ts";

dotenv.config({
  path: [".env.event-api-stress", ".env.event-api-stress.local"],
});

const desiredData = [
  "NUMBER_OF_REQUESTS",
  "NUMBER_OF_PARALLEL_REQUESTS",
  "EPISODE_FILTER_TYPE",
  "FEED",
  "TYPES",
  "LIMIT",
  "TOKEN",
  "PAUSE_BETWEEN_BANCHES_OF_REQUESTS",
  "SHIFTSTEP",
  "AFTER",
  "BBOX",
] as const;

const [
  numberOfRequests,
  numberOfRequestsPerTestRun,
  episodeFilterType,
  feed,
  types,
  limit,
  token,
  timeout,
  shiftStep,
  after,
  bbox,
] = desiredData.map((variable) => parseEnv(variable)) as [
  number,
  number,
  "ANY" | "NONE" | "LATEST",
  string,
  Types,
  number,
  string,
  number,
  number,
  string,
  number[],
];

const eventApiRequestProfiler = new EventApiRequestProfiler(token);

async function getEvents(ind: number) {
  const searchEventsUrl = eventApiRequestProfiler.buildUrl(
    `https://apps.kontur.io/events/v1/`,
    {
      feed,
      types,
      limit,
      episodeFilterType,
      bbox,
      after,
    }
  );
  const updatedBboxUrl = eventApiRequestProfiler.moveBBxOnStep({
    shiftStep,
    multiplier: ind + 1,
    url: searchEventsUrl,
  });
  const updatedAfterUrl = eventApiRequestProfiler.moveAfterDateOnStep({
    multiplier: ind + 1,
    url: updatedBboxUrl,
  });
  const {
    startTime,
    responseStatus,
    payloadSize,
    body,
    error,
    responseTimeMs,
  } = await eventApiRequestProfiler.fetchWithMetrics(updatedAfterUrl);

  const responseBody = body as {
    pageMetadata: { nextAfterValue: string };
    data: { eventId: string; observations: string[] }[];
  };
  let disasterIds: string[] = [];
  if (responseBody?.data?.length) {
    disasterIds = responseBody.data.map((event) => event.eventId);
  }
  return {
    startTime: new Date(startTime).toISOString(),
    url: updatedAfterUrl.toString(),
    responseStatus,
    responseTimeMs,
    payloadSize,
    disasterIds: disasterIds?.sort()?.join(", "),
    error,
  };
}

const arrOfFunctions = [] as any[];
for (let index = 0; index < numberOfRequests; index++) {
  arrOfFunctions.push(() => getEvents(index));
}

const { results, testingTime } = await runBunchesOfRequests({
  arrOfFunctions: arrOfFunctions,
  numberOfRequests: numberOfRequests,
  numberOfRequestsPerTestRun,
  timeoutBetweenBunchesOfRequestsMs: timeout,
});

fs.writeFileSync(
  "searchEventsReturnedData.json",
  JSON.stringify(results, null, 2)
);

console.log("Started analytics calculation...");
console.log(
  calculateLoadAnalytics(results, {
    numberOfRequests,
    episodeFilterType,
    types,
    startingBbox: bbox,
    feed,
    limit,
    shiftBboxCoordinatesStep: shiftStep,
    startingAfterDate: after,
    testingTimeMs: testingTime,
    pauseBetweenBunchesOfRequestsMs: timeout,
  })
);
