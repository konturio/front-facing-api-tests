import { test, expect } from "@playwright/test";
import { getJSON, getGraphqlQuery, sendGraphqlQuery } from "./helper";

const polygon = getJSON("mayotte-polygon-variable", { isRequest: true });

const queryDeadline = 45000;

const populationQuery = getGraphqlQuery("bivariateStatisticMeta", {
  useGeojson: true,
});

test.describe("Meta tests", () => {
  test("Check max and min zoom", async ({ request }) => {
    const response = await sendGraphqlQuery({
      request,
      url: process.env.GRAPHQL_ENDPOINT as string,
      timeout: queryDeadline,
      query: populationQuery,
      polygon: JSON.stringify(polygon),
    });
    const meta = response?.data?.polygonStatistic?.bivariateStatistic?.meta;
    expect(meta, "Meta should be defined in response").toBeDefined();
    expect.soft(meta.max_zoom, "Max_zoom should be 8").toBe(8);
    expect.soft(meta.min_zoom, "Min_zoom should be 0").toBe(0);
  });
});
