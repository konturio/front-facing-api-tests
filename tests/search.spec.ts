import { test, expect } from "@playwright/test";
import { APIRequestContext } from "@playwright/test";
import { getApis, getBody, Api } from "./helper";

type testSearchApiOptions = {
  searchApi: Api;
  request: APIRequestContext;
  query: string;
  expectedResponse: {};
  authToken?: string;
};

const searchApis = getApis(
  ["search oam", "search atlas", "search disaster-ninja", "search smart-city"],
  "search-apis"
);
const chicagoSearchResponse = getBody("chicago-search", { isRequest: false });

async function testSearchApi({
  searchApi,
  request,
  query,
  expectedResponse,
  authToken,
}: testSearchApiOptions) {
  expect(searchApi?.url, "Search API url should be defined").toBeDefined();
  const url = `${searchApi?.url}&query=${query}`;
  const response = await test.step(`Send GET request to ${url}`, async () =>
    await request.get(url, {
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : "",
      },
    }));
  expect(response.status(), "Response status should be 200").toEqual(200);
  const responseObj = await response.json();
  expect(responseObj, "Response should match expected geometry").toStrictEqual(
    expectedResponse
  );
}

// TODO: Consider adding a test for user with no rights after more features are added to the search API

searchApis.forEach((searchApi) => {
  test(
    `Get ${searchApi?.url} for Chicago area (guest)`,
    { tag: "@guest" },
    async ({ request }) => {
      test.fixme(
        searchApi.name === "search atlas",
        "Fix issue https://kontur.fibery.io/Tasks/Task/BE-Search-answers-200-ok-and-instead-of-401-for-request-with-no-auth-19793 to activate this test"
      );
      await testSearchApi({
        searchApi,
        request,
        query: "chicago",
        expectedResponse: chicagoSearchResponse,
      });
    }
  );
  test(
    `Get ${searchApi?.url} for Chicago area`,
    { tag: "@pro_user" },
    async ({ request }) => {
      await testSearchApi({
        searchApi,
        request,
        query: "chicago",
        expectedResponse: chicagoSearchResponse,
        authToken: process.env.ACCESS_TOKEN,
      });
    }
  );
});
