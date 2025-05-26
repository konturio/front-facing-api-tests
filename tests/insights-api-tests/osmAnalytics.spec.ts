import { test, expect } from "@playwright/test";
import {
  getPolygonsToTest,
  getGraphqlQuery,
  sendGraphqlQuery,
  getReferenceDataForCountry,
  OsmAnalytics,
} from "../helper";

const polygons = getPolygonsToTest();
const queryDeadline = 60000;

const osmQuery = getGraphqlQuery("analyticsOSMQuality", {
  useGeojson: true,
});

for (const polygon of polygons) {
  const testedCountry = polygon.features[0].properties.ADMIN;
  const referenceData = getReferenceDataForCountry(
    testedCountry,
    "osm"
  ) as OsmAnalytics;
  const osmDataToCheck = referenceData.osmData;
  test.describe(
    `OSM quality tests (testing ${process.env.COUNTRIES_TO_TEST === "" ? "random country" : testedCountry})`,
    {
      annotation: {
        type: "country",
        description: `Area of ${testedCountry} is tested. To get geojson go to ${process.env.ALL_COUNTRIES_PATH} in ${process.env.REPO_NAME} repo`,
      },
      tag: "@fitsLoadTesting",
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
          const osmValues = osmDataToCheck.find((data) => data.id === id);
          if (!osmValues) {
            throw new Error(
              `OSM data for "${id}" is not found in reference data`
            );
          }
          await test.step(`Check ${id} is not worse than reference (${osmValues.id})`, () => {
            expect
              .soft(
                result,
                `${id} should be greater than or equal to reference (${osmValues.minExpectedResult})`
              )
              .toBeGreaterThanOrEqual(osmValues.minExpectedResult);
            expect
              .soft(
                result,
                `${id} should be less than or equal to reference (${osmValues.maxExpectedResult})`
              )
              .toBeLessThanOrEqual(osmValues.maxExpectedResult);
          });
        }
      });
    }
  );
}
