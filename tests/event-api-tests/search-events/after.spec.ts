import { test, expect } from "@playwright/test";
import { searchEvents } from "../../helpers/event-api-profiler.ts";
import type { SearchEventApiResponse, ResponseInfo } from "../../helpers/types";

function checkSuccessfulResponse(
  responseInfo: ResponseInfo<SearchEventApiResponse>
) {
  expect(responseInfo.status, "Expect response status to be 200").toBe(200);
  expect(responseInfo.json, "Expect response to be valid JSON").toBeDefined();
}

function checkBadRequest(
  responseInfo: ResponseInfo<SearchEventApiResponse>,
  ExpectedError: string
) {
  expect(responseInfo.status, "Expect response status to be 400").toBe(400);
  expect(responseInfo.text, "Expect error body to match the reference").toBe(
    ExpectedError
  );
}

test("Check filtering events by 'after' param", async ({ request }) => {
  const feed = "pdc";
  // Get all events (e.g., limit 1000)
  const allEventsResp = await searchEvents({
    params: { feed, limit: 1000 },
    request,
    timeout: 10000,
  });
  checkSuccessfulResponse(allEventsResp);

  const allEvents = allEventsResp.json!.data;
  expect(
    allEvents.length,
    "Expect more than two events for correct test"
  ).toBeGreaterThan(2);

  // Take updatedAt from the middle of the list
  const midIdx = Math.floor(allEvents.length / 2);
  const after = allEvents[midIdx].updatedAt;

  // Make request with 'after'
  const filteredResp = await searchEvents({
    timeout: 10000,
    params: { feed, limit: 20, after },
    request,
  });
  checkSuccessfulResponse(filteredResp);

  const filteredEvents = filteredResp.json!.data;
  for (const event of filteredEvents) {
    expect(
      new Date(event.updatedAt).getTime(),
      `Expect lastUpdatedAt (${event.updatedAt}) >= after (${after})`
    ).toBeGreaterThanOrEqual(new Date(after).getTime());
  }
});

test.describe("Check pagination via 'after' param", () => {
  ["ASC", "DESC"].forEach((sortOrder) => {
    test(`Check pagination with sortOrder: ${sortOrder}`, async ({
      request,
    }) => {
      const feed = "pdc";
      const after = "2023-09-24T19:09:27Z";

      // First request — 1 event
      const resp1 = await searchEvents({
        timeout: 10000,
        params: { feed, limit: 1, after, sortOrder },
        request,
      });
      checkSuccessfulResponse(resp1);
      const data1 = resp1.json!.data;
      const nextAfter = resp1.json!.pageMetadata.nextAfterValue;

      // Second request — next event
      const resp2 = await searchEvents({
        timeout: 10000,
        params: { feed, limit: 1, after: nextAfter, sortOrder },
        request,
      });
      checkSuccessfulResponse(resp2);
      const data2 = resp2.json!.data;

      // Third request — 2 events at once
      const resp3 = await searchEvents({
        timeout: 10000,
        params: { feed, limit: 2, after, sortOrder },
        request,
      });
      checkSuccessfulResponse(resp3);
      const data3 = resp3.json!.data;

      // Check that events from resp1 and resp2 do not intersect
      for (const event1 of data1) {
        expect(
          data2,
          "Expect events from the first response not to be in the second"
        ).not.toContainEqual(event1);
      }
      // Both events should be in data3
      for (const event1 of data1) {
        expect(
          data3,
          "Expect event from the first response to be in the third"
        ).toContainEqual(event1);
      }
      for (const event2 of data2) {
        expect(
          data3,
          "Expect event from the second response to be in the third"
        ).toContainEqual(event2);
      }
    });
  });
});

test("Check error for invalid 'after' param", async ({ request }) => {
  const feed = "pdc";
  const after = "123456Z";
  const ExpectError =
    '{"status":"BAD_REQUEST","message":"Failed to convert value of type \'java.lang.String\' to required type \'java.time.OffsetDateTime\'; nested exception is org.springframework.core.convert.ConversionFailedException: Failed to convert from type [java.lang.String] to type [@io.swagger.v3.oas.annotations.Parameter @org.springframework.web.bind.annotation.RequestParam @org.springframework.format.annotation.DateTimeFormat java.time.OffsetDateTime] for value \'123456Z\'; nested exception is java.lang.IllegalArgumentException: Parse attempt failed for value [123456Z]","errors":["after should be of type java.time.OffsetDateTime"]}';

  const resp = await searchEvents({
    timeout: 10000,
    params: { feed, limit: 10, after },
    request,
  });
  checkBadRequest(resp, ExpectError);
});

test("Check error for invalid year in 'after' param", async ({ request }) => {
  const feed = "pdc";
  const after = "1000-04-12T23:20:50.52ZZ";
  // Expect error may differ, so just check status
  const resp = await searchEvents({
    timeout: 10000,
    params: { feed, limit: 10, after },
    request,
  });
  expect(resp.status, "Expect response status to be 400 for invalid year").toBe(
    400
  );
});
