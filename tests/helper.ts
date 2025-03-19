import fs from "fs";
import path from "path";
import { APIRequestContext, expect } from "@playwright/test";

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

type TestedGeojson = {
  type: string;
  features: {
    type: string;
    properties: { ADMIN: string; ISO_A3: string };
    geometry: { type: string; coordinates: [] };
  }[];
};

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
        path.join(__dirname, `./testsData/apisToTest/${fileName}.json`)
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
 * Get the request/response body from a JSON file
 * @param fileName The name of the file containing the request/response body
 * @param isRequest Whether the body is a request body or a response body. Defaults to `true` (request body) if not specified
 * @returns The request body as a JS object
 */

export function getJSON(
  fileName: string,
  { isRequest }: { isRequest: boolean }
): {} {
  try {
    const data = fs
      .readFileSync(
        path.join(
          __dirname,
          `./testsData/${isRequest ? "requestBodies" : "responseBodies"}/${fileName}.json`
        )
      )
      .toString();
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
          `./testsData/requestBodies/graphqlQueries/${useGeojson ? "insights-api-geojson" : "insights-api-no-geojson"}/${fileName}.graphql`
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
 * This function returns a random country from the list of countries
 * @param notBigCountry - Whether to return a random country from the whole list of countries or from the list of countries excluding big countries
 * @returns a JS object as a random country geometry
 */

export function getRandomCountryJSON({
  notBigCountry,
}: {
  notBigCountry: boolean;
}) {
  try {
    const allCountries = getJSON("all-countries", {
      isRequest: true,
    }) as TestedGeojson;
    const filteredCountries = allCountries.features.filter(
      (geom) => !notBigCountry || !bigCountries.has(geom.properties.ADMIN)
    );

    const randomCountry =
      filteredCountries[Math.floor(Math.random() * filteredCountries.length)];
    return {
      type: "FeatureCollection",
      features: [randomCountry],
    } as TestedGeojson;
  } catch (error) {
    throw new Error(error);
  }
}
