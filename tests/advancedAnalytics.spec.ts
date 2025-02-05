import { test, expect } from "@playwright/test";
import { getApis, getJSON, getGraphqlQuery, sendGraphqlQuery } from "./helper";

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
  test.describe.configure({ retries: 0 });

  for (let i = 0; i <= queriesFilesWithGeojson.length - 1; i++) {
    test.describe(`Check ${queriesFilesWithGeojson[i]} endpoint to answer with valid data`, () => {
      test(
        `Check ${queriesFilesWithGeojson[i]} endpoint to answer with valid data`,
        { tag: `@guest` },
        async ({ request }) => {
          const responseObj = await sendGraphqlQuery({
            request,
            url: graphqlEndpointToTest.url,
            timeout: queryDeadline,
            query: graphqlQueriesWithGeojson[i],
            polygon: JSON.stringify(polygon),
          });

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
            test.step(`Check ${item.numerator}/${item.denominator} data in advancedAnalytics`, async () => {
              expect(
                item.numerator,
                `Numerator in advancedAnalytics (${item.numerator}) should be defined`
              ).toBeDefined();
              expect
                .soft(
                  item.numerator,
                  `Numerator in advancedAnalytics (${item.numerator}) should be not null`
                )
                .not.toBeNull();
              expect(
                item.denominator,
                `Denominator in advancedAnalytics (${item.denominator})should be defined`
              ).toBeDefined();
              expect
                .soft(
                  item.denominator,
                  `Denominator in advancedAnalytics (${item.denominator})should be not null`
                )
                .not.toBeNull();
              expect(
                item.numeratorLabel,
                `Numerator label in advancedAnalytics (${item.numeratorLabel}) should be defined`
              ).toBeDefined();
              expect
                .soft(
                  item.numeratorLabel,
                  `Numerator label in advancedAnalytics (${item.numeratorLabel}) should be not null`
                )
                .not.toBeNull();
              expect(
                item.denominatorLabel,
                `Denominator label in advancedAnalytics (${item.denominatorLabel}) should be defined`
              ).toBeDefined();
              expect
                .soft(
                  item.denominatorLabel,
                  `Denominator label in advancedAnalytics (${item.denominatorLabel}) should be not null`
                )
                .not.toBeNull();
              expect(
                item.resolution,
                `Resolution in advancedAnalytics (${item.resolution}) should be defined`
              ).toBeDefined();
              expect(
                item.analytics,
                `Analytics array in advancedAnalytics should be an array`
              ).toBeInstanceOf(Array);
              expect(
                item.analytics.length,
                `Analytics array in advancedAnalytics (${item.analytics.length}) should not be empty`
              ).toBeGreaterThan(0);

              for (const analysis of item.analytics) {
                await test.step(`Check ${analysis.calculation} object data in ${item.numerator}/${item.denominator} data in advancedAnalytics`, async () => {
                  if (analysis.calculation !== `stddev`) {
                    expect(
                      analysis.value,
                      `Value in analytics (${analysis.value}) should be defined`
                    ).toBeDefined();
                    expect
                      .soft(
                        typeof analysis.value,
                        `Value in analytics should be of type number`
                      )
                      .toBe(`number`);
                    expect
                      .soft(analysis.value, `Value in analytics should be >= 0`)
                      .toBeGreaterThanOrEqual(0);
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
                    expect
                      .soft(
                        typeof analysis.quality,
                        `Value in quality should be of type number`
                      )
                      .toBe(`number`);
                    expect
                      .soft(
                        analysis.quality,
                        `Quality in analytics should be >= 0`
                      )
                      .toBeGreaterThanOrEqual(0);
                  }
                });
              }
            });
          }
        }
      );
    });
  }
});
