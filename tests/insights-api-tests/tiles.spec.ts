import { test, expect, APIRequestContext } from "@playwright/test";
import { getApis } from "../helper";
import { MvtToGeojson } from "mvt-to-geojson";
import { Feature } from "geojson";

const expectedLayers = [
  "access_to_health_care",
  "area_km2",
  "arts_and_entertainment_fsq_count",
  "avg_elevation_gebco_2022",
  "avg_forest_canopy_height",
  "avgmax_ts",
  "avg_ndvi",
  "avg_osm_building_levels",
  "avg_osm_hotels_assesment",
  "avg_slope_gebco_2022",
  "bare_vegetation",
  "building_count",
  "building_count_6_months",
  "builtup",
  "business_and_professional_services_fsq_count",
  "children_u5",
  "coastal_flood",
  "coffee_shops_fsq_count",
  "communication",
  "community_and_government_fsq_count",
  "conflict_internal_displacements",
  "conflict_stock_displacement",
  "count",
  "count_6_months",
  "covid19_confirmed",
  "cropland",
  "current_conflict_intensity",
  "cyclone_days_count",
  "days_maxtemp_over_32c_1c",
  "days_maxtemp_over_32c_2c",
  "days_maxwetbulb_over_32c_1c",
  "days_maxwetbulb_over_32c_2c",
  "days_mintemp_above_25c_1c",
  "days_mintemp_above_25c_2c",
  "development_and_deprivation",
  "dining_and_drinking_fsq_count",
  "disaster_internal_displacements",
  "disaster_stock_displacement",
  "drought",
  "drought_days_count",
  "drr",
  "earthquake",
  "earthquake_days_count",
  "eatery_count",
  "economic_dependency",
  "epidemic",
  "events_fsq_count",
  "evergreen_needle_leaved_forest",
  "flood_days_count",
  "food_security",
  "food_shops_count",
  "forest",
  "foursquare_os_places_count",
  "gdp",
  "ghs_avg_building_height",
  "ghs_max_building_height",
  "governance",
  "gsa_ghi",
  "hazard_and_exposure",
  "hazardous_days_count",
  "hdi_2022",
  "health_and_medicine_fsq_count",
  "health_conditions",
  "herbage",
  "highway_length",
  "highway_length_6_months",
  "human",
  "industrial_area",
  "inequality",
  "inform_risk",
  "infrastructure",
  "institutional",
  "kebab_restaurants_fsq_count",
  "lack_of_coping_capacity",
  "landmarks_and_outdoors_fsq_count",
  "local_hours",
  "mandays_maxtemp_over_32c_1c",
  "man_distance_to_bomb_shelters",
  "man_distance_to_charging_stations",
  "man_distance_to_fire_brigade",
  "man_distance_to_hospital",
  "mapswipe_area_km2",
  "max_forest_canopy_height",
  "max_osm_building_levels",
  "max_osm_hotels_assesment",
  "max_ts",
  "min_osm_heritage_admin_level",
  "min_ts",
  "moss_lichen",
  "multiple_citizenship",
  "natural_0_to_10",
  "night_lights_intensity",
  "oam_coverage_area",
  "oam_image_count",
  "oam_newest_timestamp",
  "oam_number_of_pixels",
  "oam_oldest_timestamp",
  "oam_unique_users_count",
  "one",
  "osm_airports_count",
  "osm_art_venues_count",
  "osm_atms_count",
  "osm_banks_count",
  "osm_car_parkings_capacity",
  "osm_car_parkings_count",
  "osm_colleges_count",
  "osm_cultural_and_comunity_centers_count",
  "osm_defibrillators_count",
  "osm_entertainment_venues_count",
  "osm_heritage_sites_count",
  "osm_historical_sites_and_museums_count",
  "osm_hotels_count",
  "osm_kindergartens_count",
  "osm_pharmacy_count",
  "osm_public_transport_stops_count",
  "osm_railway_stations_count",
  "osm_schools_count",
  "osm_universities_count",
  "osm_users",
  "other_vulnerable_groups",
  "permanent_water",
  "physical_infrastructure",
  "pop_disability_total",
  "pop_not_well_eng_speak",
  "pop_over_65_total",
  "populated_area_km2",
  "populated_area_km2_next_gen",
  "populated_areas_proximity_m",
  "population",
  "population_next_gen",
  "pop_under_5_total",
  "pop_without_car",
  "poverty_families_total",
  "powerlines",
  "powerlines_proximity_m",
  "power_substations_proximity_m",
  "projected_conflict_probability",
  "recent_shocks",
  "residential",
  "retail_fsq_count",
  "river_flood",
  "safety_index",
  "shrubs",
  "snow_ice",
  "socio_economic_vulnerability",
  "solar_farms_placement_suitability",
  "solar_power_plants",
  "sports_and_recreation_fsq_count",
  "stddev_accel",
  "total_building_count",
  "total_hours",
  "total_road_length",
  "travel_and_transportation_fsq_count",
  "tropical_cyclone",
  "tsunami",
  "unknown_forest",
  "uprooted_people",
  "view_count",
  "view_count_bf2402",
  "volcano_days_count",
  "volcanos_count",
  "vulnerability",
  "vulnerable_groups",
  "waste_basket_coverage_area_km2",
  "wetland",
  "wildfire_days_count",
  "wildfires",
  "worldbank_inflation",
  "worldbank_total_tax_2019",
  "worldclim_amp_temperature",
  "worldclim_avg_temperature",
  "worldclim_max_temperature",
  "worldclim_min_temperature",
  "years_to_naturalisation",
  "gmu_rain_accumulation",
];

if (process.env.ENVIRONMENT === "test") {
  expectedLayers.push("population_night_sample");
  expectedLayers.push("worldbank_tax_rate");
}

const testedTilesCoords = [
  { z: 5, x: 9, y: 10 },
  { z: 0, x: 0, y: 0 },
  { z: 1, x: 1, y: 1 },
  { z: 2, x: 3, y: 3 },
  { z: 4, x: 6, y: 12 },
  { z: 6, x: 15, y: 5 },
  { z: 7, x: 31, y: 58 },
  { z: 8, x: 154, y: 87 },
];

const [tilesObj] = getApis(["insights api tiles"], "insights-api-tiles");

async function sendTileRequestAndDecodeResponse({
  request,
  url,
  timeout,
  indicatorsClass,
  z,
  x,
  y,
}: {
  request: APIRequestContext;
  url: string;
  timeout: number;
  indicatorsClass: "all" | "general";
  z: number;
  x: number;
  y: number;
}) {
  const fullUrl = `${url}/${z}/${x}/${y}.mvt?indicatorsClass=${indicatorsClass}`;
  const response = await request.get(fullUrl, {
    timeout,
  });
  expect(response.status(), "Response status should be 200").toEqual(200);
  const responseBodyBuffer = await response.body();
  const responseText = await response.text();
  expect(
    responseText.length,
    `Response in text format should not be empty`
  ).toBeGreaterThan(0);
  // Decode the response body
  const tile = MvtToGeojson.fromBuffer(responseBodyBuffer, x, y, z);
  expect(tile[0].geometry, "Tile should have geometry").toBeDefined();
  return tile;
}
test.describe("Test insights api tiles", () => {
  for (const coord of testedTilesCoords) {
    test(`Test tile /${coord.z}/${coord.x}/${coord.y}.mvt`, async ({
      request,
    }) => {
      const decodedTile: Feature[] = await sendTileRequestAndDecodeResponse({
        request,
        url: tilesObj.url,
        timeout: 30000,
        indicatorsClass: "all",
        z: coord.z,
        x: coord.x,
        y: coord.y,
      });
      for (let i = 0; i < decodedTile.length; i++) {
        await test.step(`Checking geometry number ${i} of length of ${decodedTile.length} of the tile`, async () => {
          const properties = decodedTile[i].properties;
          const keys: string[] = Object.keys(properties ?? {});
          const values: Array<number | undefined> = Object.values(
            properties ?? {}
          );
          const numberOfNoDataValues = values.reduce((acc: number, arg) => {
            if (arg === undefined || arg === 0) {
              acc = acc + 1;
            }
            return acc;
          }, 0);
          expect(
            values.length,
            `Expect not all values to be undefined or 0`
          ).not.toEqual(numberOfNoDataValues);
          expect(
            keys.sort(),
            `Expect layers to fit expected ones`
          ).toStrictEqual(expectedLayers.sort());
          expect(properties?.one, `Expect layer one to have value === 1`).toBe(
            1
          );
        });
      }
    });
  }
});
