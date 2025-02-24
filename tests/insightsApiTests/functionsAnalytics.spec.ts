import { test, expect } from "@playwright/test";
import {
  getRandomCountryJSON,
  getGraphqlQuery,
  sendGraphqlQuery,
} from "../helper";

type Stat = {
  id: string;
  result: number | null;
};

const functionsToCheck = [
  {
    id: "populatedareakm2",
    minExpectedResult: 100,
    maxExpectedResult: 1000000, // TODO: udjust this values after high resolution data in prod is available https://kontur.fibery.io/Tasks/User_Story/High-resolution-MCDA-tiles-2225
  },
  {
    id: "industrialareakm2",
    minExpectedResult: 1,
    maxExpectedResult: 1000000,
  },
  {
    id: "forestareakm2",
    minExpectedResult: 1,
    maxExpectedResult: 1500000,
  },
  {
    id: "volcanoescount",
    minExpectedResult: 0,
    maxExpectedResult: 200,
  },
  {
    id: "hotspotdaysperyearmax",
    minExpectedResult: 0, // TODO: udjust this value after high resolution data in prod is available https://kontur.fibery.io/Tasks/User_Story/High-resolution-MCDA-tiles-2225
    maxExpectedResult: 365,
  },
  {
    id: "osmgapspercentage",
    minExpectedResult: 0,
    maxExpectedResult: 90,
  },
  {
    id: "osmgapssum",
    minExpectedResult: 0,
    maxExpectedResult: 30000,
  },
];

const polygon = getRandomCountryJSON({ notBigCountry: true });
const testedCountry = polygon.features[0].properties.ADMIN;

const queryDeadline = 45000;

const functionsQuery = getGraphqlQuery("analyticsFunctions", {
  useGeojson: true,
});

test.describe(
  `Analytics functions tests`,
  {
    annotation: {
      type: "country",
      description: `Area of ${testedCountry} is tested. To get geojson go to ${process.env.ALL_COUNTRIES_PATH} in ${process.env.REPO_NAME} repo`,
    },
  },
  () => {
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
          (acc: number, curr: Stat) => acc + (curr.result ?? 0),
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

          expect(
            result,
            `Result for ${id} should be >=0`
          ).toBeGreaterThanOrEqual(0);

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
  }
);
