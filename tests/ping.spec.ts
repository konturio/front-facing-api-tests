import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

type Api = {
  env: string;
  name: string;
  url: string;
};

function getApis() {
  const data = fs.readFileSync(path.join(__dirname, "./apis.json")).toString();

  const environment = process.env.ENVIRONMENT ?? "prod";
  const apis: Api[] = JSON.parse(data).filter(
    (api: Api) => api.env === environment
  );

  return apis;
}

const apis = getApis();

test("Check main config availability", async ({ request }) => {
  const mainConfigUrl = apis.find((arg) => arg.name === "atlas main")?.url;
  expect(mainConfigUrl).toBeDefined();
  const response = await request.get(mainConfigUrl!);
  expect(response.status()).toEqual(200);
});
