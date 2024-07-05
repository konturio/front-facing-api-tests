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

// Playwright has no timeout function for responses
export function rejectIfTimeout(sec: number) {
  return new Promise<never>((_, reject) => {
    setTimeout(function () {
      reject(new Error(`Response is taking longer than ${sec} seconds 🫠`));
    }, sec * 1000);
  });
}
