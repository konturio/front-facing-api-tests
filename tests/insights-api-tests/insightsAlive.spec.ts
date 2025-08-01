import { test, expect } from "@playwright/test";
import {
  getPolygonsToTest,
  getGraphqlQuery,
  sendGraphqlQuery,
} from "../helpers/main-helper";

const polygons = getPolygonsToTest();
const queryDeadline = 60000;

const queriesFilesWithGeojson = [
  "advancedAnalytics",
  "bivariateStatisticAxisIndicators",
  "analyticsPopulationInfrastructure",
  "bivariateStatisticIndicators",
  "analyticsPopulationInfrastructureResult",
  "bivariateStatisticOverlays",
  "analyticsPopulationInfrastructureUnitsLabels",
  "humanitarianImpact",
  "analyticsUrbanCore",
  "thermalSpotStatistic",
  "bivariateStatisticAxis",
];

const queriesFilesNoGeojson: string[] = [
  "bivariateStatisticAxis",
  "bivariateStatisticJustIndicators",
  "bivariateStatisticAxisNoTransformation",
  "getAxes",
  "getTransformations",
];

const graphqlQueriesWithGeojson = queriesFilesWithGeojson.reduce(
  (acc: string[], query) => {
    acc.push(getGraphqlQuery(query, { useGeojson: true }));
    return acc;
  },
  []
);

const graphqlQueriesWithoutGeojson = queriesFilesNoGeojson.reduce(
  (acc: string[], query) => {
    acc.push(getGraphqlQuery(query, { useGeojson: false }));
    return acc;
  },
  []
);
for (const polygon of polygons) {
  const testedCountry = polygon.features[0].properties.ADMIN;
  test.describe(
    `Check insights api graphql queries with geojson (testing ${process.env.COUNTRIES_TO_TEST === "" ? "random country" : testedCountry})`,
    {
      annotation: {
        type: "country",
        description: `Area of ${testedCountry} is tested. To get geojson go to ${process.env.ALL_COUNTRIES_PATH} in ${process.env.REPO_NAME} repo`,
      },
    },
    () => {
      // Endpoints can not answer all the time in time and it's ok, so higher number of retries is present
      test.describe.configure({ retries: 2 });

      for (let i = 0; i <= queriesFilesWithGeojson.length - 1; i++) {
        test(
          `Check ${queriesFilesWithGeojson[i]} endpoint to answer 200ok and answer in ${queryDeadline}ms`,
          { tag: "@guest" },
          async ({ request }) => {
            const responseObj = await sendGraphqlQuery({
              request,
              url: process.env.GRAPHQL_ENDPOINT as string,
              timeout: queryDeadline,
              query: graphqlQueriesWithGeojson[i],
              polygon: JSON.stringify(polygon),
            });
            expect(
              responseObj.data,
              `Response data should be defined`
            ).toBeDefined();
            expect(
              responseObj.data,
              `Response data should not be null`
            ).not.toBeNull();
          }
        );
      }
    }
  );
}
test.describe("Check insights api graphql queries with no geojson", () => {
  // Endpoints can not answer all the time in time and it's ok, so higher number of retries is present
  test.describe.configure({ retries: 2 });

  for (let i = 0; i <= queriesFilesNoGeojson.length - 1; i++) {
    test(
      `Check ${queriesFilesNoGeojson[i]} endpoint to answer 200ok and answer in ${queryDeadline}ms`,
      { tag: "@guest" },
      async ({ request }) => {
        const responseObj = await sendGraphqlQuery({
          request,
          url: process.env.GRAPHQL_ENDPOINT as string,
          timeout: queryDeadline,
          query: graphqlQueriesWithoutGeojson[i],
        });
        expect(
          responseObj.data,
          `Response data should be defined`
        ).toBeDefined();
        expect(
          responseObj.data,
          `Response data should not be null`
        ).not.toBeNull();
      }
    );
  }
});
