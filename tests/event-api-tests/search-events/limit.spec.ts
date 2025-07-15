import { test, expect, APIRequestContext } from "@playwright/test";
import {
  EventApiURLBuilder,
  EventApiRequestsExecutor,
  ResponseInfo,
} from "../../helpers/event-api-profiler.ts";
import type { SearchEventApiResponse } from "../../helpers/types";

async function fetchEvents({
  limit,
  feed = "kontur-public",
  request,
}: {
  limit?: number | string;
  feed?: string;
  request: APIRequestContext;
}) {
  const params = { feed, ...(limit !== undefined && { limit }) };

  const testedURL = new EventApiURLBuilder()
    .setType("event api search")
    .setParams(params)
    .buildUrl();

  test.info().annotations.push({
    type: "tested url",
    description: testedURL.toString(),
  });

  const executor = new EventApiRequestsExecutor<SearchEventApiResponse>(
    process.env.ACCESS_TOKEN as string
  );

  const responseInfo = await executor
    .sendRequest({ url: testedURL, request, timeout: 10000 })
    .then((res) => res.getResponseInfo());

  return responseInfo;
}

function checkSuccessResponse(
  responseInfo: ResponseInfo<SearchEventApiResponse>,
  expectedMax: number,
  expectedMin = 1
) {
  expect(responseInfo.status, "Response status should be 200").toBe(200);
  expect(responseInfo.json, "Response should be valid JSON").toBeDefined();

  const actualLength = responseInfo.json!.data.length;
  expect(
    actualLength,
    `Expect number of events to be >= ${expectedMin}`
  ).toBeGreaterThanOrEqual(expectedMin);
  expect(
    actualLength,
    `Expect number of events to be <= ${expectedMax}`
  ).toBeLessThanOrEqual(expectedMax);
}

function checkBadRequest(
  responseInfo: ResponseInfo<SearchEventApiResponse>,
  expectedError: string
) {
  expect(responseInfo.status, "Response status should be 400").toBe(400);
  expect(responseInfo.text, "Error body should match").toBe(expectedError);
}

const testCases = [
  { limit: 500, description: "limit = 500", max: 500 },
  { limit: 1, description: "limit = 1", max: 1 },
  { limit: 1000, description: "limit = 1000", max: 1000 },
  { limit: 999, description: "limit = 999", max: 999 },
  { limit: undefined, description: "no limit (default)", max: 1000 },
];

testCases.forEach(({ limit, description, max }) => {
  test(`Check search events endpoint with ${description}`, async ({
    request,
  }) => {
    const responseInfo = await fetchEvents({ limit, request });
    checkSuccessResponse(responseInfo, max);
  });
});

// Negative tests
const expectedErrorMessageLower =
  '{"status":"BAD_REQUEST","message":"searchEvents.limit: must be greater than or equal to 1","errors":["EventResource searchEvents.limit: must be greater than or equal to 1"]}';
const expectedErrorMessageHigher =
  '{"status":"BAD_REQUEST","message":"searchEvents.limit: must be less than or equal to 1000","errors":["EventResource searchEvents.limit: must be less than or equal to 1000"]}';
const expectedErrorMessageAlphabet =
  '{"status":"BAD_REQUEST","message":"Failed to convert value of type \'java.lang.String\' to required type \'int\'; nested exception is java.lang.NumberFormatException: For input string: \\"ff\\"","errors":["limit should be of type int"]}';

test("Check search events endpoint with limit = 0 (bad request)", async ({
  request,
}) => {
  const responseInfo = await fetchEvents({ limit: 0, request });
  checkBadRequest(responseInfo, expectedErrorMessageLower);
});

test("Check search events endpoint with limit = -1 (bad request)", async ({
  request,
}) => {
  const responseInfo = await fetchEvents({ limit: -1, request });
  checkBadRequest(responseInfo, expectedErrorMessageLower);
});

test("Check search events endpoint with limit = 1001 (bad request)", async ({
  request,
}) => {
  const responseInfo = await fetchEvents({ limit: 1001, request });
  checkBadRequest(responseInfo, expectedErrorMessageHigher);
});

test("Check search events endpoint with limit = 'ff' (bad request)", async ({
  request,
}) => {
  const responseInfo = await fetchEvents({ limit: "ff", request });
  checkBadRequest(responseInfo, expectedErrorMessageAlphabet);
});
