import { test, expect } from "@playwright/test";
import {
  getPolygonsToTest,
  getGraphqlQuery,
  sendGraphqlQuery,
} from "../helper";
import type { TestedGeojson } from "../helper";

const polygons = getPolygonsToTest();
const queryDeadline = 60000;

// const correlationRateEdge = 0.75;

const populationQuery = getGraphqlQuery("bivariateStatisticCorrelationRates", {
  useGeojson: true,
});

const getCorrelationRates = async (
  request: any,
  polygon: TestedGeojson,
  { validateResponse = false } = {}
) => {
  test.fixme(
    true,
    "Fix https://kontur.fibery.io/Tasks/Task/21318 to activate this test. Correlation rates array length === 0 takes place sometimes."
  );
  const responseObj = await sendGraphqlQuery({
    request,
    url: process.env.GRAPHQL_ENDPOINT as string,
    timeout: queryDeadline,
    query: populationQuery,
    polygon: JSON.stringify(polygon),
  });

  if (validateResponse) {
    const stats = responseObj?.data?.polygonStatistic?.bivariateStatistic;
    expect(stats, "Response should contain bivariate statistics").toBeDefined();
    const correlationRates = stats.correlationRates;
    expect(
      correlationRates.length,
      "Correlation rates length should be > 0"
    ).toBeGreaterThan(0);
  }

  return responseObj?.data?.polygonStatistic?.bivariateStatistic
    .correlationRates;
};
for (const polygon of polygons) {
  const testedCountry = polygon.features[0].properties.ADMIN;
  test.describe(
    `Check bivariate statistics calculation for correlation rates (testing ${process.env.COUNTRIES_TO_TEST === "" ? "random country" : testedCountry})`,
    {
      annotation: {
        type: "country",
        description: `Area of ${testedCountry} is tested. To get geojson go to ${process.env.ALL_COUNTRIES_PATH} in ${process.env.REPO_NAME} repo`,
      },
      tag: "@fitsLoadTesting",
    },
    () => {
      test.beforeEach(async ({ playwright }) => {
        const request = await playwright.request.newContext();
        test.step("Get correlation rates, cache response at server to speed up tests and provide basic validation of this response", async () => {
          await getCorrelationRates(request, polygon, {
            validateResponse: true,
          });
        });
      });

      test(`Check that each correlation rate is !== 0`, async ({ request }) => {
        const correlationRates = await getCorrelationRates(request, polygon);

        const checkValue = (value: number, name: string) => {
          expect
            .soft(
              Math.abs(value),
              `Absolute ${name} value (${value}) should be > 0`
            )
            .toBeGreaterThan(0);
          expect
            .soft(value, `${name} value (${value}) should not be null`)
            .not.toBeNull();

          // skip this check as for now, more: https://konturio.slack.com/archives/C037ZB1Q53P/p1740141589753499?thread_ts=1739975996.201389&cid=C037ZB1Q53P and https://kontur.fibery.io/Tasks/Task/Correlations-0.75-take-place-20954
          // if (name === "correlation") {
          //   expect
          //     .soft(
          //       value,
          //       `${name} value (${value}) should be > ${correlationRateEdge}`
          //     )
          //     .toBeGreaterThan(correlationRateEdge);
          // }
        };

        for (let i = 0; i < correlationRates.length; i++) {
          const rate = correlationRates[i];
          const values = [
            { value: rate.rate, name: "rate" },
            { value: rate.quality, name: "quality" },
            { value: rate.correlation, name: "correlation" },
            { value: rate.avgCorrelationX, name: "avgCorrelationX" },
            { value: rate.avgCorrelationY, name: "avgCorrelationY" },
          ];

          for (const { value, name } of values) {
            test.step(`Check ${name} value for rate №${i + 1}`, () => {
              checkValue(value, name);
            });
          }
        }
      });

      test("Check that layers are not duplicated", async ({ request }) => {
        test.fixme(
          true,
          `This test found an issue https://kontur.fibery.io/Tasks/Task/Quotients-pairs-are-not-unique-in-bivariate-statistics-correlation-rates-20918 , activate the test once the issue is fixed`
        );

        const correlationRates = await getCorrelationRates(request, polygon);

        const getAllLayers = (axis: "x" | "y") => {
          return correlationRates.reduce((acc: string[], curr) => {
            if (curr[axis].parent) {
              acc.push(
                JSON.stringify(curr[axis].parent),
                JSON.stringify(curr[axis].quotient)
              );
            } else {
              acc.push(JSON.stringify(curr[axis].quotient));
            }
            return acc;
          }, []);
        };

        const xLayers = getAllLayers("x");
        const yLayers = getAllLayers("y");

        expect
          .soft(xLayers.length, `X layers should have no duplicates`)
          .toBe(new Set(xLayers).size);
        expect
          .soft(yLayers.length, `Y layers should have no duplicates`)
          .toBe(new Set(yLayers).size);
      });

      test("Check that important layers are not grouped", async ({
        request,
      }) => {
        const correlationRates = await getCorrelationRates(request, polygon);

        const importantLayers = [
          ["count", "area_km2"],
          ["building_count", "area_km2"],
          ["highway_length", "area_km2"],
          ["local_hours", "area_km2"],
          ["avgmax_ts", "one"],
          ["days_mintemp_above_25c_1c", "one"],
          ["population", "area_km2"],
          ["total_hours", "area_km2"],
          ["view_count", "area_km2"],
          ["pop_over_65_total", "area_km2"],
          ["pop_not_well_eng_speak", "populated_area_km2"],
        ];

        for (const layer of importantLayers) {
          const layerStr = JSON.stringify(layer);

          test.step(`Check ${layerStr} quotient pair for parents`, () => {
            for (const rate of correlationRates) {
              if (JSON.stringify(rate.x.quotient) === layerStr) {
                expect
                  .soft(
                    rate.x.parent,
                    `Important layer ${layerStr} should not have parent in X axis`
                  )
                  .toBeNull();
              }
              if (JSON.stringify(rate.y.quotient) === layerStr) {
                expect
                  .soft(
                    rate.y.parent,
                    `Important layer ${layerStr} should not have parent in Y axis`
                  )
                  .toBeNull();
              }
            }
          });
        }
      });
    }
  );
}
