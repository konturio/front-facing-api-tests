import { test, expect } from "@playwright/test";
import { getApis, getJSON, getGraphqlQuery, sendGraphqlQuery } from "./helper";

const [graphqlEndpointToTest] = getApis(
  ["insights api graphql"],
  "insights-api-graphql"
);

const polygon = getJSON("mayotte-polygon-variable", { isRequest: true });

const queryDeadline = 30000;

const queriesFilesWithGeojson = [
  "advancedAnalytics",
  "bivariateStatisticAxisIndicators",
  "advancedAnalyticsWithCalculations",
  "bivariateStatisticCorrelationRates",
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
  "bivariateStatisticCorrelationRates",
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
test.describe("Check insights api graphql queries with geojson", () => {
  // Endpoints can not answer all the time in time and it's ok, so higher number of retries is present
  test.describe.configure({ retries: 2 });

  for (let i = 0; i <= queriesFilesWithGeojson.length - 1; i++) {
    test(
      `Check ${queriesFilesWithGeojson[i]} endpoint to answer 200ok and answer in ${queryDeadline}ms`,
      { tag: "@guest" },
      async ({ request }) => {
        const responseObj = await sendGraphqlQuery({
          request,
          url: graphqlEndpointToTest.url,
          timeout: queryDeadline,
          query: graphqlQueriesWithGeojson[i],
          polygon: JSON.stringify(polygon),
        });
        expect(responseObj.data).toBeDefined();
        expect(responseObj.data).not.toBeNull();
      }
    );
  }
});

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
          url: graphqlEndpointToTest.url,
          timeout: queryDeadline,
          query: graphqlQueriesWithoutGeojson[i],
        });
        expect(responseObj.data).toBeDefined();
        expect(responseObj.data).not.toBeNull();
      }
    );
  }
});
