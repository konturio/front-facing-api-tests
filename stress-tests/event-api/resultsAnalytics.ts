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
  maxTenUniqueDisasterIdsFound: string[];
  maxTenUniqueLastTestedUrls: string[];
  uniquePayloadSizes: number[];
  testingTimeMs: number;
  pauseBetweenBunchesOfRequestsMs: number;
};

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
  resultsAnalytics.maxTenUniqueDisasterIdsFound = [
    ...new Set(analyticsBasicData.disasterIds),
  ].slice(0, 10);
  resultsAnalytics.maxTenUniqueLastTestedUrls = [
    ...new Set(analyticsBasicData.urls),
  ].slice(-10);
  resultsAnalytics.uniquePayloadSizes = [
    ...new Set(analyticsBasicData.payloads),
  ];
  for (const key of Object.keys(testData)) {
    resultsAnalytics.testData[key] = testData[key];
  }
  return resultsAnalytics;
};
