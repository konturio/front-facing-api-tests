import { test, expect } from "@playwright/test";
import { searchEvents } from "../../helpers/event-api-profiler.ts";
import type { SearchEventApiResponse, ResponseInfo } from "../../helpers/types";
import intersect from "@turf/intersect";
import bboxPolygon from "@turf/bbox-polygon";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";

function doGeometriesIntersectBBox(
  bbox: [number, number, number, number],
  events: SearchEventApiResponse["data"]
) {
  const bboxPoly = bboxPolygon(bbox);
  const intersectionResults: boolean[] = [];

  for (const event of events) {
    let hasIntersection = false;

    for (const feature of event.geometries.features) {
      if (
        feature.geometry.type === "Polygon" ||
        feature.geometry.type === "MultiPolygon"
      ) {
        const combinedFeatureCollection = {
          type: "FeatureCollection",
          features: [bboxPoly, feature],
        } as FeatureCollection<Polygon | MultiPolygon>;
        const intersection = intersect(combinedFeatureCollection);
        if (!!intersection) {
          hasIntersection = true;
          break;
        }
      }
    }

    intersectionResults.push(hasIntersection);
  }
  return intersectionResults.includes(true);
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
  expect(responseInfo.text, "Expect error body to match").toBe(expectedError);
}

test("Check custom bbox returns only intersecting events", async ({
  request,
}) => {
  const bbox = [89, -12, 157, 12] as [number, number, number, number];
  test.info().annotations.push({ type: "bbox", description: bbox.toString() });
  const params = { feed: "kontur-public", bbox };
  const resp = await searchEvents({ params, request, timeout: 10000 });
  checkSuccessfulResponse(resp);
  const data = resp.json!.data;
  expect(
    doGeometriesIntersectBBox(params.bbox, data),
    `Event geometries should intersect bbox ${params.bbox.toString()}`
  ).toBe(true);
});

test.describe("Check whole earth bbox returns all events", () => {
  ["micglobal", "kontur-public"].forEach((feed) => {
    test(`Feed: ${feed}, whole earth bbox`, async ({ request }) => {
      const bbox = [-180, -90, 180, 90] as [number, number, number, number];
      test
        .info()
        .annotations.push({ type: "bbox", description: bbox.toString() });
      const params = { feed, bbox, limit: 100 };
      const resp = await searchEvents({ params, request, timeout: 10000 });
      checkSuccessfulResponse(resp);
      const data = resp.json!.data;
      expect(
        doGeometriesIntersectBBox(params.bbox, data),
        `Event geometries should intersect whole earth bbox`
      ).toBe(true);
    });
  });
});

test("Check invalid bbox returns BAD REQUEST", async ({ request }) => {
  const bbox = [1169, -1500, -1169, 1500];
  test.info().annotations.push({ type: "bbox", description: bbox.toString() });
  const params = { feed: "pdc", bbox };
  const expectedError =
    '{"status":"BAD_REQUEST","message":"searchEvents.bbox: bbox coordinates must be minLon,minLat,maxLon,maxLat within valid ranges","errors":["EventResource searchEvents.bbox: bbox coordinates must be minLon,minLat,maxLon,maxLat within valid ranges"]}';
  const resp = await searchEvents({ params, request, timeout: 10000 });
  checkBadRequest(resp, expectedError);
});

// Antimeridian case can be added here
