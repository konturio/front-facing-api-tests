export type Types = (
  | "FLOOD"
  | "TSUNAMI"
  | "WILDFIRE"
  | "THERMAL_ANOMALY"
  | "INDUSTRIAL_HEAT"
  | "TORNADO"
  | "WINTER_STORM"
  | "EARTHQUAKE"
  | "STORM"
  | "CYCLONE"
  | "DROUGHT"
  | "VOLCANO"
  | "SITUATION"
  | "OTHER"
)[];

type EventApiRequestParams = {
  feed: string;
  types?: Types;
  limit?: number;
  episodeFilterType?: "ANY" | "NONE" | "LATEST";
  bbox?: number[];
  after?: string;
  eventId?: string;
};

export default class EventApiRequestProfiler {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * This method moves the after date on a step with the given multiplier in url
   * @param object object with multiplier to move the after date on step, url on the url to build. Url should have after date in it
   * @returns updated url with moved after date
   */
  moveAfterDateOnStep({
    multiplier,
    url,
  }: {
    multiplier: number;
    url: URL;
  }): URL {
    const after = url.searchParams.get("after");
    if (!after)
      throw new Error(`After date is not defined in ${url.toString()}`);
    const afterTimestamp = new Date(after);
    afterTimestamp.setMinutes(afterTimestamp.getMinutes() + 1 * multiplier);
    url.searchParams.set("after", afterTimestamp.toISOString());
    return url;
  }

  /**
   * This function moves the bbox on a step with the given shiftStep and multiplier
   * @param object object with shiftStep on what to move the bbox on step, multiplier on what to multiply the shiftStep by, url on the url to build. Url should have bbox in it
   * @returns new url with built bbox
   */

  moveBBxOnStep({
    shiftStep,
    multiplier,
    url,
  }: {
    shiftStep: number;
    multiplier: number;
    url: URL;
  }) {
    const bbox = url.searchParams
      .get("bbox")
      ?.split(",")
      ?.map((arg) => Number(arg));
    if (!bbox || bbox.length === 0)
      throw new Error(`Bbox is not defined in ${url.toString()}`);
    const newBbox = bbox.map((arg) => {
      const shift = shiftStep * (multiplier + 1);
      return arg + shift;
    });
    url.searchParams.set("bbox", newBbox.join(","));
    return url;
  }

  /**
   * This function builds a url with the given params
   * @param url url to build
   * @param params object with params to append to the url
   * @returns new url with the params appended
   */
  buildUrl(url: string, params?: EventApiRequestParams): URL {
    const newUrl = new URL(url);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        newUrl.searchParams.append(key, String(value));
      }
    }
    return newUrl;
  }

  /**
   * This function fetches a url with metrics and returns the response body and metrics
   * @param url - The url to fetch
   * @returns object with response body, response status, response time, payload size, error (if any)
   */
  async fetchWithMetrics(url: URL): Promise<{
    startTime: string;
    responseStatus: number;
    responseTimeMs: number;
    payloadSize: number;
    body: {};
    error: string | null;
  }> {
    const startTime = Date.now();
    let status = 0;
    let payloadSize = 0;
    let endTime = 0;
    let responseTimeMs = 0;
    let error = null;
    let responseBody: any = undefined;

    try {
      const response = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
          "Cache-Control": "no-store",
        },
      });
      endTime = Date.now();
      responseTimeMs = endTime - startTime;
      status = response.status;
      const rawResponse = await response.text();
      payloadSize = Buffer.byteLength(rawResponse, "utf8");
      responseBody = JSON.parse(rawResponse);
    } catch (e) {
      error = e.message || String(e);
    }
    return {
      startTime: new Date(startTime).toISOString(),
      responseStatus: status,
      responseTimeMs,
      payloadSize,
      body: responseBody,
      error,
    };
  }
}
