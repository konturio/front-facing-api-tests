import { calculateLoadAnalytics } from "./helpers/resultsAnalytics.ts";
import EventApiRequestProfiler from "./helpers/requestProfiler.ts";
import runBunchesOfRequests from "./helpers/runnerUtils.ts";
import fs from "fs";

const feed = "pdc";
const bbox = [-93.2175, 30.198, -93.2165, 30.199];
const types = ["FLOOD", "WILDFIRE", "EARTHQUAKE", "CYCLONE", "STORM"] as [
  "FLOOD",
  "WILDFIRE",
  "EARTHQUAKE",
  "CYCLONE",
  "STORM",
];
const limit = 1000;
const episodeFilterType = "NONE";
const after = "2024-02-13T23:20:50.52Z";
const timeout = 6000;
const shiftStep = 0.00001;

const numberOfRequests = 80;
const numberOfRequestsPerTestRun = 40;
const token = "token";

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

fs.writeFileSync("loadTestResults.json", JSON.stringify(results, null, 2));
//
// results = JSON.parse(fs.readFileSync("loadTestResults.json", "utf-8"));
//

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
