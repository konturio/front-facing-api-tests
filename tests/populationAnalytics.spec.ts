import { test, expect } from "@playwright/test";
import { getApis, getJSON, getGraphqlQuery, sendGraphqlQuery } from "./helper";

const polygon = getJSON(`sicily-polygon`, { isRequest: true });

const queryDeadline = 30000;
const expectedMinPopulation = 5000000;
const expectedMaxPopulation = 10000000;
const expectedMinUrbanPopulation = 4000000;
const expectedMinGDP = 100000000000;

const populationQuery = getGraphqlQuery("analyticsPopulation", {
  useGeojson: true,
});

/**
 * Type representing population analytics data for a region
 * @property population - Total population count
 * @property gdp - Gross Domestic Product in USD
 * @property urban - Urban population count
 */

type PopulationAnalytics = {
  population: number;
  gdp: number;
  urban: number;
};

const fieldsToCheck = ["population", "gdp", "urban"];

test(`Check population statistics calculation in Sicily region`, async ({
  request,
}) => {
  const responseObj = await sendGraphqlQuery({
    request,
    url: process.env.GRAPHQL_ENDPOINT as string,
    timeout: queryDeadline,
    query: populationQuery,
    polygon: JSON.stringify(polygon),
  });

  const stats: PopulationAnalytics =
    responseObj?.data?.polygonStatistic?.analytics?.population;

  expect(
    stats,
    "Response should contain population analytics data"
  ).toBeDefined();

  for (const field of fieldsToCheck) {
    await test.step(`Check '${field}' field is not null and >= 0`, async () => {
      expect(stats[field], "Value should be defined").toBeDefined();
      expect(stats[field], "Value should be >= 0").toBeGreaterThanOrEqual(0);
      expect(stats[field], "Value should not be null").not.toBeNull();
      expect(
        Number.isFinite(stats[field]),
        "Value should be a finite number"
      ).toBeTruthy();
    });
  }

  await test.step(`Check that not all the values are 0`, async () => {
    const sum = Object.values(stats).reduce((acc: number, val: number) => {
      return acc + val;
    }, 0);
    expect(sum, "Sum of all values should be > 0").toBeGreaterThan(0);
  });

  await test.step(`Check values are in expected range`, async () => {
    expect(
      stats.population,
      `Population should adequate for Sicily region (>= ${expectedMinPopulation})`
    ).toBeGreaterThanOrEqual(expectedMinPopulation);
    expect(
      stats.population,
      `Population should be less then ${expectedMaxPopulation}`
    ).toBeLessThan(expectedMaxPopulation);
    expect(
      stats.urban,
      `Urban population should adequate for Sicily region (>= ${expectedMinUrbanPopulation})`
    ).toBeGreaterThanOrEqual(expectedMinUrbanPopulation);
    expect(
      stats.urban,
      `Urban population should be less then all population`
    ).toBeLessThan(stats.population);
    expect(
      stats.gdp,
      `Gross domestic product (GDP) should adequate for Sicily region (>= ${expectedMinGDP})`
    ).toBeGreaterThanOrEqual(expectedMinGDP);
  });
});
