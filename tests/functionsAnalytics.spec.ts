import { test, expect } from "@playwright/test";
import { getJSON, getGraphqlQuery, sendGraphqlQuery } from "./helper";

type Stat = {
  id: string;
  result: number | null;
};

const functionsToCheck = [
  {
    id: "populatedareakm2",
    minExpectedResult: process.env.ENVIRONMENT === "prod" ? 29000 : 3340,
    maxExpectedResult: process.env.ENVIRONMENT === "prod" ? 32000 : 3700, // TODO: udjust this values after high resolution data in prod is available https://kontur.fibery.io/Tasks/User_Story/High-resolution-MCDA-tiles-2225
  },
  {
    id: "industrialareakm2",
    minExpectedResult: 100,
    maxExpectedResult: 200,
  },
  {
    id: "forestareakm2",
    minExpectedResult: 13000,
    maxExpectedResult: 15000,
  },
  {
    id: "volcanoescount",
    minExpectedResult: 14,
    maxExpectedResult: 14,
  },
  {
    id: "hotspotdaysperyearmax",
    minExpectedResult: process.env.ENVIRONMENT === "prod" ? 130 : 189, // TODO: udjust this value after high resolution data in prod is available https://kontur.fibery.io/Tasks/User_Story/High-resolution-MCDA-tiles-2225
    maxExpectedResult: process.env.ENVIRONMENT === "prod" ? 130 : 189,
  },
  {
    id: "osmgapspercentage",
    minExpectedResult: 0,
    maxExpectedResult: 4.73,
  },
  {
    id: "osmgapssum",
    minExpectedResult: 0,
    maxExpectedResult: 1372.82,
  },
];

const polygon = getJSON(`sicily-polygon`, { isRequest: true });

const queryDeadline = 30000;

const functionsQuery = getGraphqlQuery("analyticsFunctions", {
  useGeojson: true,
});

test.describe("Analytics functions tests", () => {
  test("Check functions calculations with test data", async ({ request }) => {
    const response = await sendGraphqlQuery({
      request,
      url: process.env.GRAPHQL_ENDPOINT as string,
      timeout: queryDeadline,
      query: functionsQuery,
      polygon: JSON.stringify(polygon),
    });

    const stats = response.data.polygonStatistic.analytics.functions;

    await test.step("Check that not all results are 0", () => {
      const sum = stats.reduce(
        (acc: number, curr: any) => acc + curr.result,
        0
      );
      expect(sum, "Sum of all results should be > 0").toBeGreaterThan(0);
    });

    for (const func of functionsToCheck) {
      await test.step(`Check ${func.id} data`, () => {
        const statArray: Stat[] = stats.filter(
          (stat: Stat) => stat.id === func.id
        );
        expect(
          statArray.length,
          `There should be only exactly one result for ${func.id} at functions calculations response`
        ).toBe(1);

        const { result, id } = statArray[0];

        expect(result, `Result for ${id} should not be null`).not.toBeNull();

        expect(result, `Result for ${id} should be >=0`).toBeGreaterThanOrEqual(
          0
        );

        expect
          .soft(
            result,
            `Result for ${id} should be >= ${func.minExpectedResult}`
          )
          .toBeGreaterThanOrEqual(func.minExpectedResult);

        expect
          .soft(
            result,
            `Result for ${id} should be <= ${func.maxExpectedResult}`
          )
          .toBeLessThanOrEqual(func.maxExpectedResult);
      });
    }
  });
});
