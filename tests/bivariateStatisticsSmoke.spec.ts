import { test, expect } from "@playwright/test";
import { getApis, getJSON, getGraphqlQuery, sendGraphqlQuery } from "./helper";

const polygon = getJSON("mayotte-polygon-variable", { isRequest: true });

const queryDeadline = 45000;

const populationQuery = getGraphqlQuery("bivariateStatisticCorrelationRates", {
  useGeojson: true,
});

const getCorrelationRates = async (
  request: any,
  { validateResponse = false } = {}
) => {
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

test.describe(`Check bivariate statistics calculation for correlation rates`, () => {
  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext();
    test.step("Get correlation rates, cache response at server to speed up tests and provide basic validation of this response", async () => {
      await getCorrelationRates(request, { validateResponse: true });
    });
  });

  test("Check that each correlation is !== 0", async ({ request }) => {
    const correlationRates = await getCorrelationRates(request);

    const checkValue = (value: number, name: string) => {
      expect(
        Math.abs(value),
        `Absolute ${name} value (${value}) should be > 0`
      ).toBeGreaterThan(0);
      expect(
        value,
        `${name} value (${value}) should not be null`
      ).not.toBeNull();
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

    const correlationRates = await getCorrelationRates(request);

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

  test("Check that important layers are not grouped", async ({ request }) => {
    const correlationRates = await getCorrelationRates(request);

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
            expect(
              rate.x.parent,
              `Important layer ${layerStr} should not have parent in X axis`
            ).toBeNull();
          }
          if (JSON.stringify(rate.y.quotient) === layerStr) {
            expect(
              rate.y.parent,
              `Important layer ${layerStr} should not have parent in Y axis`
            ).toBeNull();
          }
        }
      });
    }
  });
});
