import { test, expect } from "@playwright/test";
import { getApis, getJSON, getGraphqlQuery } from "./helper";

const [graphqlEndpointToTest] = getApis(
  [`insights api graphql`],
  `insights-api-graphql`
);

const polygon = getJSON(`mayotte-polygon-variable`, { isRequest: true });

const queryDeadline = 30000;

const queriesFilesWithGeojson = [
  `advancedAnalytics`,
  `advancedAnalyticsWithCalculations`,
];

const graphqlQueriesWithGeojson = queriesFilesWithGeojson.reduce(
  (acc: string[], query) => {
    acc.push(getGraphqlQuery(query, { useGeojson: true }));
    return acc;
  },
  []
);

test.describe(`Check advanced analytics responses`, () => {
  test.describe.configure({ retries: 1 });

  for (let i = 0; i <= queriesFilesWithGeojson.length - 1; i++) {
    test(
      `Check ${queriesFilesWithGeojson[i]} endpoint to answer with valid data`,
      { tag: `@guest` },
      async ({ request }) => {
        const response = await request.post(graphqlEndpointToTest.url, {
          data: {
            query: graphqlQueriesWithGeojson[i],
            variables: {
              polygon: JSON.stringify(polygon),
            },
          },
          timeout: queryDeadline,
        });

        const responseObj = await response.json();

        expect(
          responseObj.data,
          `Response data should be defined`
        ).toBeDefined();
        expect(
          responseObj.errors,
          `Response should not contain errors`
        ).toBeUndefined();

        const analytics = responseObj.data?.polygonStatistic?.analytics;
        expect(
          analytics,
          `Analytics object should be defined in polygonStatistic`
        ).toBeDefined();

        const advancedAnalytics = analytics?.advancedAnalytics;
        expect(
          advancedAnalytics,
          `Advanced analytics should be present in analytics`
        ).toBeDefined();

        for (const item of advancedAnalytics) {
          expect(
            item.numerator,
            `Numerator in advancedAnalytics (${item.numerator}) should be defined`
          ).toBeDefined();
          expect(
            item.numerator,
            `Numerator in advancedAnalytics (${item.numerator}) should be not null`
          ).not.toBeNull();
          expect(
            item.denominator,
            `Denominator in advancedAnalytics (${item.denominator})should be defined`
          ).toBeDefined();
          expect(
            item.denominator,
            `Denominator in advancedAnalytics (${item.denominator})should be not null`
          ).not.toBeNull();
          expect(
            item.numeratorLabel,
            `Numerator label in advancedAnalytics (${item.numeratorLabel}) should be defined`
          ).toBeDefined();
          expect(
            item.numeratorLabel,
            `Numerator label in advancedAnalytics (${item.numeratorLabel}) should be not null`
          ).not.toBeNull();
          expect(
            item.denominatorLabel,
            `Denominator label in advancedAnalytics (${item.denominatorLabel}) should be defined`
          ).toBeDefined();
          expect(
            item.denominatorLabel,
            `Denominator label in advancedAnalytics (${item.denominatorLabel}) should be not null`
          ).not.toBeNull();
          expect(
            item.resolution,
            `Resolution in advancedAnalytics (${item.resolution}) should be defined`
          ).toBeDefined();
          expect(
            item.resolution,
            `Resolution in advancedAnalytics (${item.resolution}) should be not null`
          ).not.toBeNull();
          expect(
            item.analytics,
            `Analytics array in advancedAnalytics should be an array`
          ).toBeInstanceOf(Array);
          expect(
            item.analytics.length,
            `Analytics array in advancedAnalytics (${item.analytics.length}) should not be empty`
          ).toBeGreaterThan(0);

          for (const analysis of item.analytics) {
            if (analysis.calculation !== `stddev`) {
              expect(
                analysis.value,
                `Value in analytics (${analysis.value}) should be defined`
              ).toBeDefined();
              expect(
                typeof analysis.value,
                `Value in analytics should be of type number`
              ).toBe(`number`);
              expect(
                analysis.value,
                `Value in analytics should be >= 0`
              ).toBeGreaterThanOrEqual(0);
              expect(
                analysis.calculation,
                `Calculation in analytics (${analysis.calculation}) should be defined`
              ).toBeDefined();
              expect(
                typeof analysis.calculation,
                `Value in calculation should be of type string`
              ).toBe(`string`);
              expect(
                analysis.quality,
                `Quality in analytics (${analysis.quality}) should be defined`
              ).toBeDefined();
              expect(
                typeof analysis.quality,
                `Value in quality should be of type number`
              ).toBe(`number`);
              expect(
                analysis.quality,
                `Quality in analytics should be >= 0`
              ).toBeGreaterThanOrEqual(0);
            }
          }
        }
      }
    );
  }
});
