import fs from "fs";

const thresholds = [
  { ms: 1000, key: "moreThan1sec" },
  { ms: 3000, key: "moreThan3sec" },
  { ms: 5000, key: "moreThan5sec" },
  { ms: 10000, key: "moreThan10sec" },
  { ms: 100000, key: "moreThan100sec" },
] as const;

type Results = {
  startTime: string;
  url: string;
  responseStatus: number;
  responseTimeMs: number;
  payloadSize: number;
  disasterIds: string;
  error: null | string;
};

type ResultsAnalysis = {
  responseTimeMax: number;
  responseTimeMin: number;
  statuses: { [key: string]: number };
  longRequests:
    | { [K in (typeof thresholds)[number]["key"]]: number }
    | "No requests longer than 1 sec";
  notOKRequestsNumber: number;
  uniqueErrors: string[];
  testData: {
    numberOfRequests: number;
    episodeFilterType?: "ANY" | "NONE" | "LATEST";
    types?: string[];
    startingBbox?: number[];
    feed?: string;
    limit?: number;
    shiftBboxCoordinatesStep?: number;
    startingAfterDate?: string;
    testingTimeMs: number;
    pauseBetweenBunchesOfRequestsMs?: number;
  };
  responseTimeAvgMs: number;
  responseTimeMedianMs: number;
  responseTimeBelowWhich95PercentOfRequestsFitMs: number;
  responseTimeBelowWhich99PercentOfRequestsFitMs: number;
  maxThreeUniqueDisasterIdsFound: string[];
  maxThreeUniqueLastTestedUrls: string[];
  uniquePayloadSizes: number[];
  testingTimeMs: number;
  pauseBetweenBunchesOfRequestsMs: number;
};

/**
 * This function builds a message to send to Slack with the results analytics
 * @param resultsAnalytics an object with the results analytics
 * @returns string with the message to send to Slack
 */

const buildAnalyticsMessage = (resultsAnalytics: ResultsAnalysis): string => {
  const {
    responseTimeMax,
    responseTimeMin,
    statuses,
    longRequests,
    notOKRequestsNumber,
    uniqueErrors,
    testData,
    responseTimeAvgMs,
    responseTimeMedianMs,
    responseTimeBelowWhich95PercentOfRequestsFitMs,
    responseTimeBelowWhich99PercentOfRequestsFitMs,
    maxThreeUniqueDisasterIdsFound,
    maxThreeUniqueLastTestedUrls,
    uniquePayloadSizes,
  } = resultsAnalytics;

  const testSummary = `🚀 Stress test for Event API completed: ran ${testData.numberOfRequests} requests, feed=${testData.feed || "unknown"}, disaster types=${testData.types?.join(", ") || "none"}, bbox=[${testData.startingBbox?.join(", ") || "N/A"}], limit=${testData.limit || "N/A"}. Started after value is '${testData.startingAfterDate || "N/A"}'. Episode filter type is ${testData.episodeFilterType || "N/A"}.\nIf bbox was used, it was moved on ${testData.shiftBboxCoordinatesStep || "N/A"} step each time. To run all requests took ${testData.testingTimeMs || "N/A"}ms. Pause between bunches of requests was ${testData.pauseBetweenBunchesOfRequestsMs || "N/A"}ms. \n`;

  const perf = `⚡ Performance stats: avg response time is ${responseTimeAvgMs ? responseTimeAvgMs.toFixed(2) : "N/A"}ms, median is ${responseTimeMedianMs || "N/A"}ms, max is ${responseTimeMax || "N/A"}ms, min is ${responseTimeMin || "N/A"}ms, 95th percentile is ${responseTimeBelowWhich95PercentOfRequestsFitMs || "N/A"}ms, 99th percentile is ${responseTimeBelowWhich99PercentOfRequestsFitMs || "N/A"}ms.\n`;

  const statusSummary = Object.entries(statuses || {})
    .map(([code, count]) => `${code}: ${count} reqs`)
    .join(", ");
  const statusText = `📊 HTTP statuses: ${statusSummary || "no responses"}\n`;

  const errors = `🔥 Errors: ${notOKRequestsNumber || 0} failed requests, unique errors=${uniqueErrors?.length || 0} (${uniqueErrors?.join(", ") || "none"})\n`;

  const longReqsText =
    typeof longRequests === "string"
      ? longRequests
      : Object.entries(longRequests || {})
          .map(([key, count]) => `${key}: ${count} requests`)
          .join(", ");
  const longReqs = `🐢 Slow requests: ${longReqsText || "no slow requests"}\n`;

  const ids = `🆔 Found disaster IDs: ${maxThreeUniqueDisasterIdsFound?.join(", ") || "none"}\n`;
  const urls = `🌐 Tested URLs: ${maxThreeUniqueLastTestedUrls?.join(", ") || 0}\n`;
  const sizes = `📏 Unique payload sizes: ${uniquePayloadSizes?.join(", ") || "N/A"} bytes\n`;

  return `${testSummary} /n ${perf} | ${statusText} | ${errors} | ${longReqs} | ${ids} | ${urls} | ${sizes} 😎`;
};

/**
 * This function calculates the load analytics for the given results and test data. Returns an object with the calculated analytics.
 * @param results array of results from the tests
 * @param testData object with test data with information about the tests
 * @returns results analysis object
 */

export const calculateLoadAnalytics = function (
  results: Results[],
  testData: ResultsAnalysis["testData"]
): ResultsAnalysis {
  const analyticsBasicData = {
    uniqueErrors: new Set(),
    notOKRequests: 0,
    responseTimeMax: 0,
    responseTimeMin: Number.MAX_SAFE_INTEGER,
    responseTimeSum: 0,
    responseTimeAvg: 0,
    numberOfNot200ok: 0,
    responseTimes: [] as any[],
    disasterIds: [] as any[],
    urls: [] as any[],
    payloads: [] as any[],
    startTimes: [] as any[],
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

        acc.statuses[responseStatus.toString()] =
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
        acc.statuses[responseStatus.toString()] =
          (acc.statuses[responseStatus.toString()] || 0) + 1;
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
  ) as ResultsAnalysis;
  const sortedResponseTimes = [...analyticsBasicData.responseTimes].sort(
    (a, b) => a - b
  );
  resultsAnalytics.notOKRequestsNumber = analyticsBasicData.notOKRequests;
  resultsAnalytics.uniqueErrors = [
    ...analyticsBasicData.uniqueErrors,
  ] as string[];
  resultsAnalytics.testData.numberOfRequests = results.length;
  resultsAnalytics.responseTimeAvgMs =
    analyticsBasicData.responseTimeSum / results.length;

  resultsAnalytics.responseTimeMedianMs =
    sortedResponseTimes[Math.floor(sortedResponseTimes.length / 2)];
  resultsAnalytics.responseTimeBelowWhich95PercentOfRequestsFitMs =
    sortedResponseTimes[Math.floor(0.95 * sortedResponseTimes.length)];
  resultsAnalytics.responseTimeBelowWhich99PercentOfRequestsFitMs =
    sortedResponseTimes[Math.floor(0.99 * sortedResponseTimes.length)];
  resultsAnalytics.maxThreeUniqueDisasterIdsFound = [
    ...new Set(analyticsBasicData.disasterIds),
  ].slice(0, 3);
  resultsAnalytics.maxThreeUniqueLastTestedUrls = [
    ...new Set(analyticsBasicData.urls),
  ].slice(-3);
  resultsAnalytics.uniquePayloadSizes = [
    ...new Set(analyticsBasicData.payloads),
  ];
  for (const key of Object.keys(testData)) {
    resultsAnalytics.testData[key] = testData[key];
  }
  fs.writeFileSync("analytics.txt", buildAnalyticsMessage(resultsAnalytics));
  return resultsAnalytics;
};
