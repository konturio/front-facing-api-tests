import { test, expect } from "@playwright/test";
import {
  getRandomCountryJSON,
  getGraphqlQuery,
  sendGraphqlQuery,
} from "../helper";

const polygon = getRandomCountryJSON({ notBigCountry: true });
const testedCountry = polygon.features[0].properties.ADMIN;

const queryDeadline = 45000;

const populationQuery = getGraphqlQuery("bivariateStatisticMeta", {
  useGeojson: true,
});

test.describe(
  `Meta tests`,
  {
    annotation: {
      type: "country",
      description: `Area of ${testedCountry} is tested. To get geojson go to ${process.env.ALL_COUNTRIES_PATH} in ${process.env.REPO_NAME} repo`,
    },
  },
  () => {
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
  }
);
