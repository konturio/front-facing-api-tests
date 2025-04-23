type BunchOfRequestsResults = {
  results: any[];
  testingTime: number;
};

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
export default runBunchesOfRequests;
