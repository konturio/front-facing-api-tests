import { test, expect } from "@playwright/test";
import { getJSON, getGraphqlQuery, sendGraphqlQuery } from "./helper";

const polygon = getJSON(`mayotte-polygon-variable`, { isRequest: true });

const queryDeadline = 30000;

const osmQuery = getGraphqlQuery("analyticsOSMQuality", {
  useGeojson: true,
});

// TODO: udjust this data after high resolution data in prod is available https://kontur.fibery.io/Tasks/User_Story/High-resolution-MCDA-tiles-2225

const referenceData = {
  areaWithoutOsmBuildingsKm2:
    process.env.ENVIRONMENT === "prod"
      ? 8.694087614723324
      : 0.10832311844950776,
  areaWithoutOsmRoadsKm2:
    process.env.ENVIRONMENT === "prod"
      ? 18.182505831512362
      : 0.06915842708523211,
  osmBuildingGapsPercentage:
    process.env.ENVIRONMENT === "prod"
      ? 2.1028973669565367
      : 0.22259986314359034,
  osmRoadGapsPercentage:
    process.env.ENVIRONMENT === "prod" ? 4.39792481191553 : 0.14211792113033092,
  antiqueOsmBuildingsPercentage:
    process.env.ENVIRONMENT === "prod"
      ? 6.5005639157241735
      : 35.100704255153644,
  antiqueOsmRoadsPercentage:
    process.env.ENVIRONMENT === "prod" ? 23.71363869406578 : 37.05038629521224,
  osmBuildingsCount: 79583,
  osmUsersCount: 3520,
  osmUsersHours: 4496,
  localOsmUsersHours: 2500,
  aiBuildingsCountEstimation: 79856,
};

const metricsTheLowerTheBetter = [
  "areaWithoutOsmRoadsKm2",
  "areaWithoutOsmBuildingsKm2",
  "osmBuildingGapsPercentage",
  "osmRoadGapsPercentage",
];

test.describe("OSM quality tests", () => {
  test("Check OSM quality against reference", async ({ request }) => {
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
});
