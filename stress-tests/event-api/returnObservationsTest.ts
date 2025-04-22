import { observationIDs } from "./returnAllDisastersObservations.ts";
import { calculateLoadAnalytics } from "./resultsAnalytics.ts";
import fs from "fs";

const sleep = (ms: number) =>
  new Promise((resolve) => {
    console.log(`Sleeping ${ms}ms...`);
    setTimeout(resolve, ms);
  });

const timeout = 0;
const numberOfRequestsPerTestRun = 1000;
const numberOfIterations = Math.floor(
  observationIDs.length / numberOfRequestsPerTestRun
);
const token = "token";

const observationsRequests = observationIDs.map((observationID) => {
  return async function () {
    const url = new URL(
      `https://apps.kontur.io/events/v1/observations/${observationID}`
    );
    const startTime = Date.now();
    let status = 0;
    let error = "";
    let payloadSize = 0;
    let endTime = 0;
    let responseTimeMs = 0;
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
    } catch (e) {
      error = e.message || String(e);
    }
    return {
      startTime: new Date(startTime).toISOString(),
      url: url.toString(),
      disasterIds: "Not relevant",
      responseStatus: status,
      responseTimeMs,
      payloadSize,
      error,
    };
  };
});

const startRequestingTime = Date.now();
console.log(`Start requesting: ${new Date(startRequestingTime).toISOString()}`);

let results = [] as any[];
for (let i = 0; i < numberOfIterations; i++) {
  console.log(
    `Running ${i + 1} bunch of requests (${numberOfIterations - i - 1} is left)`
  );
  const testedFunctions = observationsRequests.slice(
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
