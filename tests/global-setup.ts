import { getApis } from "./helper";
import type { Api } from "./helper";

function globalSetup() {
  const params = [
    "EMAIL_PRO",
    "PASSWORD_PRO",
    "EMAIL_NO_RIGHTS",
    "PASSWORD_NO_RIGHTS",
    "ENVIRONMENT",
    "SLACK_BOT_USER_OAUTH_TOKEN",
  ];

  const sendErrorIfUndefined = function (param: string) {
    if (typeof process.env[param] === "undefined")
      throw new Error(`${param} is not defined at .env file`);
  };

  params.forEach((param) => sendErrorIfUndefined(param));

  const [graphqlEndpointObject] = getApis(
    [`insights api graphql`],
    `insights-api-graphql`
  );
  process.env.GRAPHQL_ENDPOINT = graphqlEndpointObject.url as string;
}

export default globalSetup;
