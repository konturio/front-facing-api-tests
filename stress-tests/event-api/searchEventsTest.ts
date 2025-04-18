import fs from "fs";
import { calculateLoadAnalytics } from "./resultsAnalytics.ts";

const feed = "pdc";
const bbox = [-93.2175, 30.198, -93.2165, 30.199];
const types = ["FLOOD", "WILDFIRE", "EARTHQUAKE", "CYCLONE", "STORM"];
const limit = 1000;
const episodeFilterType = "NONE";
const after = "2024-02-13T23:20:50.52Z";
const timeout = 6000;
const shiftStep = 0.00001;

const numberOfRequests = 80;
const numberOfRequestsPerTestRun = 10;
const token = "token";

const params = {
  feed,
  types,
  limit,
  episodeFilterType,
  bbox,
  after,
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    console.log(`Sleeping ${ms}ms...`);
    setTimeout(resolve, ms);
  });

async function getEvents(ind: number) {
  const url = new URL("https://apps.kontur.io/events/v1/");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, String(value));
  }
  const newBbox = bbox.map((arg) => {
    const shift = shiftStep * (ind + 1);
    return arg + shift;
  });
  const afterTimestamp = new Date(after);
  afterTimestamp.setMinutes(afterTimestamp.getMinutes() + 1 * ind);
  url.searchParams.set("bbox", newBbox.join(","));
  url.searchParams.set("after", afterTimestamp.toISOString());
  let status = 0;
  let responseBody = {} as any;
  let error = null;
  let payloadSize = 0;
  let disasterIds: string[] = [];
  let endTime = 0;
  let responseTimeMs = 0;

  const startTime = Date.now();
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    endTime = Date.now();
    responseTimeMs = endTime - startTime;
    status = response.status;
    const rawResponse = await response.text();
    payloadSize = Buffer.byteLength(rawResponse, "utf8");
    responseBody = JSON.parse(rawResponse);
    if (responseBody?.data?.length) {
      disasterIds = responseBody.data.map((event) => event.eventId);
    }
  } catch (e) {
    error = e.message || String(e);
  }

  return {
    startTime: new Date(startTime).toISOString(),
    url: url.toString(),
    responseStatus: status,
    responseTimeMs,
    payloadSize,
    disasterIds: disasterIds.sort().join(", "),
    error,
  };
}

const arrOfFunctions = [] as any[];
for (let index = 0; index < numberOfRequests; index++) {
  arrOfFunctions.push(() => getEvents(index));
}
const numberOfIterations = Math.floor(
  numberOfRequests / numberOfRequestsPerTestRun
);

const startRequestingTime = Date.now();
console.log(`Start requesting: ${new Date(startRequestingTime).toISOString()}`);

let results = [] as any[];
for (let i = 0; i < numberOfIterations; i++) {
  console.log(
    `Running ${i + 1} bunch of requests (${numberOfIterations - i - 1} is left)`
  );
  const testedFunctions = arrOfFunctions.slice(
    i * numberOfRequestsPerTestRun,
    (i + 1) * numberOfRequestsPerTestRun
  );
  results.push(await Promise.all(testedFunctions.map((fn) => fn())));
  await sleep(timeout);
}
results = results.flat();

const endRequestingTime = Date.now();
console.log(`End requesting: ${new Date(endRequestingTime).toISOString()}`);
const testingTime = endRequestingTime - startRequestingTime;

fs.writeFileSync("loadTestResults.json", JSON.stringify(results, null, 2));
//
// results = JSON.parse(fs.readFileSync("loadTestResults.json", "utf-8"));
//

console.log("Started analytics calculation...");
console.log(
  calculateLoadAnalytics(results, {
    numberOfRequests: numberOfRequests,
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
