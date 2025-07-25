import { test, expect } from "@playwright/test";
import { getApis, getJSON } from "../helpers/main-helper";
import type { testSearchApiOptions } from "../helpers/types";

const searchApis = getApis(
  ["search oam", "search atlas", "search disaster-ninja", "search smart-city"],
  "search-apis"
);

const chicagoSearchResponse = getJSON({
  fileName: "chicago-search",
  fileFolder: "response-bodies",
});

async function testSearchApi({
  searchApi,
  request,
  query,
  expectedResponseBody,
  authToken,
  expectedStatus = 200,
}: testSearchApiOptions) {
  expect(searchApi?.url, "Search API url should be defined").toBeDefined();
  const url = `${searchApi.url}&query=${query}`;
  const response = await test.step(`Send GET request to ${url}`, async () =>
    await request.get(url, {
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : "",
      },
    }));
  const actualResponseStatus = response.status();
  expect(
    actualResponseStatus,
    `Response status should be ${expectedStatus}`
  ).toEqual(expectedStatus);
  if (actualResponseStatus === 200) {
    const responseObj = await response.json();
    expect(
      responseObj,
      "Response should match expected geometry"
    ).toStrictEqual(expectedResponseBody);
  } else {
    const responseTxt = await response.text();
    expect(responseTxt, `Response text should match expected text`).toEqual(
      expectedResponseBody
    );
  }
}

searchApis.forEach((searchApi) => {
  test(
    `Get ${searchApi?.url} for Chicago area (guest)`,
    { tag: "@guest" },
    async ({ request }) => {
      if (searchApi.name === "search atlas") {
        await testSearchApi({
          searchApi,
          request,
          query: "chicago",
          expectedStatus: 401,
          expectedResponseBody: `401 Unauthorized: \"unauthorized\"`,
        });
      } else {
        await testSearchApi({
          searchApi,
          request,
          query: "chicago",
          expectedResponseBody: chicagoSearchResponse,
        });
      }
    }
  );
  test(
    `Get ${searchApi?.url} for Chicago area (pro user)`,
    { tag: "@pro_user" },
    async ({ request }) => {
      await testSearchApi({
        searchApi,
        request,
        query: "chicago",
        expectedResponseBody: chicagoSearchResponse,
        authToken: process.env.ACCESS_TOKEN,
      });
    }
  );
  test(
    `Get ${searchApi?.url} with invalid token`,
    { tag: "@guest" },
    async ({ request }) => {
      await testSearchApi({
        searchApi,
        request,
        query: "chicago",
        expectedResponseBody: "",
        authToken: "Bearer invalid-token",
        expectedStatus: 401,
      });
    }
  );
  test(
    `Get ${searchApi?.url} for Chicago area (user with no rights)`,
    { tag: "@user_no_rights" },
    async ({ request }) => {
      if (searchApi.name === "search atlas") {
        await testSearchApi({
          searchApi,
          request,
          query: "chicago",
          expectedStatus: 401,
          expectedResponseBody: `401 Unauthorized: \"unauthorized\"`,
          authToken: process.env.ACCESS_TOKEN_USER_NO_RIGHTS,
        });
      } else {
        await testSearchApi({
          searchApi,
          request,
          query: "chicago",
          expectedResponseBody: chicagoSearchResponse,
          authToken: process.env.ACCESS_TOKEN_USER_NO_RIGHTS,
        });
      }
    }
  );
});
