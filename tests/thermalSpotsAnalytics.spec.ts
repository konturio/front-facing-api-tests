import { test, expect } from "@playwright/test";
import { getApis, getJSON, getGraphqlQuery, sendGraphqlQuery } from "./helper";

const polygon = getJSON(`sicily-polygon`, { isRequest: true });

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
    test.fixme(
      true,
      `Thermal spots analytics tests are skipped due to https://kontur.fibery.io/Tasks/Task/Thermal-spots-analytics-request-does-not-provide-valid-response-20750 issue`
    );
    const responseObj = await sendGraphqlQuery({
      request,
      url: process.env.GRAPHQL_ENDPOINT as string,
      timeout: queryDeadline,
      query: thermalSpotStatisticQuery,
      polygon: JSON.stringify(polygon),
    });

    const stats =
      responseObj?.data?.polygonStatistic?.analytics?.thermalSpotStatistic;
    expect(stats, "Thermal spots statistics should be returned").toBeDefined();

    for (const field of fieldsToCheck) {
      await test.step(`Check '${field}' field is not null and >= 0`, async () => {
        expect(stats[field]).toBeDefined();
        expect(stats[field]).toBeGreaterThanOrEqual(0);
        expect(stats[field]).not.toBeNull();
      });
    }
  });
});
