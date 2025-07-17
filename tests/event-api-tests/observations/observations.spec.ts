import { test, expect, APIRequestContext } from "@playwright/test";
import {
  EventApiURLBuilder,
  EventApiRequestsExecutor,
  searchEvents,
} from "../../helpers/event-api-profiler.ts";
import type { RawDataResponse } from "../../helpers/types";

async function fetchFirstObservationId(
  request: APIRequestContext
): Promise<string> {
  const responseInfo = await searchEvents({
    request,
    params: { feed: "pdc", limit: 1 },
    timeout: 10000,
  });
  expect(
    responseInfo.status,
    `Expect response status to be 200 for search request`
  ).toBe(200);
  const firstEvent = responseInfo.json?.data?.[0];
  const firstObservationId = firstEvent?.observations?.[0];
  expect(firstObservationId, "ObservationId should be defined").toBeDefined();
  return firstObservationId!;
}

async function fetchRawDataByObservationId({
  observationId,
  request,
}: {
  observationId: string;
  request: APIRequestContext;
}) {
  const url = new EventApiURLBuilder()
    .setType("event api raw data (observations)")
    .setExtraPath(`${observationId}`)
    .buildUrl();

  const executor = new EventApiRequestsExecutor<RawDataResponse>(
    process.env.ACCESS_TOKEN as string
  );
  const responseInfo = await executor
    .sendRequest({ url, request, timeout: 10000 })
    .then((res) => res.getResponseInfo());

  return responseInfo;
}

test("Assert existing valid observation id fits the expected format", async ({
  request,
}) => {
  const observationId = await fetchFirstObservationId(request);
  const responseInfo = await fetchRawDataByObservationId({
    observationId,
    request,
  });
  expect(responseInfo.status, `Expect response status to be 200`).toBe(200);
  const responseObj = responseInfo.json as RawDataResponse;
  expect(responseObj, `Expect response to be valid JSON`).toBeDefined();
  for (const key of Object.keys(responseObj)) {
    const responseValue = responseObj[key];
    expect(
      responseValue,
      `Expect key ${key} to be defined in the response of observation request`
    ).toBeDefined();
    if (responseValue?.length)
      expect(
        responseValue.length,
        `Expect key ${key} to be not empty`
      ).toBeGreaterThan(0);
  }
  for (const snsKey of Object.keys(responseObj.Sns)) {
    const snsValue = responseObj.Sns[snsKey];
    expect(
      snsValue,
      `Expect key ${snsKey} to be defined in Sns in the response of observation request with value ${snsValue}`
    ).toBeDefined();
    if (snsValue?.length)
      expect(
        snsValue.length,
        `Expect length of value of ${snsKey} to be greater than 0`
      ).toBeGreaterThan(0);
  }
});

test("Assert invalid observation_id returns error", async ({ request }) => {
  const invalidObservationId = "qweqweqweqweqweqweqweqwe";
  const responseInfo = await fetchRawDataByObservationId({
    observationId: invalidObservationId,
    request,
  });
  expect(responseInfo.status, `Expect response status to be 400`).toBe(400);
  expect(
    responseInfo.text,
    `Expect error message to contain 'Failed to convert value of type'`
  ).toContain(
    "Failed to convert value of type 'java.lang.String' to required type 'java.util.UUID'"
  );
});

test("Assert not existing valid observation_id not returns data", async ({
  request,
}) => {
  const notExistingObservationId = "66e666d6-b666-66eb-b6e6-66bf666666c6";
  const responseInfo = await fetchRawDataByObservationId({
    observationId: notExistingObservationId,
    request,
  });
  expect(responseInfo.status, `Expect response status to be 404`).toBe(404);
  expect(responseInfo.text, `Expect response text to be empty`).toBe("");
});

test("Empty observation id return error", async ({ request }) => {
  const responseInfo = await fetchRawDataByObservationId({
    observationId: "",
    request,
  });
  expect(responseInfo.status, `Expect response status to be 404`).toBe(404);
  expect(
    responseInfo.text,
    `Expect error message to contain 'Not Found'`
  ).toContain("Error 404 Not Found");
});
