import type { Types } from "../../../tests/helpers/event-api-profiler.ts";

type BunchOfRequestsResults = {
  results: any[];
  testingTime: number;
};

type NeededData =
  | "FEED"
  | "EPISODE_FILTER_TYPE"
  | "NUMBER_OF_PARALLEL_REQUESTS"
  | "LIMIT"
  | "TOKEN"
  | "PAUSE_BETWEEN_BANCHES_OF_REQUESTS"
  | "BBOX"
  | "AFTER"
  | "SHIFTSTEP"
  | "NUMBER_OF_REQUESTS"
  | "TYPES";

const sleep = (ms: number) =>
  new Promise((resolve) => {
    console.log(`Sleeping ${ms}ms...`);
    setTimeout(resolve, ms);
  });

const runBunchesOfRequests = async ({
  arrOfFunctions,
  numberOfRequests,
  numberOfRequestsPerTestRun,
  timeoutBetweenBunchesOfRequestsMs,
}: {
  arrOfFunctions: (() => Promise<any>)[];
  numberOfRequests: number;
  numberOfRequestsPerTestRun: number;
  timeoutBetweenBunchesOfRequestsMs: number;
}): Promise<BunchOfRequestsResults> => {
  const numberOfIterations = Math.floor(
    numberOfRequests / numberOfRequestsPerTestRun
  );

  const startRequestingTime = Date.now();
  console.log(
    `Start requesting: ${new Date(startRequestingTime).toISOString()}`
  );

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
    await sleep(timeoutBetweenBunchesOfRequestsMs);
  }
  results = results.flat();

  const endRequestingTime = Date.now();
  console.log(`End requesting: ${new Date(endRequestingTime).toISOString()}`);
  const testingTime = endRequestingTime - startRequestingTime;
  return {
    results,
    testingTime,
  };
};

export const parseEnv = function (neededData: NeededData) {
  if (!process.env[neededData])
    throw new Error(`No '${neededData}' variable found in .env file`);
  if (
    neededData === "NUMBER_OF_PARALLEL_REQUESTS" ||
    neededData === "LIMIT" ||
    neededData === "PAUSE_BETWEEN_BANCHES_OF_REQUESTS" ||
    neededData === "SHIFTSTEP" ||
    neededData === "NUMBER_OF_REQUESTS"
  ) {
    return Number(process.env[neededData]);
  }
  if (neededData === "TYPES") {
    const types = process.env[neededData].split(",").map((type) => type.trim());
    return types as Types;
  }
  if (neededData === "BBOX") {
    return process.env[neededData].split(",").map((bbx) => Number(bbx.trim()));
  }
  return process.env[neededData].trim();
};

export default runBunchesOfRequests;
