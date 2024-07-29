import fs from "fs";
import path from "path";
import { expect } from "@playwright/test";

type Api = {
  env: string;
  name: string;
  url: string;
  appId?: string;
};

export function getApis() {
  const data = fs.readFileSync(path.join(__dirname, "./apis.json")).toString();

  const environment = process.env.ENVIRONMENT ?? "prod";
  const apis: Api[] = JSON.parse(data).filter(
    (api: Api) => api.env === environment
  );
  return apis;
}

export function getLlmRequestBody() {
  const data = fs
    .readFileSync(path.join(__dirname, "./llm-request.json"))
    .toString();
  const request = JSON.parse(data);
  return request;
}

export async function updateUsrLanguage(
  userUrl: string,
  request,
  language: string
) {
  const response = await request.put(userUrl, {
    headers: {
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    },
    data: {
      language,
    },
  });
  expect(response.status()).toEqual(200);
  const responseObj = await response.json();
  expect(responseObj.language).toEqual(language);
}
