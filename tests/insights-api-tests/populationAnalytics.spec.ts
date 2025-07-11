import { test, expect } from "@playwright/test";
import {
  getPolygonsToTest,
  getGraphqlQuery,
  sendGraphqlQuery,
  getReferenceDataForCountry,
  getConsumersAndPushToAnnotations,
} from "../helpers/main-helper";
import type { PopulationAnalytics, PopulationData } from "../helpers/types";
import { fileURLToPath } from "url";
import { basename } from "path";

const polygons = getPolygonsToTest();
const queryDeadline = 60000;
const fileNameWithNoExtension = basename(fileURLToPath(import.meta.url)).split(
  "."
)[0];

const populationQuery = getGraphqlQuery("analyticsPopulation", {
  useGeojson: true,
});

const fieldsToCheck = ["population", "gdp", "urban"];

for (const polygon of polygons) {
  const testedCountry = polygon.features[0].properties.ADMIN;
  const referenceData = getReferenceDataForCountry(
    testedCountry,
    "population"
  ) as PopulationAnalytics;
  const [populationExpectedData, gdpExpectedData, urbanExpectedData] =
    fieldsToCheck.map((id) => {
      const data = referenceData.populationData.find((d) => d.id === id);
      if (!data)
        throw new Error(
          `Expected data for '${id}' is not found for ${testedCountry}`
        );
      return data;
    });
  test(
    `Check population statistics calculation (testing ${process.env.COUNTRIES_TO_TEST === "" ? "random country" : testedCountry})`,
    {
      annotation: {
        type: "country",
        description: `Area of ${testedCountry} is tested. To get geojson go to ${process.env.ALL_COUNTRIES_PATH} in ${process.env.REPO_NAME} repo`,
      },
      tag: "@fitsLoadTesting",
    },
    async ({ playwright }) => {
      getConsumersAndPushToAnnotations(fileNameWithNoExtension);
      // Create new context to avoid playwright caching
      const request = await playwright.request.newContext();
      const responseObj = await sendGraphqlQuery({
        request,
        url: process.env.GRAPHQL_ENDPOINT as string,
        timeout: queryDeadline,
        query: populationQuery,
        polygon: JSON.stringify(polygon),
      });

      const stats: PopulationData =
        responseObj?.data?.polygonStatistic?.analytics?.population;

      expect(
        stats,
        "Response should contain population analytics data"
      ).toBeDefined();

      for (const field of fieldsToCheck) {
        await test.step(`Check '${field}' field is not null and >= 0`, async () => {
          expect(stats[field], "Value should be defined").toBeDefined();
          expect
            .soft(stats[field], "Value should be >= 0")
            .toBeGreaterThanOrEqual(0);
          expect(stats[field], "Value should not be null").not.toBeNull();
          expect(
            Number.isFinite(stats[field]),
            "Value should be a finite number"
          ).toBeTruthy();
        });
      }

      await test.step(`Check that not all the values are 0`, async () => {
        const sum = Object.values(stats).reduce((acc: number, val: number) => {
          return acc + val;
        }, 0);
        expect(sum, "Sum of all values should be > 0").toBeGreaterThan(0);
      });

      await test.step(`Check values are in expected range`, async () => {
        const { population, gdp, urban } = stats;
        expect
          .soft(
            population,
            `Expect population to be ≥ ${populationExpectedData.minExpectedResult}`
          )
          .toBeGreaterThanOrEqual(populationExpectedData.minExpectedResult);
        expect
          .soft(
            population,
            `Expect population to be ≤ ${populationExpectedData.maxExpectedResult}`
          )
          .toBeLessThanOrEqual(populationExpectedData.maxExpectedResult);
        expect
          .soft(
            urban,
            `Expect urban population to be ≥ ${urbanExpectedData.minExpectedResult}`
          )
          .toBeGreaterThanOrEqual(urbanExpectedData.minExpectedResult);
        expect
          .soft(urban, `Expect urban population to be ≤ all population`)
          .toBeLessThanOrEqual(population);
        expect
          .soft(
            urban,
            `Expect urban population to be ≤ ${urbanExpectedData.maxExpectedResult}`
          )
          .toBeLessThanOrEqual(urbanExpectedData.maxExpectedResult);
        expect
          .soft(
            gdp,
            `Expect gross domestic product (GDP) to be ≥ ${gdpExpectedData.minExpectedResult}`
          )
          .toBeGreaterThanOrEqual(gdpExpectedData.minExpectedResult);
        expect
          .soft(
            gdp,
            `Expect gross domestic product (GDP) to be ≤ ${gdpExpectedData.maxExpectedResult}`
          )
          .toBeLessThanOrEqual(gdpExpectedData.maxExpectedResult);
      });
    }
  );
}
