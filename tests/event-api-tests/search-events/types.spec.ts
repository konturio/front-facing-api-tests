import { test, expect } from "@playwright/test";
import { searchEvents } from "../../helpers/event-api-profiler.ts";
import type {
  SearchEventApiResponse,
  ResponseInfo,
  Types,
} from "../../helpers/types.ts";

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

const feeds = ["kontur-public", "micglobal"];

feeds.forEach((feed) => {
  test(`Check filtering events by type for feed '${feed}'`, async ({
    request,
  }) => {
    const respWithType = await searchEvents({
      params: { feed, limit: 1 },
      request,
      timeout: 20000,
    });
    checkSuccessfulResponse(respWithType);
    const referenceTypeInResponse = respWithType.json!.data[0].type;
    test.info().annotations.push({
      type: `tested type`,
      description: referenceTypeInResponse,
    });
    const params = {
      feed,
      types: [referenceTypeInResponse] as Types,
      limit: 1000,
    };
    const resp = await searchEvents({
      params,
      request,
      timeout: 20000,
    });
    checkSuccessfulResponse(resp);

    // Check that each episode has the required type
    const events = resp.json!.data;
    for (const event of events) {
      expect(
        event.type,
        `Expect episode type to be ${referenceTypeInResponse}`
      ).toBe(referenceTypeInResponse);
    }
  });
});

test.describe("Check filtering by multiple episode types", () => {
  feeds.forEach((feed) => {
    test(`Check filtering by multiple episode types for feed '${feed}'`, async ({
      request,
    }) => {
      const respWithType = await searchEvents({
        params: { feed, limit: 1000 },
        request,
        timeout: 20000,
      });
      checkSuccessfulResponse(respWithType);
      const uniqueThreeTypesInFeed = [
        ...new Set(respWithType.json!.data.map((event) => event.type)),
      ].slice(0, 3) as Types;
      test.info().annotations.push({
        type: `tested types`,
        description: uniqueThreeTypesInFeed.join(", "),
      });
      const params = { feed, types: uniqueThreeTypesInFeed, limit: 1000 };
      const resp = await searchEvents({
        params,
        request,
        timeout: 20000,
      });
      checkSuccessfulResponse(resp);

      const events = resp.json!.data;
      for (const event of events) {
        expect(
          uniqueThreeTypesInFeed,
          `Expect episode type to be in ${uniqueThreeTypesInFeed.toString()}, got ${event.type}`
        ).toContain(event.type);
      }
    });
  });
});

test("Error for non-existent episode type", async ({ request }) => {
  const params = { feed: "micglobal", types: ["MOONFALL"] };
  const expectedError =
    '{"status":"BAD_REQUEST","message":"Failed to convert value of type \'java.lang.String\' to required type \'java.util.List\'; nested exception is org.springframework.core.convert.ConversionFailedException: Failed to convert from type [java.lang.String] to type [@io.swagger.v3.oas.annotations.Parameter @org.springframework.web.bind.annotation.RequestParam io.kontur.eventapi.entity.EventType] for value \'MOONFALL\'; nested exception is java.lang.IllegalArgumentException: No enum constant io.kontur.eventapi.entity.EventType.MOONFALL","errors":["types should be of type java.util.List"]}';

  const resp = await searchEvents({
    //@ts-expect-error passing incorrect type by purpose to test error
    params,
    request,
    timeout: 10000,
  });
  checkBadRequest(resp, expectedError);
});
