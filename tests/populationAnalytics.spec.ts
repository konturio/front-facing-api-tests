import { test, expect } from "@playwright/test";
import { getApis, getJSON, getGraphqlQuery, sendGraphqlQuery } from "./helper";

const polygon = getJSON(`mayotte-polygon-variable`, { isRequest: true });

const queryDeadline = 30000;

const thermalSpotStatisticQuery = getGraphqlQuery("analyticsPopulation", {
  useGeojson: true,
});

const fieldsToCheck = ["population", "gdp", "urban"];

// test(`Check population statistics calculation`, async ({ request }) => {
//   const responseObj = await sendGraphqlQuery({
//     request,
//     url: process.env.GRAPHQL_ENDPOINT as string,
//     timeout: queryDeadline,
//     query: thermalSpotStatisticQuery,
//     polygon: JSON.stringify(polygon),
//   });

//   const stats = responseObj?.data?.polygonStatistic?.analytics?.population;
//   const statsV2 = responseObj?.data?.polygonStatistic?.analytics?.population;

//   await test.step(`Check that result for polygon and polygonV2 are similar`, async () => {
//     expect(stats).toStrictEqual(statsV2);
//   });

//   const fieldsToCheck = [`population`, `gdp`, `urban`];

//   for (const field of fieldsToCheck) {
//     await test.step(`Check ${field} is not null and >= 0`, async () => {
//       expect(stats[field]).toBeDefined();
//       expect(stats[field]).toBeGreaterThanOrEqual(0);
//       expect(stats[field]).not.toBeNull();
//     });
//   }

//   await test.step(`Check that not all the values are 0`, async () => {
//     const sum = Object.values(stats).reduce(
//       (acc: number, val: number) => acc + val,
//       0
//     );
//     expect(sum).not.toBe(0);
//   });
// });

// test(`Check population values are in expected range`, async ({ request }) => {
//   const responseObj = await sendGraphqlQuery({
//     request,
//     url: process.env.GRAPHQL_ENDPOINT as string,
//     timeout: queryDeadline,
//     query: thermalSpotStatisticQuery,
//     polygon: JSON.stringify(polygon),
//   });

//   const stats = responseObj?.data?.polygonStatistic?.analytics?.population;
//   const testData = {
//     population: 1000,
//     gdp: 500,
//     urban: 300,
//     polygon_area: 100,
//   };

//   if (testData.polygon_area && testData.polygon_area < 20) {
//     test.skip(`DB calculation is not accurate for small polygons`);
//   }

//   const fieldsToCheck = [`population`, `gdp`, `urban`];

//   for (const field of fieldsToCheck) {
//     await test.step(`Check ${field} is in expected range`, async () => {
//       if (stats[field] !== null && testData.polygon_area !== null) {
//         const rangeMin = testData[field] * 0.85;
//         const rangeMax = testData[field];

//         expect(
//           stats[field],
//           `${field} value differs from the expected one. Expected: ${testData[field]}, actual: ${stats[field]}, area: ${testData.polygon_area}`
//         ).toBeGreaterThanOrEqual(rangeMin);
//         expect(
//           stats[field],
//           `${field} value differs from the expected one. Expected: ${testData[field]}, actual: ${stats[field]}, area: ${testData.polygon_area}`
//         ).toBeLessThanOrEqual(rangeMax);
//       } else {
//         expect(
//           testData[field] === null || testData.polygon_area === null
//         ).toBeTruthy();
//       }
//     });
//   }
// });
