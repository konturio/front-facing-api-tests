import fs from "fs";

const feed = "pdc";
const bbox = [-93.2175, 30.198, -93.2165, 30.199];
const types = ["FLOOD", "WILDFIRE", "EARTHQUAKE", "CYCLONE", "STORM"];
const limit = 1000;
const episodeFilterType = "NONE";
const after = "2024-02-13T23:20:50.52Z";
const timeout = 6000;
const shiftStep = 0.00001;

const numberOfRequests = 80000;
const numberOfRequestsPerTestRun = 100;
const token = "token";

const params = {
  feed,
  types,
  limit,
  episodeFilterType,
  bbox,
  after,
};

const sleep = (ms) =>
  new Promise((resolve) => {
    console.log(`Sleeping ${ms}ms...`);
    setTimeout(resolve, ms);
  });

async function getEvents(ind) {
  const url = new URL("https://apps.kontur.io/events/v1/");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }
  const newBbox = bbox.map((arg) => {
    const shift = shiftStep * (ind + 1);
    return arg + shift;
  });
  const afterTimestamp = new Date(after);
  afterTimestamp.setMinutes(afterTimestamp.getMinutes() + 1 * ind);
  url.searchParams.set("bbox", newBbox);
  url.searchParams.set("after", afterTimestamp.toISOString());
  let status = null;
  let responseBody = null;
  let error = null;
  let payloadSize = 0;
  let disasterIds = [];
  let endTime = null;
  let responseTimeMs = null;

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

const arrOfFunctions = [];
for (let index = 0; index < numberOfRequests; index++) {
  arrOfFunctions.push(() => getEvents(index));
}
const numberOfIterations = Math.floor(
  numberOfRequests / numberOfRequestsPerTestRun
);

const startRequestingTime = Date.now();
console.log(`Start requesting: ${new Date(startRequestingTime).toISOString()}`);

let results = [];
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
const thresholds = [
  { ms: 1000, key: "moreThan1sec" },
  { ms: 3000, key: "moreThan3sec" },
  { ms: 5000, key: "moreThan5sec" },
  { ms: 10000, key: "moreThan10sec" },
  { ms: 100000, key: "moreThan100sec" },
];

const calculateLoadAnalytics = function (results) {
  const analyticsBasicData = {
    uniqueErrors: new Set(),
    notOKRequests: 0,
    responseTimeMax: 0,
    responseTimeMin: Number.MAX_SAFE_INTEGER,
    responseTimeSum: 0,
    responseTimeAvg: 0,
    numberOfNot200ok: 0,
    responseTimes: [],
    disasterIds: [],
    urls: [],
    payloads: [],
    startTimes: [],
  };
  const resultsAnalytics = results.reduce(
    (acc, arg) => {
      const {
        startTime,
        url,
        responseStatus,
        responseTimeMs,
        payloadSize,
        disasterIds,
        error,
      } = arg;
      if (arg.responseStatus === 200 || arg.responseStatus === 204) {
        analyticsBasicData.responseTimes.push(responseTimeMs);
        analyticsBasicData.disasterIds.push(disasterIds);
        analyticsBasicData.urls.push(url);
        analyticsBasicData.payloads.push(payloadSize);
        analyticsBasicData.startTimes.push(startTime);

        if (analyticsBasicData.responseTimeMax < responseTimeMs) {
          analyticsBasicData.responseTimeMax = responseTimeMs;
          acc.responseTimeMax = responseTimeMs;
        }
        if (analyticsBasicData.responseTimeMin > responseTimeMs) {
          analyticsBasicData.responseTimeMin = responseTimeMs;
          acc.responseTimeMin = responseTimeMs;
        }

        analyticsBasicData.responseTimeSum += responseTimeMs;

        acc.statuses[responseStatus] =
          (acc.statuses[responseStatus.toString()] || 0) + 1;

        for (const { ms, key } of thresholds) {
          if (responseTimeMs > ms) {
            acc.longRequests[key] = (acc.longRequests[key] || 0) + 1;
          }
        }
        if (!acc.longRequests)
          acc.longRequests = "No requests longer than 1 sec";
        if (error) {
          analyticsBasicData.uniqueErrors.add(error);
        }
        return acc;
      } else {
        analyticsBasicData.notOKRequests++;
        analyticsBasicData.uniqueErrors.add(error);
        return acc;
      }
    },
    {
      responseTimeMax: 0,
      responseTimeMin: Number.MAX_SAFE_INTEGER,
      statuses: {},
      longRequests: {},
      testData: {},
    }
  );
  const sortedResponseTimes = [...analyticsBasicData.responseTimes].sort(
    (a, b) => a - b
  );
  resultsAnalytics.notOKRequestsNumber = analyticsBasicData.notOKRequests;
  resultsAnalytics.uniqueErrors = [...analyticsBasicData.uniqueErrors];
  resultsAnalytics.testData.numberOfRequests = results.length;
  resultsAnalytics.responseTimeAvgMs =
    analyticsBasicData.responseTimeSum / results.length;
  resultsAnalytics.responseTimeMedianMs =
    sortedResponseTimes[Math.floor(sortedResponseTimes.length / 2)];
  resultsAnalytics.responseTimeBelowWhich95PercentOfRequestsFitMs =
    sortedResponseTimes[Math.floor(0.95 * sortedResponseTimes.length)];
  resultsAnalytics.responseTimeBelowWhich99PercentOfRequestsFitMs =
    sortedResponseTimes[Math.floor(0.99 * sortedResponseTimes.length)];
  resultsAnalytics.maxTenUniqueDisasterIdsFound = [
    ...new Set(analyticsBasicData.disasterIds),
  ].slice(0, 10);
  resultsAnalytics.maxTenUniqueLastTestedUrls = [
    ...new Set(analyticsBasicData.urls),
  ].slice(-10);
  resultsAnalytics.uniquePayloadSizes = [
    ...new Set(analyticsBasicData.payloads),
  ];
  resultsAnalytics.testData.episodeFilterType = episodeFilterType;
  resultsAnalytics.testData.types = types;
  resultsAnalytics.testData.startingBbox = bbox;
  resultsAnalytics.testData.feed = feed;
  resultsAnalytics.testData.limit = limit;
  resultsAnalytics.testData.shiftBboxCoordinatesStep = shiftStep;
  resultsAnalytics.testData.startingAfterDate = after;
  resultsAnalytics.testingTimeMs = testingTime;
  resultsAnalytics.pauseBetweenBunchesOfRequestsMs = timeout;
  return resultsAnalytics;
};
console.log("Started analytics calculation...");
console.log(calculateLoadAnalytics(results));
