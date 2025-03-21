const fs = require("fs");
const path = require("path");

const data = fs
  .readFileSync(path.join(__dirname, `../request-bodies/all-countries.json`))
  .toString();
const json = JSON.parse(data);
const adminNames = json.features.map((feature) => feature.properties.ADMIN);
fs.writeFileSync(
  path.join(__dirname, `./admin-names.json`),
  JSON.stringify(adminNames)
);
