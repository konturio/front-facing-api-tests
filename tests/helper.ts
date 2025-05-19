import fs from "fs";
import path from "path";
import { APIRequestContext, expect } from "@playwright/test";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: [
    ".env.playwright.local",
    ".env.playwright.production",
    ".env.playwright",
  ],
});

export type Api = {
  env: string;
  name: string;
  url: string;
  urlLargeImg?: string;
  appId?: string;
  expectedImgAddress?: string;
  expectedLargeImgAddress?: string;
  expectedNumImages?: number;
};

export type TestedGeojson = {
  type: string;
  features: {
    type: string;
    properties: { ADMIN: string; ISO_A3: string; timestamp: number };
    geometry: { type: string; coordinates: [] };
  }[];
};

export const countriesForWorkflow = getJSON({
  fileName: "countries-for-workflow",
  fileFolder: "lookup-data",
}) as string[];

export const countriesToTestArray = !!process.env
  .IS_TESTING_BUSINESS_COUNTRIES_IN_A_ROW_AT_INSIGHTS_API
  ? (countriesForWorkflow.map((country) => country.trim()) as string[])
  : process.env.COUNTRIES_TO_TEST?.split(",").map((country) => country.trim());

const bigCountries = new Set([
  "Russia",
  "United States",
  "Canada",
  "China",
  "Brazil",
  "Australia",
  "India",
  "Argentina",
  "Kazakhstan",
  "Algeria",
  "DR Congo",
  "Greenland",
  "Saudi Arabia",
  "Mexico",
  "Indonesia",
  "Sudan",
  "Libya",
  "Iran",
  "Mongolia",
  "Peru",
  "Chad",
  "Niger",
  "Angola",
  "Mali",
  "South Africa",
  "Colombia",
  "Ethiopia",
  "Bolivia",
  "Mauritania",
  "Egypt",
  "Tanzania",
  "Nigeria",
  "Venezuela",
  "Namibia",
  "Pakistan",
  "Mozambique",
  "Turkey",
  "Chile",
  "Zambia",
  "Myanmar",
  "Afghanistan",
  "South Sudan",
  "France",
  "Somalia",
  "Central African Republic",
  "Ukraine",
  "Madagascar",
  "Botswana",
  "Kenya",
  "Yemen",
  "Thailand",
  "Spain",
  "Turkmenistan",
  "Cameroon",
  "Papua New Guinea",
  "Sweden",
  "Uzbekistan",
  "Morocco",
  "Iraq",
  "Paraguay",
  "Zimbabwe",
  "Japan",
  "Germany",
  "Philippines",
  "Congo",
  "Finland",
  "Vietnam",
  "Malaysia",
  "Norway",
]);

/**
 * Get the list of APIs from a json file
 * @param apisNames The list of APIs names to get from the file.
 * @param fileName The name of the file containing the APIs
 * @returns An array of API objects
 */

export function getApis(apisNames: string[], fileName: string): Api[] {
  try {
    const data = fs
      .readFileSync(
        path.join(__dirname, `./tests-data/apis-to-test/${fileName}.json`)
      )
      .toString();

    const environment = process.env.ENVIRONMENT ?? "prod";
    const apis: Api[] = JSON.parse(data).reduce(
      (acc: Record<string, Api>, api: Api) => {
        if (api.env === environment) {
          acc[api.name] = api;
        }
        return acc;
      },
      {}
    );

    const apisToTest = apisNames.map((name) => apis[name]);
    return apisToTest;
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Get information from a JSON file
 * @param fileName The name of the file
 * @param fileFolder The folder where the file is located
 * @returns JS object or an array of strings
 */

export function getJSON({
  fileName,
  fileFolder,
}: {
  fileName: string;
  fileFolder: "request-bodies" | "response-bodies" | "lookup-data";
}): Record<string, {}> | string[] {
  try {
    const partialPath = `./tests-data/${fileFolder}/${fileName}.json`;
    const data = fs.readFileSync(path.join(__dirname, partialPath)).toString();
    const json = JSON.parse(data);
    return json;
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Get graphql query from test data files
 * @param fileName The name of the file containing graphql query
 * @param useGeojson Does your query use geojson or not
 */

export function getGraphqlQuery(
  fileName: string,
  { useGeojson }: { useGeojson: boolean }
): string {
  try {
    const data = fs
      .readFileSync(
        path.join(
          __dirname,
          `./tests-data/request-bodies/graphql-queries/${useGeojson ? "insights-api-geojson" : "insights-api-no-geojson"}/${fileName}.graphql`
        )
      )
      .toString();
    return data;
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * This function sends graphql query with POST request and expects server to answer 200
 * @param object object with playwright request, url to send request to, request timeout, graphql query and polygon to use
 * @returns json format of response
 */

export async function sendGraphqlQuery({
  request,
  url,
  timeout,
  query,
  polygon,
}: {
  request: APIRequestContext;
  url: string;
  timeout: number;
  query: string;
  polygon?: string;
}) {
  const response = await request.post(url, {
    data: {
      query,
      variables: {
        polygon,
      },
    },
    timeout,
  });
  expect(response.status(), `POST request to ${url} should return 200`).toEqual(
    200
  );
  const responseObj = await response.json();
  return responseObj;
}

/**
 * This function returns a random country business is interested in from the list of countries
 * @param notBigCountry - Whether to return a random country from the whole list of countries or from the list of countries excluding big countries
 * @returns a JS object as a random country geometry
 */

function getRandomBusinessCountryJSON({
  notBigCountry,
}: {
  notBigCountry: boolean;
}) {
  try {
    const allCountries = getJSON({
      fileName: "all-countries",
      fileFolder: "request-bodies",
    }) as TestedGeojson;

    const businessCountries = new Set(
      getJSON({
        fileFolder: "lookup-data",
        fileName: "business-countries",
      }) as string[]
    );

    const filteredFeatures = allCountries.features
      .filter((geom) => businessCountries.has(geom.properties.ADMIN))
      .filter(
        (geom) => !notBigCountry || !bigCountries.has(geom.properties.ADMIN)
      );
    const randomCountry =
      filteredFeatures[Math.floor(Math.random() * filteredFeatures.length)];

    // To avoid caching on server
    randomCountry.properties.timestamp = Date.now();
    return {
      type: "FeatureCollection",
      features: [randomCountry],
    } as TestedGeojson;
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * This function returns an array of geojson objects with features filtered by admin names.
 * @param adminNames an array of admin names to filter the features by. If no admin names are provided, it returns all features. Example of an array: ["Afghanistan","Angola"]
 * @returns an array of geojson objects with features filtered by admin names
 */

export function getArrayOfCountriesJSONs(
  adminNames: string[] = getJSON({
    fileName: "admin-names",
    fileFolder: "lookup-data",
  }) as string[]
): TestedGeojson[] {
  const allCountries = getJSON({
    fileName: "all-countries",
    fileFolder: "request-bodies",
  }) as TestedGeojson;
  // Filter out features that don't match the admin names
  const filteredFeatures = allCountries.features.filter((geom) =>
    adminNames.includes(geom.properties.ADMIN)
  );
  // Create an array of TestedGeojson objects with the filtered features to return
  const result = filteredFeatures.map((feature) => {
    // To avoid caching on server
    feature.properties.timestamp = Date.now();
    return {
      type: "FeatureCollection",
      features: [feature],
    };
  });
  return result;
}

/**
 * This function returns an array of geojson objects depending on the country selection type
 * @returns an array of geojson objects
 */

export function getPolygonsToTest() {
  if (
    (process.env.COUNTRIES_TO_TEST?.length as number) > 0 ||
    process.env.IS_TESTING_BUSINESS_COUNTRIES_IN_A_ROW_AT_INSIGHTS_API
  ) {
    return getArrayOfCountriesJSONs(countriesToTestArray);
  } else {
    // TO DO: don't filter out big countries and set business countries instead once the task for big areas in insigths api is done
    return [getRandomBusinessCountryJSON({ notBigCountry: true })];
  }
}
