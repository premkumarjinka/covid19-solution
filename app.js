const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "covid19India.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.get("/states/", async (request, response) => {
  const getAllQuery = `
    SELECT * FROM state ORDER BY state_id
    `;
  const getAllResponse = await db.all(getAllQuery);
  response.send(
    getAllResponse.map((eachState) => {
      return {
        stateId: eachState.state_id,
        stateName: eachState.state_name,
        population: eachState.population,
      };
    })
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM state  WHERE state_id=${stateId}
    `;
  const getStateResponse = await db.get(getStateQuery);
  response.send({
    stateId: getStateResponse.state_id,
    stateName: getStateResponse.state_name,
    population: getStateResponse.population,
  });
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const insertDistrictQuery = `
    INSERT INTO district (district_name,state_id,cases,cured,active,deaths) 
    VALUES("${districtName}",${stateId},${cases},${cured},${active},${deaths})
    `;
  const insertDistrictResponse = await db.run(insertDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getAll = `
    SELECT * FROM district WHERE district_id=${districtId}
    `;
  const getAllResponse = await db.get(getAll);
  response.send({
    districtId: getAllResponse.district_id,
    districtName: getAllResponse.district_name,
    stateId: getAllResponse.state_id,
    cases: getAllResponse.cases,
    cured: getAllResponse.cured,
    active: getAllResponse.active,
    deaths: getAllResponse.deaths,
  });
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    UPDATE district SET district_name="${districtName}",
    state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths}
    `;
  const updateDistrictResponse = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

/*app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getSumStatsQuery = `
    SELECT
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM 
     district
    WHERE 
     state_id=${stateId};
    `;
  const stats = await db.get(getSumStatsQuery);
  console.log(stats);
  response.send(stats["SUM(cases)"]);
});*/

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateByIDStatsQuery = `select sum(cases) as totalCases, sum(cured) as totalCured,
    sum(active) as totalActive , sum(deaths) as totalDeaths from district where state_id = ${stateId};`;

  const getStateByIDStatsQueryResponse = await db.get(getStateByIDStatsQuery);
  response.send(getStateByIDStatsQueryResponse);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `
  SELECT state_id FROM district WHERE district_id=${districtId}
    `;
  const getStateResponse = await db.get(getStateQuery);

  const getStateName = `
  SELECT state_name FROM state WHERE state_id=${getStateResponse.state_id}
  `;
  const getStateNameResponse = await db.get(getStateName);
  console.log(getStateNameResponse);
  response.send({ stateName: getStateNameResponse.state_name });
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE FROM district WHERE district_id=${districtId}
    `;
  const deleteResponse = await db.run(deleteQuery);
  response.send("District Removed");
});

module.exports = app;
