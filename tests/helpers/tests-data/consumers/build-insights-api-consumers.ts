// ⚠️ Helper function for building unique consumers data for tests.
// Used manually. Not part of production logic.

type Data = {
  name: string;
  id?: string;
  x: string;
  consumer: string;
  y?: string;
};

const dataOP = [
  { name: "sumX", id: "population", x: "population", consumer: "hot" },
  {
    name: "sumX",
    id: "populatedAreaKm2",
    x: "populated_area_km2",
    consumer: "hot",
  },
  {
    name: "percentageXWhereNoY",
    id: "osmBuildingGapsPercentage",
    x: "populated_area_km2",
    y: "building_count",
    consumer: "hot",
  },
  {
    name: "percentageXWhereNoY",
    id: "osmRoadGapsPercentage",
    x: "populated_area_km2",
    y: "highway_length",
    consumer: "hot",
  },

  { name: "avgX", id: "averageEditTime", x: "avgmax_ts", consumer: "hot" },
  { name: "maxX", id: "lastEditTime", x: "avgmax_ts", consumer: "hot" },
  {
    name: "sumX",
    id: "osmBuildingsCount",
    x: "building_count",
    consumer: "hot",
  },
  { name: "sumX", id: "highway_length", x: "highway_length", consumer: "hot" },
  { name: "sumX", id: "osmUsersCount", x: "osm_users", consumer: "hot" },
  {
    name: "sumX",
    id: "building_count_6_months",
    x: "building_count_6_months",
    consumer: "hot",
  },
  {
    name: "sumX",
    id: "highway_length_6_months",
    x: "highway_length_6_months",
    consumer: "hot",
  },
  {
    name: "sumX",
    id: "aiBuildingsCountEstimation",
    x: "total_building_count",
    consumer: "hot",
  },
  {
    name: "sumX",
    id: "aiRoadCountEstimation",
    x: "total_road_length",
    consumer: "hot",
  },
  { name: "sumX", id: "population", x: "population", consumer: "hot" },
  {
    name: "sumX",
    id: "populatedAreaKm2",
    x: "populated_area_km2",
    consumer: "hot",
  },
  {
    name: "sumXWhereNoY",
    id: "areaWithoutOsmBuildingsKm2",
    x: "populated_area_km2",
    y: "building_count",
    consumer: "hot",
  },
  {
    name: "sumXWhereNoY",
    id: "areaWithoutOsmRoadsKm2",
    x: "populated_area_km2",
    y: "highway_length",
    consumer: "hot",
  },
  {
    name: "percentageXWhereNoY",
    id: "osmBuildingGapsPercentage",
    x: "populated_area_km2",
    y: "building_count",
    consumer: "hot",
  },
  {
    name: "percentageXWhereNoY",
    id: "osmRoadGapsPercentage",
    x: "populated_area_km2",
    y: "highway_length",
    consumer: "hot",
  },
  { name: "avgX", id: "averageEditTime", x: "avgmax_ts", consumer: "hot" },
  { name: "maxX", id: "lastEditTime", x: "avgmax_ts", consumer: "hot" },
  {
    name: "sumX",
    id: "osmBuildingsCount",
    x: "building_count",
    consumer: "hot",
  },
  { name: "sumX", id: "osmUsersCount", x: "osm_users", consumer: "hot" },
  { name: "sumX", id: "osmUsersHours", x: "total_hours", consumer: "hot" },
  { name: "sumX", id: "localOsmUsersHours", x: "local_hours", consumer: "hot" },
  {
    name: "sumX",
    id: "aiBuildingsCountEstimation",
    x: "total_building_count",
    consumer: "hot",
  },
  {
    name: "sumX",
    id: "populatedAreaKm2",
    x: "populated_area_km2",
    consumer: "eventAPI",
  },
  {
    name: "sumX",
    id: "industrialAreaKm2",
    x: "industrial_area",
    consumer: "eventAPI",
  },
  { name: "sumX", id: "forestAreaKm2", x: "forest", consumer: "eventAPI" },
  {
    name: "sumX",
    id: "volcanoesCount",
    x: "volcanos_count",
    consumer: "eventAPI",
  },
  {
    name: "maxX",
    id: "hotspotDaysPerYearMax",
    x: "wildfires",
    consumer: "eventAPI",
  },
  {
    name: "percentageXWhereNoY",
    id: "osmGapsPercentage",
    x: "populated_area_km2",
    y: "count",
    consumer: "eventAPI",
  },
  {
    name: "sumX",
    id: "populatedAreaKm2",
    x: "populated_area_km2",
    consumer: "eventAPI",
  },
  {
    name: "sumX",
    id: "industrialAreaKm2",
    x: "industrial_area",
    consumer: "eventAPI",
  },
  {
    name: "percentageXWhereNoY",
    id: "osmGapsPercentage",
    x: "populated_area_km2",
    y: "count",
    consumer: "eventAPI",
  },
  {
    name: "sumX",
    id: "buildingCount",
    x: "building_count",
    consumer: "eventAPI",
  },
  {
    name: "sumX",
    id: "highwayLength",
    x: "highway_length",
    consumer: "eventAPI",
  },
  {
    name: "sumX",
    id: "populatedAreaKm2",
    x: "populated_area_km2",
    consumer: "eventAPI",
  },
  {
    name: "percentageXWhereNoY",
    id: "osmGapsPercentage",
    x: "populated_area_km2",
    y: "count",
    consumer: "eventAPI",
  },
  {
    name: "sumX",
    id: "buildingCount",
    x: "building_count",
    consumer: "eventAPI",
  },
  {
    name: "sumX",
    id: "highwayLength",
    x: "highway_length",
    consumer: "eventAPI",
  },
  {
    name: "sumX",
    id: "industrialAreaKm2",
    x: "industrial_area",
    consumer: "eventAPI",
  },
  {
    name: "sumX",
    id: "populatedAreaKm2",
    x: "populated_area_km2",
    consumer: "eventAPI",
  },
  {
    name: "sumX",
    id: "industrialAreaKm2",
    x: "industrial_area",
    consumer: "eventAPI",
  },
  { name: "sumX", id: "forestAreaKm2", x: "forest", consumer: "eventAPI" },
  {
    name: "sumX",
    id: "volcanoesCount",
    x: "volcanos_count",
    consumer: "eventAPI",
  },
  {
    name: "maxX",
    id: "hotspotDaysPerYearMax",
    x: "wildfires",
    consumer: "eventAPI",
  },
  {
    name: "percentageXWhereNoY",
    id: "osmGapsPercentage",
    x: "populated_area_km2",
    y: "count",
    consumer: "eventAPI",
  },
  {
    name: "sumX",
    id: "buildingCount",
    x: "building_count",
    consumer: "eventAPI",
  },
  {
    name: "sumX",
    id: "highwayLength",
    x: "highway_length",
    consumer: "eventAPI",
  },
  {
    name: "sumX",
    x: "population",
    consumer: "disasterNinja",
  },
  {
    name: "sumX",
    x: "populated_area_km2",
    consumer: "disasterNinja",
  },
  {
    name: "percentageXWhereNoY",
    x: "populated_area_km2",
    y: "count",
    consumer: "disasterNinja",
  },
  {
    name: "sumXWhereNoY",
    x: "populated_area_km2",
    y: "count",
    consumer: "disasterNinja",
  },
  {
    name: "percentageXWhereNoY",
    x: "populated_area_km2",
    y: "building_count",
    consumer: "disasterNinja",
  },
  {
    name: "percentageXWhereNoY",
    x: "populated_area_km2",
    y: "highway_length",
    consumer: "disasterNinja",
  },
  {
    name: "sumX",
    x: "population",
    consumer: "Honey Fombuena at DN",
  },
  {
    name: "sumX",
    x: "populated_area_km2",
    consumer: "Honey Fombuena at DN",
  },
  {
    name: "percentageXWhereNoY",
    x: "populated_area_km2",
    y: "count",
    consumer: "Honey Fombuena at DN",
  },
  {
    name: "sumXWhereNoY",
    x: "populated_area_km2",
    y: "count",
    consumer: "Honey Fombuena at DN",
  },
  {
    name: "percentageXWhereNoY",
    x: "populated_area_km2",
    y: "building_count",
    consumer: "Honey Fombuena at DN",
  },
  {
    name: "percentageXWhereNoY",
    x: "area_km2",
    y: "building_count",
    consumer: "Honey Fombuena at DN",
  },
  {
    name: "percentageXWhereNoY",
    x: "populated_area_km2",
    y: "highway_length",
    consumer: "Honey Fombuena at DN",
  },
  {
    name: "sumX",
    x: "population",
    consumer: "Smart City",
  },
  {
    name: "sumX",
    x: "area_km2",
    consumer: "Smart City",
  },
  {
    name: "sumX",
    x: "populated_area_km2",
    consumer: "Smart City",
  },
  {
    name: "sumX",
    x: "building_count",
    consumer: "Smart City",
  },
  {
    name: "avgX",
    x: "ghs_avg_building_height",
    consumer: "Smart City",
  },
  {
    name: "maxX",
    x: "ghs_max_building_height",
    consumer: "Smart City",
  },
  {
    name: "sumX",
    x: "highway_length",
    consumer: "Smart City",
  },
  {
    name: "sumX",
    x: "osm_public_transport_stops_count",
    consumer: "Smart City",
  },
  {
    name: "sumX",
    x: "osm_car_parkings_capacity",
    consumer: "Smart City",
  },
  {
    name: "sumX",
    x: "osm_railway_stations_count",
    consumer: "Smart City",
  },
  {
    name: "sumX",
    x: "osm_airports_count",
    consumer: "Smart City",
  },
  {
    name: "sumX",
    x: "osm_pharmacy_count",
    consumer: "Smart City",
  },
  {
    name: "sumX",
    x: "osm_defibrillators_count",
    consumer: "Smart City",
  },
  {
    name: "sumX",
    x: "sports_and_recreation_fsq_count",
    consumer: "Smart City",
  },
  {
    name: "sumX",
    x: "osm_hotels_count",
    consumer: "Smart City",
  },
  {
    name: "sumX",
    x: "landmarks_and_outdoors_fsq_count",
    consumer: "Smart City",
  },
  {
    name: "sumX",
    x: "arts_and_entertainment_fsq_count",
    consumer: "Smart City",
  },
  {
    name: "sumX",
    x: "population",
    consumer: "Oasis",
  },
  {
    name: "sumX",
    x: "area_km2",
    consumer: "Oasis",
  },
  {
    name: "sumX",
    x: "total_building_count",
    consumer: "Oasis",
  },
  {
    name: "sumX",
    x: "populated_area_km2",
    consumer: "Oasis",
  },
  {
    name: "sumX",
    x: "industrial_area",
    consumer: "Oasis",
  },
  {
    name: "sumX",
    x: "forest",
    consumer: "Oasis",
  },
  {
    name: "avgX",
    x: "avg_forest_canopy_height",
    consumer: "Oasis",
  },
  {
    name: "maxX",
    x: "wildfires",
    consumer: "Oasis",
  },
  {
    name: "maxX",
    x: "drought_days_count",
    consumer: "Oasis",
  },
  {
    name: "avgX",
    x: "worldclim_avg_temperature",
    consumer: "Oasis",
  },
  {
    name: "maxX",
    x: "worldclim_max_temperature",
    consumer: "Oasis",
  },
  {
    name: "sumX",
    x: "volcanos_count",
    consumer: "Oasis",
  },
  {
    name: "percentageXWhereNoY",
    x: "populated_area_km2",
    y: "count",
    consumer: "Oasis",
  },
  {
    name: "sumXWhereNoY",
    x: "populated_area_km2",
    y: "count",
    consumer: "Oasis",
  },
  {
    name: "percentageXWhereNoY",
    x: "populated_area_km2",
    y: "building_count",
    consumer: "Oasis",
  },
  {
    name: "percentageXWhereNoY",
    x: "populated_area_km2",
    y: "highway_length",
    consumer: "Oasis",
  },
  {
    name: "sumX",
    x: "population",
    consumer: "ODIN",
  },
  {
    name: "sumX",
    x: "populated_area_km2",
    consumer: "ODIN",
  },
  {
    name: "sumX",
    x: "industrial_area",
    consumer: "ODIN",
  },
  {
    name: "sumX",
    x: "forest",
    consumer: "ODIN",
  },
  {
    name: "avgX",
    x: "avg_forest_canopy_height",
    consumer: "ODIN",
  },
  {
    name: "maxX",
    x: "wildfires",
    consumer: "ODIN",
  },
  {
    name: "maxX",
    x: "drought_days_count",
    consumer: "ODIN",
  },
  {
    name: "avgX",
    x: "worldclim_avg_temperature",
    consumer: "ODIN",
  },
  {
    name: "maxX",
    x: "worldclim_max_temperature",
    consumer: "ODIN",
  },
  {
    name: "sumX",
    x: "volcanos_count",
    consumer: "ODIN",
  },
  {
    name: "sumX",
    x: "population",
    consumer: "Hazard Compass",
  },
  {
    name: "sumX",
    x: "area_km2",
    consumer: "Hazard Compass",
  },
  {
    name: "sumX",
    x: "building_count",
    consumer: "Hazard Compass",
  },
  {
    name: "avgX",
    x: "ghs_avg_building_height",
    consumer: "Hazard Compass",
  },
  {
    name: "maxX",
    x: "hazardous_days_count",
    consumer: "Hazard Compass",
  },
  {
    name: "maxX",
    x: "cyclone_days_count",
    consumer: "Hazard Compass",
  },
  {
    name: "maxX",
    x: "drought_days_count",
    consumer: "Hazard Compass",
  },
  {
    name: "maxX",
    x: "earthquake_days_count",
    consumer: "Hazard Compass",
  },
  {
    name: "maxX",
    x: "flood_days_count",
    consumer: "Hazard Compass",
  },
  {
    name: "maxX",
    x: "volcano_days_count",
    consumer: "Hazard Compass",
  },
  {
    name: "maxX",
    x: "wildfire_days_count",
    consumer: "Hazard Compass",
  },
  {
    name: "sumX",
    x: "permanent_water",
    consumer: "Hazard Compass",
  },
  {
    name: "avgX",
    x: "avg_elevation_gebco_2022",
    consumer: "Hazard Compass",
  },
  {
    name: "avgX",
    x: "avg_forest_canopy_height",
    consumer: "Hazard Compass",
  },
  {
    name: "avgX",
    x: "days_maxtemp_over_32c_1c",
    consumer: "Hazard Compass",
  },
  {
    name: "avgX",
    x: "days_mintemp_above_25c_1c",
    consumer: "Hazard Compass",
  },
  {
    name: "sumX",
    x: "osm_airports_count",
    consumer: "Hazard Compass",
  },
  {
    name: "sumX",
    x: "osm_defibrillators_count",
    consumer: "Hazard Compass",
  },
  {
    name: "sumX",
    x: "landmarks_and_outdoors_fsq_count",
    consumer: "Hazard Compass",
  },
  {
    name: "sumX",
    x: "population",
    consumer: "Terrain",
  },
  {
    name: "sumX",
    x: "area_km2",
    consumer: "Terrain",
  },
  {
    name: "sumX",
    x: "population",
    consumer: "kontur.io",
  },
  {
    name: "sumX",
    x: "area_km2",
    consumer: "kontur.io",
  },
  {
    name: "sumX",
    x: "population",
    consumer: "HORAM",
  },
  {
    name: "sumX",
    x: "area_km2",
    consumer: "HORAM",
  },
  {
    name: "sumX",
    x: "populated_area_km2",
    consumer: "HORAM",
  },
  {
    name: "sumX",
    x: "total_building_count",
    consumer: "HORAM",
  },
  {
    name: "sumX",
    x: "industrial_area",
    consumer: "HORAM",
  },
  {
    name: "sumX",
    x: "forest",
    consumer: "HORAM",
  },
  {
    name: "sumX",
    x: "population",
    consumer: "GlobalGiving",
  },
  {
    name: "sumX",
    x: "area_km2",
    consumer: "GlobalGiving",
  },
  {
    name: "sumX",
    x: "populated_area_km2",
    consumer: "GlobalGiving",
  },
  {
    name: "sumX",
    x: "total_building_count",
    consumer: "GlobalGiving",
  },
  {
    name: "sumX",
    x: "industrial_area",
    consumer: "GlobalGiving",
  },
  {
    name: "sumX",
    x: "forest",
    consumer: "GlobalGiving",
  },
] as Data[];

const groupedData = dataOP.reduce((acc, curr) => {
  if (!acc[curr.name]) acc[curr.name] = {};
  const nameData = acc[curr.name];
  const formulaTxt = `${curr.x}${curr.y ? `/${curr.y}` : ""}`;
  let formulaField = nameData[formulaTxt];

  if (!formulaField) {
    formulaField = { consumers: [], id: curr?.id ?? "no id" };
    nameData[formulaTxt] = formulaField;
  }

  formulaField.consumers.push(curr.consumer);
  formulaField.consumers = [...new Set(formulaField.consumers)];
  return acc;
}, {});

console.log(JSON.stringify(groupedData, null, 3));
