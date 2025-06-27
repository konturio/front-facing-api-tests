import { test, expect, APIRequestContext } from "@playwright/test";
import { getApis } from "../helper";
import type { AxisData, TestAxisOptions } from "../types";

const [axisDataToGet] = getApis(["axis"], "axis");

if (!axisDataToGet) {
  throw new Error(
    `Axis API definition for current environment is missing in tests-data/apis-to-test/axis.json`
  );
}

/**
 * This function is used to test the axis API
 * @param obj - object with request, expectedStatus, expectValidity, minQuality, and expectedError properties. If expectValidity is true, the function checks if the response is valid. If expectValidity is false, the function checks if the response is kind of invalid and controls the error message got. If minQuality is defined, the function checks if the response has no quotations with quality less than specified filter.
 * @returns void
 */
const testAxis = async function ({
  request,
  expectedStatus,
  expectValidity,
  minQuality,
  expectedError,
}: TestAxisOptions): Promise<void> {
  const url =
    minQuality != null
      ? `${axisDataToGet.url}?minQuality=${minQuality}`
      : axisDataToGet.url;
  test.info().annotations.push({
    type: `Tested url`,
    description: url,
  });
  const response = await request.get(url);
  expect(response.status(), `Axis should answer ${expectedStatus}`).toEqual(
    expectedStatus
  );
  if (expectValidity) {
    const responseObj = (await response.json()) as AxisData;
    // if we get valid response, we can expect minQuality to be only number
    const validMinQuality = typeof minQuality === "number" ? minQuality : 0;
    // get all quotients from response to operate on them later for general checks + check other data in response
    const actualQuotients: string[] = [];
    for (const axis of responseObj) {
      const actualQuotient = JSON.stringify(axis.quotient);
      expect(
        actualQuotient,
        `Quotient (${actualQuotient}) should be defined`
      ).toBeDefined();
      await test.step(`Check quotient (${actualQuotient}) steps values`, async () => {
        const zeroValuesNumber = axis.steps.reduce(
          (zeroCount: number, step) => {
            const value = step.value;
            expect
              .soft(
                value,
                `Step value (${value}) should be defined for ${actualQuotient}`
              )
              .toBeDefined();
            expect
              .soft(
                Number.isFinite(value),
                `Step value (${value}) should be finite for ${actualQuotient}`
              )
              .toBeTruthy();
            expect
              .soft(
                value,
                `Step value (${value}) should not be null for ${actualQuotient}`
              )
              .not.toBeNull();
            expect
              .soft(
                step.label,
                `Step label (${step.label}) should be defined for ${actualQuotient}`
              )
              .toBeDefined();
            if (value === 0) zeroCount++;
            return zeroCount;
          },
          0
        );
        expect
          .soft(
            zeroValuesNumber,
            `Steps with values === 0 number (${zeroValuesNumber}) should be less than steps number (${axis.steps.length})`
          )
          .toBeLessThan(axis.steps.length);
      });
      await test.step(`Check quotient (${actualQuotient}) dataset stats values`, async () => {
        Object.entries(axis.datasetStats).forEach(([key, value]) => {
          expect
            .soft(
              value,
              `Dataset stats for ${key} with value (${value}) should be defined`
            )
            .toBeDefined();
          expect
            .soft(
              Number.isFinite(value),
              `Dataset stats for ${key} with value (${value}) should be finite`
            )
            .toBeTruthy();
          expect
            .soft(
              value,
              `Dataset stats for ${key} with value (${value}) should not be null`
            )
            .not.toBeNull();
          expect
            .soft(
              key,
              `Dataset stats for ${key} with key (${key}) should be defined`
            )
            .toBeDefined();
        });
      });
      await test.step(`Check quotient (${actualQuotient}) transformation values`, async () => {
        Object.entries(axis.transformation).forEach(([key, value]) => {
          if (key === "transformation") {
            const name = value as string;
            expect
              .soft(name, `Transformation name should be defined`)
              .toBeDefined();
            expect
              .soft(
                name.length,
                `Transformation name length should be more than 0`
              )
              .toBeGreaterThan(0);
            return;
          }
          expect
            .soft(
              value,
              `Transformation for ${key} with value (${value}) should be defined`
            )
            .toBeDefined();
          expect
            .soft(
              Number.isFinite(value as number),
              `Transformation for ${key} with value (${value}) should be finite`
            )
            .toBeTruthy();
          expect
            .soft(
              value,
              `Transformation for ${key} with value (${value}) should not be null`
            )
            .not.toBeNull();
          expect
            .soft(
              key,
              `Transformation for ${key} with key (${key}) should be defined`
            )
            .toBeDefined();
        });
        expect
          .soft(
            axis.quality,
            `Quality should be filtered by minQuality (${validMinQuality})`
          )
          .toBeGreaterThanOrEqual(validMinQuality);
        expect
          .soft(axis.quality, `Quality should be adequate (less than 1)`)
          .toBeLessThanOrEqual(1);
      });
      await test.step(`Check quotients (${actualQuotient}) description data`, async () => {
        const quotients = axis.quotients;
        const quotientsToBeDescribed = JSON.parse(
          actualQuotient
        ) as (typeof axis)["quotient"];
        expect(
          quotients,
          `Quotients description data should be defined`
        ).toBeDefined();
        expect(
          quotients.length,
          `Quotients description data should describe exactly 2 quotients`
        ).toBe(2);
        for (let i = 0; i < quotients.length; i++) {
          expect(
            quotients[i].name,
            `Quotient name should be defined`
          ).toBeDefined();
          expect
            .soft(
              quotients[i].name,
              `Quotient name should be ${quotientsToBeDescribed[i]}`
            )
            .toBe(quotientsToBeDescribed[i]);

          expect(
            quotients[i]["label"],
            `Quotient label of ${quotients[i].name} should be defined`
          ).toBeDefined();
          expect(
            quotients[i]["label"].length,
            `Quotient label length should be longer than 0`
          ).toBeGreaterThanOrEqual(1);

          expect(
            quotients[i].maxZoom,
            `Quotient max zoom of ${quotients[i].name} should be defined`
          ).toBeDefined();
          // max zoom can be logically less than 24 (like at Azure Maps)
          expect(
            quotients[i].maxZoom,
            `Quotient max zoom of ${quotients[i].name} should be less than or equal to 24 (for example, max zoom at Azure Maps)`
          ).toBeLessThanOrEqual(24);
          expect(
            quotients[i].maxZoom,
            `Quotient max zoom of ${quotients[i].name} should be greater than 3 according to basic logic`
          ).toBeGreaterThan(3);

          expect(
            quotients[i].description,
            `Quotient description of ${quotients[i].name} should be defined`
          ).toBeDefined();

          expect
            .soft(
              quotients[i].copyrights[0],
              `Quotient copyrights of ${quotients[i].name} should have at least one copyrights info`
            )
            .toBeDefined();
          quotients[i].copyrights.forEach((copyright) => {
            expect
              .soft(
                copyright.length,
                `Quotient copyrights of ${quotients[i].name} should be a text with length greater than 0 for each copyright`
              )
              .toBeGreaterThan(0);
          });

          const directions = quotients[i].direction;
          expect(
            directions,
            `Quotient direction of ${quotients[i].name} should be defined`
          ).toBeDefined();
          directions.flat().forEach((direction) => {
            expect
              .soft(
                direction,
                `Quotient direction of ${quotients[i].name} should be defined`
              )
              .toBeDefined();
            expect
              .soft(
                direction.length,
                `Quotient direction of ${quotients[i].name} should be a text with length greater than 0 for each direction`
              )
              .toBeGreaterThan(0);
          });

          Object.entries(quotients[i].unit).forEach(([key, value]) => {
            const expectedKeys = ["id", "shortName", "longName"];
            const keyValidity = expectedKeys.includes(key);
            expect
              .soft(
                keyValidity,
                `Quotient unit key (${key}) of ${quotients[i].name} should be one of ${expectedKeys.join(", ")}`
              )
              .toBeTruthy();
            expect
              .soft(
                value,
                `Unit data value of ${key} of ${quotients[i].name} should be defined (${value})`
              )
              .toBeDefined();
            // TODO: enable this check once https://kontur.fibery.io/Tasks/Task/Axis-API-unit-has-null-in-id,-shortName-and-longName-fields-21888 is fixed
            // expect
            //   .soft(
            //     value.length,
            //     `Unit data value of ${key} of ${quotients[i].name} should be a text with length greater than 0 (${value})`
            //   )
            //   .toBeGreaterThan(0);
          });
        }
      });
      actualQuotients.push(actualQuotient);
    }
    const isBasicAxisIncluded = actualQuotients.includes(
      `["population","area_km2"]`
    );
    if (validMinQuality !== 1) {
      expect(
        isBasicAxisIncluded,
        `Axis should include basic axis (population, area_km2)`
      ).toBeTruthy();
    }
    const uniqueQuotients = [...new Set(actualQuotients)];
    expect(
      actualQuotients.sort(),
      `Expect response with axis to have only unique axes`
    ).toStrictEqual(uniqueQuotients.sort());
  } else {
    const responseObj = (await response.text()) as string;
    expect(responseObj, `Expect response to contain specific error`).toContain(
      expectedError
    );
  }
};

test.describe(`Testing axis`, () => {
  test(`Testing axis with minQuality = 0.5 filter`, async ({ request }) => {
    await testAxis({
      request: request,
      expectedStatus: 200,
      expectValidity: true,
      minQuality: 0.5,
    });
  });
  test(`Testing axis with minQuality = 1 filter`, async ({ request }) => {
    await testAxis({
      request: request,
      expectedStatus: 200,
      expectValidity: true,
      minQuality: 1,
    });
  });
  test(`Testing axis with minQuality = 0.9 filter`, async ({ request }) => {
    await testAxis({
      request: request,
      expectedStatus: 200,
      expectValidity: true,
      minQuality: 0.9,
    });
  });

  test(`Negative case: testing axis with minQuality = 1.1 filter`, async ({
    request,
  }) => {
    await testAxis({
      request: request,
      expectedStatus: 200,
      expectValidity: false,
      minQuality: 1.1,
      expectedError: "[]",
    });
  });
  test(`Negative case: testing axis with minQuality = abc filter`, async ({
    request,
  }) => {
    await testAxis({
      request: request,
      expectedStatus: 400,
      expectValidity: false,
      minQuality: "abc",
      expectedError:
        "Invalid value 'abc' for parameter 'minQuality'. Expected type: Double",
    });
  });
});
