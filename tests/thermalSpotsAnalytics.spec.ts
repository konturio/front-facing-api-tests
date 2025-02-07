import { test, expect } from "@playwright/test";
import { getApis, getJSON, getGraphqlQuery, sendGraphqlQuery } from "./helper";

const polygon = getJSON(`united-states-polygon`, { isRequest: true });

const queryDeadline = 30000;

const thermalSpotStatisticQuery = getGraphqlQuery("thermalSpotStatistic", {
  useGeojson: true,
});

const fieldsToCheck = [
  "volcanoesCount",
  "hotspotDaysPerYearMax",
  "industrialAreaKm2",
  "forestAreaKm2",
];

test.describe(`Thermal spots analytics tests`, () => {
  test(`Check thermal spots statistics calculation`, async ({ request }) => {
    const responseObj = await sendGraphqlQuery({
      request,
      url: process.env.GRAPHQL_ENDPOINT as string,
      timeout: queryDeadline,
      query: thermalSpotStatisticQuery,
      polygon: JSON.stringify(polygon),
    });

    const stats =
      responseObj?.data?.polygonStatistic?.analytics?.thermalSpotStatistic;

    for (const field of fieldsToCheck) {
      await test.step(`Check ${field} is not null and >= 0`, async () => {
        expect(stats[field]).toBeDefined();
        expect(stats[field]).toBeGreaterThanOrEqual(0);
        expect(stats[field]).not.toBeNull();
      });
    }
  });
});
