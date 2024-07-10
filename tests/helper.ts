import fs from "fs";
import path from "path";

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
