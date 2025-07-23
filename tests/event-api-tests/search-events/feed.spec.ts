import { test, expect } from "@playwright/test";
import { searchEvents } from "../../helpers/event-api-profiler.ts";
import type {
  SearchEventApiResponse,
  ResponseInfo,
} from "../../helpers/types.ts";

function checkSuccessfulFeedResponse(
  responseInfo: ResponseInfo<SearchEventApiResponse>
) {
  expect(responseInfo.status, "Expect response status to be 200").toBe(200);
  expect(responseInfo.json, "Expect response to be valid JSON").toBeDefined();
  expect(
    responseInfo.json!.data.length,
    "Expect exactly one event in response"
  ).toBe(1);
  expect(
    typeof responseInfo.json!.pageMetadata.nextAfterValue,
    "Expect nextAfterValue to be a string"
  ).toBe("string");
}

const feeds = ["pdc", "micglobal", "kontur-public", "kontur-private"];

feeds.forEach((feed) => {
  test(`Check that valid feed '${feed}' request returns at least one event and correct metadata`, async ({
    request,
  }) => {
    const params = { feed, limit: 1 };
    const resp = await searchEvents({
      params,
      request,
      timeout: 10000,
    });
    checkSuccessfulFeedResponse(resp);
  });
});

test("Check that non-existent feed returns 403 Forbidden to hide actual feeds", async ({
  request,
}) => {
  const params = { feed: "GGG" };
  const resp = await searchEvents({
    params,
    request,
    timeout: 10000,
  });
  expect(resp.status, "Expect response status to be 403").toBe(403);
});
