import { test, expect } from "@playwright/test";
import { searchEvents } from "../../helpers/event-api-profiler.ts";
import type {
  SearchEventApiResponse,
  ResponseInfo,
} from "../../helpers/types.ts";

function isOverlaps(
  eventStart: string,
  eventEnd: string,
  intervalStart?: string,
  intervalEnd?: string
): boolean {
  const parse = (d: string) => new Date(d).getTime();
  if (!intervalStart || intervalStart === "..") {
    return parse(eventStart) <= parse(intervalEnd!);
  }
  if (!intervalEnd || intervalEnd === "..") {
    return parse(eventEnd) >= parse(intervalStart);
  }
  return (
    parse(eventStart) <= parse(intervalEnd) &&
    parse(intervalStart) <= parse(eventEnd)
  );
}

function checkSuccessfulResponse(
  responseInfo: ResponseInfo<SearchEventApiResponse>
) {
  expect(responseInfo.status, "Expect response status to be 200").toBe(200);
  expect(responseInfo.json, "Expect response to be valid JSON").toBeDefined();
}

function checkBadRequest(
  responseInfo: ResponseInfo<SearchEventApiResponse>,
  expectedError: string
) {
  expect(responseInfo.status, "Expect response status to be 400").toBe(400);
  expect(responseInfo.text, "Expect error message to match").toBe(
    expectedError
  );
}

test.describe.configure({ retries: 3 });

const feeds = ["micglobal", "kontur-public"];

test.describe("Test datetime filter: closed interval", () => {
  feeds.forEach((feed) => {
    test(`Should return only events that intersect with closed interval for feed '${feed}'`, async ({
      request,
    }) => {
      const dt_from = "2023-01-01T00:00:00Z";
      const dt_to = "2025-06-02T00:00:00Z";
      const params = { feed, datetime: `${dt_from}/${dt_to}` };
      const resp = await searchEvents({
        params,
        request,
        timeout: 50000,
      });
      checkSuccessfulResponse(resp);

      for (const event of resp.json!.data) {
        expect(
          isOverlaps(event.startedAt, event.endedAt, dt_from, dt_to),
          `Event [${event.startedAt} - ${event.endedAt}] must overlap with interval [${dt_from} - ${dt_to}]`
        ).toBe(true);
      }
    });
  });
});

test.describe("Test datetime filter: open-start interval", () => {
  feeds.forEach((feed) => {
    test(`Should return only events that intersect with open-start interval for feed '${feed}'`, async ({
      request,
    }) => {
      const dt_from = "..";
      const dt_to = "2025-06-02T00:00:00Z";
      const params = { feed, datetime: `${dt_from}/${dt_to}` };
      const resp = await searchEvents({
        params,
        request,
        timeout: 50000,
      });
      checkSuccessfulResponse(resp);

      for (const event of resp.json!.data) {
        expect(
          isOverlaps(event.startedAt, event.endedAt, undefined, dt_to),
          `Event [${event.startedAt} - ${event.endedAt}] must overlap with interval [.. - ${dt_to}]`
        ).toBe(true);
      }
    });
  });
});

test.describe("Test datetime filter: open-end interval", () => {
  feeds.forEach((feed) => {
    test(`Should return only events that intersect with open-end interval for feed '${feed}'`, async ({
      request,
    }) => {
      const dt_from = "2024-08-02T00:00:00Z";
      const dt_to = "..";
      const params = { feed, datetime: `${dt_from}/${dt_to}` };
      const resp = await searchEvents({
        params,
        request,
        timeout: 50000,
      });
      checkSuccessfulResponse(resp);

      for (const event of resp.json!.data) {
        expect(
          isOverlaps(event.startedAt, event.endedAt, dt_from, undefined),
          `Event [${event.startedAt} - ${event.endedAt}] must overlap with interval [${dt_from} - ..]`
        ).toBe(true);
      }
    });
  });
});

test("Test datetime filter: bare datetime (not an interval)", async ({
  request,
}) => {
  const dt = "2024-01-01T00:00:00Z";
  const params = { feed: "micglobal", datetime: dt };
  const resp = await searchEvents({
    params,
    request,
    timeout: 50000,
  });
  checkSuccessfulResponse(resp);

  for (const event of resp.json!.data) {
    expect(
      isOverlaps(event.startedAt, event.endedAt, dt, undefined),
      `Event [${event.startedAt} - ${event.endedAt}] must overlap with [${dt}]`
    ).toBe(true);
  }
});

test("Test datetime filter: invalid format returns error", async ({
  request,
}) => {
  const params = { feed: "micglobal", datetime: "xxx/123" };
  const expectedError =
    '{"status":"BAD_REQUEST","message":"Failed to convert value of type \'java.lang.String\' to required type \'io.kontur.eventapi.resource.dto.DateTimeRange\'; nested exception is org.springframework.core.convert.ConversionFailedException: Failed to convert from type [java.lang.String] to type [@io.swagger.v3.oas.annotations.Parameter @org.springframework.web.bind.annotation.RequestParam io.kontur.eventapi.resource.dto.DateTimeRange] for value \'xxx/123\'; nested exception is java.time.format.DateTimeParseException: Text \'xxx\' could not be parsed at index 0","errors":["datetime should be of type io.kontur.eventapi.resource.dto.DateTimeRange"]}';
  const resp = await searchEvents({
    params,
    request,
    timeout: 10000,
  });
  checkBadRequest(resp, expectedError);
});

test("Test datetime filter: swapped interval returns error", async ({
  request,
}) => {
  const params = {
    feed: "pdc",
    datetime: "2023-12-02T00:00:00Z/2023-12-01T00:00:00Z",
  };
  const expectedError =
    '{"status":"BAD_REQUEST","message":"Failed to convert value of type \'java.lang.String\' to required type \'io.kontur.eventapi.resource.dto.DateTimeRange\'; nested exception is org.springframework.core.convert.ConversionFailedException: Failed to convert from type [java.lang.String] to type [@io.swagger.v3.oas.annotations.Parameter @org.springframework.web.bind.annotation.RequestParam io.kontur.eventapi.resource.dto.DateTimeRange] for value \'2023-12-02T00:00:00Z/2023-12-01T00:00:00Z\'; nested exception is java.lang.IllegalArgumentException: range lower bound must be less than or equal to range upper bound","errors":["datetime should be of type io.kontur.eventapi.resource.dto.DateTimeRange"]}';
  const resp = await searchEvents({
    params,
    request,
    timeout: 10000,
  });
  checkBadRequest(resp, expectedError);
});

test("Test datetime filter: interval that does not intersect any event returns empty list", async ({
  request,
}) => {
  const feed = "micglobal";
  const dt = "2124-01-01T00:00:00Z";
  const params = { feed, limit: 1000, datetime: dt };
  const resp = await searchEvents({
    params,
    request,
    timeout: 50000,
  });

  expect(resp.status, "Expect response status to be 204 (no content)").toEqual(
    204
  );
  expect(resp.text.length, "Expect no events in response").toBe(0);
});
