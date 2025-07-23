import { test, expect } from "@playwright/test";
import { searchEvents } from "../../helpers/event-api-profiler.ts";
import type {
  SearchEventApiResponse,
  ResponseInfo,
  Severities,
} from "../../helpers/types";

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
  expect(responseInfo.text, "Expect error body to match").toBe(expectedError);
}

const feeds = ["kontur-public", "pdc", "micglobal"];

feeds.forEach((feed) => {
  test.describe(`Check severity filter for feed '${feed}'`, () => {
    test("Check returning events with episodes of selected severity", async ({
      request,
    }) => {
      // Get all events with a big limit
      const allEventsResp = await searchEvents({
        params: { feed, limit: 1000 },
        request,
        timeout: 20000,
      });
      checkSuccessfulResponse(allEventsResp);

      const allEvents = allEventsResp.json!.data;
      const allSeverities = new Set<Severities[number]>();
      for (const event of allEvents) allSeverities.add(event.severity);

      for (const severity of allSeverities) {
        const resp = await searchEvents({
          params: { feed, severities: [severity], limit: 1000 },
          request,
          timeout: 20000,
        });
        checkSuccessfulResponse(resp);

        const events = resp.json!.data;
        for (const event of events)
          expect(
            event.severity,
            `Expect episode severity to be ${severity}`
          ).toBe(severity);
      }
    });
  });
});

test("Non-existent severity returns error", async ({ request }) => {
  const params = {
    feed: "micglobal",
    //@ts-expect-error passing incorrect severity by purpose to test error
    severities: ["NEVERAGODNA"] as Severities,
  };
  const expectedError =
    '{"status":"BAD_REQUEST","message":"Failed to convert value of type \'java.lang.String\' to required type \'java.util.List\'; nested exception is org.springframework.core.convert.ConversionFailedException: Failed to convert from type [java.lang.String] to type [@io.swagger.v3.oas.annotations.Parameter @org.springframework.web.bind.annotation.RequestParam io.kontur.eventapi.entity.Severity] for value \'NEVERAGODNA\'; nested exception is java.lang.IllegalArgumentException: No enum constant io.kontur.eventapi.entity.Severity.NEVERAGODNA","errors":["severities should be of type java.util.List"]}';

  const resp = await searchEvents({
    params,
    request,
    timeout: 10000,
  });
  checkBadRequest(resp, expectedError);
});

test(`Check multiple severities filter for feed 'pdc'`, async ({ request }) => {
  // Get all events with a big limit
  const allEventsResp = await searchEvents({
    params: { feed: "pdc", limit: 1000 },
    request,
    timeout: 20000,
  });
  checkSuccessfulResponse(allEventsResp);

  const allEvents = allEventsResp.json!.data;
  // Get two unique severities
  const uniqueSeverities = [
    ...new Set(allEvents.map((event) => event.severity)),
  ].slice(0, 2);

  if (uniqueSeverities.length < 2) {
    console.warn(
      `SKIP: Not enough unique severities in pdc feed, (found: ${uniqueSeverities.join(", ")})`
    );
    test.skip(true, "Not enough unique severities in feed for this test");
    return;
  }

  const params = { feed: "pdc", severities: uniqueSeverities, limit: 100 };
  const resp = await searchEvents({
    params,
    request,
    timeout: 20000,
  });
  checkSuccessfulResponse(resp);

  const events = resp.json!.data;
  for (const event of events) {
    expect(
      uniqueSeverities,
      `Expect episode severity to be in ${uniqueSeverities.join(", ")}`
    ).toContain(event.severity);
  }
});
