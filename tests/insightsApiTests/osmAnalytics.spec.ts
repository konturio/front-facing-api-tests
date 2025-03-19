import { test, expect } from "@playwright/test";
import {
  getRandomCountryJSON,
  getGraphqlQuery,
  sendGraphqlQuery,
} from "../helper";

const polygon = getRandomCountryJSON({ notBigCountry: true });
const testedCountry = polygon.features[0].properties.ADMIN;

const queryDeadline = 45000;

const osmQuery = getGraphqlQuery("analyticsOSMQuality", {
  useGeojson: true,
});

// TODO: udjust this data after high resolution data in prod is available https://kontur.fibery.io/Tasks/User_Story/High-resolution-MCDA-tiles-2225

const referenceData = {
  areaWithoutOsmBuildingsKm2: 1000000,
  areaWithoutOsmRoadsKm2: 1000000,
  osmBuildingGapsPercentage: 99,
  osmRoadGapsPercentage: 99,
  antiqueOsmBuildingsPercentage: 1,
  antiqueOsmRoadsPercentage: 1,
  osmBuildingsCount: 10,
  osmUsersCount: 1,
  osmUsersHours: 1,
  localOsmUsersHours: 0,
  aiBuildingsCountEstimation: 10,
};

const metricsTheLowerTheBetter = [
  "areaWithoutOsmRoadsKm2",
  "areaWithoutOsmBuildingsKm2",
  "osmBuildingGapsPercentage",
  "osmRoadGapsPercentage",
];

test.describe(
  `OSM quality tests`,
  {
    annotation: {
      type: "country",
      description: `Area of ${testedCountry} is tested. To get geojson go to ${process.env.ALL_COUNTRIES_PATH} in ${process.env.REPO_NAME} repo`,
    },
  },
  () => {
    test("Check OSM quality against reference", async ({ playwright }) => {
      const request = await playwright.request.newContext();
      const response = await sendGraphqlQuery({
        request,
        url: process.env.GRAPHQL_ENDPOINT as string,
        timeout: queryDeadline,
        query: osmQuery,
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

      await test.step("Check that all results are generally valid", async () => {
        for (const stat of stats) {
          await test.step(`Check ${stat.id} has generally valid result`, () => {
            expect
              .soft(stat.result, `${stat.id} should not be null`)
              .not.toBeNull();
            expect
              .soft(stat.result, `${stat.id} should be >= 0`)
              .toBeGreaterThanOrEqual(0);
          });
        }
      });

      for (const stat of stats) {
        const { id, result } = stat;
        await test.step(`Check ${id} is not worse than reference (${referenceData[id]})`, () => {
          metricsTheLowerTheBetter.includes(id)
            ? expect
                .soft(
                  result,
                  `${id} should be less than or equal to reference (${referenceData[id]})`
                )
                .toBeLessThanOrEqual(referenceData[id])
            : expect
                .soft(
                  result,
                  `${id} should be greater than or equal to reference (${referenceData[id]})`
                )
                .toBeGreaterThanOrEqual(referenceData[id]);
        });
      }
    });
  }
);
