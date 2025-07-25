import { test, expect } from "@playwright/test";
import {
  getPolygonsToTest,
  getGraphqlQuery,
  sendGraphqlQuery,
} from "../helpers/main-helper";
import type { Analytics } from "../helpers/types";

const polygons = getPolygonsToTest();
const queryDeadline = 60000;

const queriesFilesWithGeojson = [`advancedAnalytics`];

const graphqlQueriesWithGeojson = queriesFilesWithGeojson.map((query) =>
  getGraphqlQuery(query, { useGeojson: true })
);

for (const polygon of polygons) {
  const testedCountry = polygon.features[0].properties.ADMIN;
  test.describe(
    `Check advanced analytics responses in general (testing ${process.env.COUNTRIES_TO_TEST === "" ? "random country" : testedCountry})`,
    {
      annotation: {
        type: "country",
        description: `Area of ${testedCountry} is tested. To get geojson go to ${process.env.ALL_COUNTRIES_PATH} in ${process.env.REPO_NAME} repo`,
      },
      tag: "@fitsLoadTesting",
    },
    () => {
      test.describe.configure({ retries: 2 });

      for (let i = 0; i <= queriesFilesWithGeojson.length - 1; i++) {
        test(
          `Check ${queriesFilesWithGeojson[i]} endpoint to answer with valid data`,
          { tag: `@guest` },
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

                for (const analysis of item.analytics as Analytics[]) {
                  await test.step(`Check ${analysis.calculation} object data in ${item.numerator}/${item.denominator} data in advancedAnalytics`, async () => {
                    expect
                      .soft(
                        analysis.value,
                        `Value in analytics (${analysis.value}) should be defined`
                      )
                      .toBeDefined();

                    // TODO: adjust this tests after fixing https://kontur.fibery.io/Tasks/Task/insights-api-Nulls-in-value-and-quality,-median-is-on-20713

                    if (
                      // analysis.calculation !== `stddev`
                      // analysis.calculation !== `median`
                      false
                    ) {
                      expect
                        .soft(
                          typeof analysis.value,
                          `Value in analytics should be of type number`
                        )
                        .toBe(`number`);
                    }
                    expect
                      .soft(
                        analysis.calculation,
                        `Calculation in analytics (${analysis.calculation}) should be defined`
                      )
                      .toBeDefined();
                    expect
                      .soft(
                        typeof analysis.calculation,
                        `Value in calculation should be of type string`
                      )
                      .toBe(`string`);
                    expect
                      .soft(
                        analysis.quality,
                        `Quality in analytics (${analysis.quality}) should be defined`
                      )
                      .toBeDefined();

                    // TODO: adjust this tests after fixing https://kontur.fibery.io/Tasks/Task/insights-api-Nulls-in-value-and-quality,-median-is-on-20713

                    if (
                      // analysis.calculation !== `median`
                      false
                    ) {
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
                    if (analysis.value !== null) {
                      expect
                        .soft(
                          analysis.quality,
                          `${analysis.calculation.toUpperCase()} quality of layer ${item.numerator}/${item.denominator} should not be null when value is ${analysis.value}`
                        )
                        .not.toBeNull();
                    }
                  });
                }
              });
            }
          }
        );
      }
    }
  );
}
for (const polygon of polygons) {
  const testedCountry = polygon.features[0].properties.ADMIN;
  test.describe(
    `Advanced analytics extra tests (testing ${process.env.COUNTRIES_TO_TEST === "" ? "random country" : testedCountry})`,
    {
      annotation: {
        type: "country",
        description: `Area of ${testedCountry} is tested. To get geojson go to ${process.env.ALL_COUNTRIES_PATH} in ${process.env.REPO_NAME} repo`,
      },
      tag: "@fitsLoadTesting",
    },
    () => {
      test.describe.configure({ retries: 2 });
      test(`Every layer should have all calculations`, async ({ request }) => {
        const requiredCalcs = [
          "sum",
          "min",
          "max",
          "mean",
          "median",
          "stddev",
          // "min_quality",
        ];

        const responseObj = await sendGraphqlQuery({
          request,
          url: process.env.GRAPHQL_ENDPOINT as string,
          timeout: queryDeadline,
          query: graphqlQueriesWithGeojson[0],
          polygon: JSON.stringify(polygon),
        });

        for (const layer of responseObj?.data?.polygonStatistic?.analytics
          ?.advancedAnalytics) {
          const calculations = layer.analytics.map(
            (analyticsItem: Analytics) => analyticsItem.calculation
          );
          // calculations.push("min_quality");

          expect(
            calculations.sort(),
            `Layer ${layer.numerator}/${layer.denominator} should have all calculations`
          ).toStrictEqual(requiredCalcs.sort());
        }
      });

      test(`Analytics should be ordered by min quality`, async ({
        request,
      }) => {
        test.fixme(
          true,
          `This test found an issue in sorting, so waiting for https://kontur.fibery.io/Tasks/Task/Analytics-is-not-ordered-by-min-quality-20906 issue to be fixed to unblock it`
        );

        const responseObj = await sendGraphqlQuery({
          request,
          url: process.env.GRAPHQL_ENDPOINT as string,
          timeout: queryDeadline,
          query: graphqlQueriesWithGeojson[0],
          polygon: JSON.stringify(polygon),
        });

        let prevMinQuality = 0;

        for (const layer of responseObj.data.polygonStatistic.analytics
          .advancedAnalytics) {
          const qualities: [number] = layer.analytics.reduce(
            (acc: [number], arg: Analytics) => {
              const quality = arg.quality;
              if (quality !== null) {
                acc.push(Math.abs(quality));
              }
              return acc;
            },
            []
          );

          const currentMinQuality = Math.min(...qualities);

          if (typeof currentMinQuality === "number") {
            expect(
              currentMinQuality,
              `Layer with min_quality ${prevMinQuality} is displayed before layer with min_quality ${currentMinQuality}`
            ).toBeGreaterThanOrEqual(prevMinQuality);

            prevMinQuality = currentMinQuality;
          }
        }
      });

      test(`Reference layers should have non-null data`, async ({
        request,
      }) => {
        const responseObj = await sendGraphqlQuery({
          request,
          url: process.env.GRAPHQL_ENDPOINT as string,
          timeout: queryDeadline,
          query: graphqlQueriesWithGeojson[0],
          polygon: JSON.stringify(polygon),
        });

        const referenceLayers = [
          ["avg_elevation_gebco", "one"],
          ["avg_elevation_gebco", "area_km2"],
          ["view_count", "one"],
          ["view_count", "area_km2"],
          ["avg_slope_gebco", "area_km2"],
        ];

        let matchingLayers: any[] = [];

        for (const [numerator, denominator] of referenceLayers) {
          let matchingLayersCount = 0;
          matchingLayers =
            responseObj?.data?.polygonStatistic?.analytics?.advancedAnalytics.reduce(
              (acc, layer) => {
                if (
                  layer.numerator === numerator &&
                  layer.denominator === denominator
                ) {
                  acc.push(layer);
                  matchingLayersCount++;
                }
                return acc;
              },
              []
            );

          expect(
            matchingLayersCount,
            `${numerator}/${denominator} layer should be present in advancedAnalytics once`
          ).toBe(1);
        }

        for (const layer of matchingLayers) {
          expect(
            layer.analytics.some(
              (analyticsItem: Analytics) =>
                analyticsItem.value !== null || analyticsItem.quality !== null
            ),
            `Should find at least one analytics item in reference layer ${layer.numerator}/${layer.denominator} where value or quality is not null`
          ).toBeTruthy();
        }
      });
    }
  );
}
