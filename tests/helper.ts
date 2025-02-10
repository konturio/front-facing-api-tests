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
      (acc, api: Api) => {
        if (api.env === environment) {
          acc[api.name] = api;
        }
        return acc;
      },
      {} as Record<string, Api>
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
): [] {
  try {
    const data = fs
      .readFileSync(
        path.join(
          __dirname,
          `./testsData/${isRequest ? "requestBodies" : "responseBodies"}/${fileName}.json`
        )
      )
      .toString();
    const requestBody = JSON.parse(data);
    return requestBody;
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
