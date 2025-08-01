import { getApis, getJSON } from "../helpers/main-helper";

function globalSetup() {
  const params = ["ENVIRONMENT", "SLACK_BOT_USER_OAUTH_TOKEN"];

  const sendErrorIfUndefined = function (param: string) {
    if (typeof process.env[param] === "undefined")
      throw new Error(`${param} is not defined at .env file`);
  };

  params.forEach((param) => sendErrorIfUndefined(param));

  const [graphqlEndpointObject] = getApis(
    [`insights api graphql`],
    `insights-api-graphql`
  );

  if (!graphqlEndpointObject) {
    throw new Error("Failed to retrieve GraphQL API endpoint configuration");
  }
  if (!graphqlEndpointObject.url) {
    throw new Error("GraphQL API endpoint URL is missing from configuration");
  }

  process.env.GRAPHQL_ENDPOINT = graphqlEndpointObject.url as string;
  process.env.ALL_COUNTRIES_PATH =
    "tests/helpers/tests-data/request-bodies/all-countries.json" as string;
  process.env.REPO_NAME = "front-facing-api-tests" as string;

  if (!process.env.COUNTRIES_TO_TEST) process.env.COUNTRIES_TO_TEST = "";

  if (!process.env.TYPE) process.env.TYPE = "API";

  if (process.env.IS_TESTING_BUSINESS_COUNTRIES_IN_A_ROW_AT_INSIGHTS_API) {
    const countries = getJSON({
      fileFolder: "lookup-data",
      fileName: "countries-for-workflow",
    }) as string[];
    process.env.COUNTRIES_TO_TEST = countries.join(",");
  }
}

export default globalSetup;
