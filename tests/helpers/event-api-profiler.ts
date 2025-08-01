import { getApis } from "./main-helper.ts";
import { APIRequestContext, test } from "@playwright/test";
import {
  EventApiRequestParams,
  EventApiRequestsTypes,
  ResponseInfo,
  SearchEventApiResponse,
} from "./types.ts";

export class EventApiURLBuilder {
  private endpointMap: Record<EventApiRequestsTypes, string>;
  private currentType?: EventApiRequestsTypes;
  private currentParams?: EventApiRequestParams;
  private currentExtraPath?: string;

  constructor() {
    const [search, returnEvent, raw] = getApis(
      [
        "event api search",
        "event api return event",
        "event api raw data (observations)",
      ],
      "event-api"
    );
    this.endpointMap = {
      "event api search": search.url,
      "event api return event": returnEvent.url,
      "event api raw data (observations)": raw.url,
    };
  }

  setType(type: EventApiRequestsTypes): this {
    this.currentType = type;
    return this;
  }

  setParams(params: EventApiRequestParams): this {
    this.currentParams = params;
    return this;
  }

  setExtraPath(extraPath: string): this {
    this.currentExtraPath = extraPath;
    return this;
  }

  /**
   * This function builds url with given params and path if any and returns the url
   * @returns the url
   */

  buildUrl(): URL {
    if (!this.currentType) throw new Error("Type is not set");
    const baseUrl = this.endpointMap[this.currentType];
    if (!baseUrl) throw new Error(`No URL for type ${this.currentType}`);

    const url = new URL(
      this.currentExtraPath ? baseUrl + this.currentExtraPath : baseUrl
    );

    if (this.currentParams) {
      for (const [key, value] of Object.entries(this.currentParams)) {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      }
    }
    return url;
  }
}

export class EventApiRequestsExecutor<T = unknown> {
  private token: string;
  private responseInfo: ResponseInfo<T> = {
    status: 0,
    text: "",
    json: undefined,
  };

  constructor(token: string) {
    this.token = token;
  }

  async sendRequest({
    url,
    request,
    timeout,
  }: {
    url: URL;
    request: APIRequestContext;
    timeout: number;
  }) {
    const response = await request.get(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      timeout,
    });
    this.responseInfo.status = response.status();
    this.responseInfo.text = await response.text();
    try {
      this.responseInfo.json = await response.json();
    } catch {}
    return this;
  }

  getResponseInfo() {
    return this.responseInfo;
  }
}

export async function searchEvents({
  request,
  params,
  timeout,
}: {
  request: APIRequestContext;
  params: EventApiRequestParams;
  timeout: number;
}): Promise<ResponseInfo<SearchEventApiResponse>> {
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
    .sendRequest({ url: testedURL, request, timeout })
    .then((res) => res.getResponseInfo());

  return responseInfo;
}
