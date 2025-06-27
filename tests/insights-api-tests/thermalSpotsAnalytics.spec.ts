import { test, expect } from "@playwright/test";
import {
  getPolygonsToTest,
  getGraphqlQuery,
  sendGraphqlQuery,
  getReferenceDataForCountry,
} from "../helper";
import type { ThermalSpotsAnalytics } from "../types";

const polygons = getPolygonsToTest();
const queryDeadline = 60000;

const thermalSpotStatisticQuery = getGraphqlQuery("thermalSpotStatistic", {
  useGeojson: true,
});

const fieldsToCheck = [
  "volcanoesCount",
  "hotspotDaysPerYearMax",
  "industrialAreaKm2",
  "forestAreaKm2",
];

for (const polygon of polygons) {
  const testedCountry = polygon.features[0].properties.ADMIN;
  const referenceData = getReferenceDataForCountry(
    testedCountry,
    "thermalSpots"
  ) as ThermalSpotsAnalytics;
  test.describe(
    `Thermal spots analytics tests (testing ${process.env.COUNTRIES_TO_TEST === "" ? "random country" : testedCountry})`,
    {
      annotation: {
        type: "country",
        description: `Area of ${testedCountry} is tested. To get geojson go to ${process.env.ALL_COUNTRIES_PATH} in ${process.env.REPO_NAME} repo`,
      },
      tag: "@fitsLoadTesting",
    },
    () => {
      test(`Check thermal spots statistics calculation`, async ({
        request,
      }) => {
        const responseObj = await sendGraphqlQuery({
          request,
          url: process.env.GRAPHQL_ENDPOINT as string,
          timeout: queryDeadline,
          query: thermalSpotStatisticQuery,
          polygon: JSON.stringify(polygon),
        });

        const stats =
          responseObj?.data?.polygonStatistic?.analytics?.thermalSpotStatistic;
        expect(
          stats,
          "Thermal spots statistics should be returned"
        ).toBeDefined();

        for (const field of fieldsToCheck) {
          const testedField = stats[field];
          await test.step(`Check '${field}' field is not null and >= 0 (value: ${testedField})`, async () => {
            expect(
              testedField,
              `Field '${field}' should be defined`
            ).toBeDefined();
            expect(
              testedField,
              `Field '${field}' should be >= 0`
            ).toBeGreaterThanOrEqual(0);
            expect(
              testedField,
              `Field '${field}' should not be null`
            ).not.toBeNull();
          });
          await test.step(`Check value of ${field} to be in expected range`, async () => {
            const expectedData = referenceData.thermalSpotsData.find(
              (data) => data.id === field
            );
            if (!expectedData)
              throw new Error(
                `Expected data for '${field}' is not found for ${testedCountry}`
              );
            expect
              .soft(
                testedField,
                `Field '${field}' should be >= ${expectedData.minExpectedResult}`
              )
              .toBeGreaterThanOrEqual(expectedData.minExpectedResult);
            expect
              .soft(
                testedField,
                `Field '${field}' should be <= ${expectedData.maxExpectedResult}`
              )
              .toBeLessThanOrEqual(expectedData.maxExpectedResult);
          });
        }
      });
    }
  );
}
