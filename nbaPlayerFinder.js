const express = require("express");
const app = express();
const path = require('path');
const bodyParser = require("body-parser");
require('ejs');
require("dotenv").config({
    path: path.join(__dirname, ".env"),
})

const uri = "mongodb+srv://" + process.env.MONGO_DB_USERNAME+ ":" + process.env.MONGO_DB_PASSWORD + "@cluster0.v1q99.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const { MongoClient, ServerApiVersion } = require('mongodb');
const client = new MongoClient(uri);

app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static(path.join(__dirname)));

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

async function getPlayer(firstName, lastName, res) {
  const axios = require('axios');

const options = {
  method: 'POST',
  url: 'https://basketball-head.p.rapidapi.com/players/search',
  headers: {
    'x-rapidapi-key': 'ed5efc59f5mshda75a84eb106630p1fd45bjsndd7379719c13',
    'x-rapidapi-host': 'basketball-head.p.rapidapi.com',
    'Content-Type': 'application/json'
  },
  data: {
    firstname: firstName,
    lastname: lastName,
  },
};

let response

try {
  response = await axios.request(options);
	console.log(response.data);
} catch (error) {
	console.error(error);
}
	console.log(response.data);  
  let{playerId, height, weight, positions, dateBorn, dateDied, birthPlace, draftInfo, hofInductionInfo, nbaDebut, accolades, teams, headshotUrl} = response.data.body[0];
  console.log(playerId, firstName, lastName, height, weight);

  console.log(headshotUrl);

  const newOptions = {
  method: 'GET',
    url: 'https://basketball-head.p.rapidapi.com/players/' + playerId +'/stats/PerGame',
    params: {
      seasonType: 'Regular'
    },
    headers: {
      'x-rapidapi-key': 'ed5efc59f5mshda75a84eb106630p1fd45bjsndd7379719c13',
      'x-rapidapi-host': 'basketball-head.p.rapidapi.com'
    }
  };

  let newResponse;

  try {
    newResponse = await axios.request(newOptions);
  } catch (error) {
    console.error(error);
  }

    const careerStats = newResponse.data.body.slice(-1);
    
    const statsTable = newResponse.data.body.slice(0,-1)
    .map(
      element => `
    <tr>
      <td>${element.season}</td>
      <td>${element.team}</td>
      <td>${element.age}</td>
      <td>${element.gamesPlayed}</td>
      <td>${element.minutesPerGame}</td>
      <td>${element.pointsPerGame}</td>
      <td>${element.assistsPerGame}</td>
      <td>${element.blocksPerGame}</td>
      <td>${element.stealsPerGame}</td>
      <td>${element.turnoversPerGame}</td>
      <td>${element.fieldGoalPercentage}</td>
      <td>${element.threePointFieldGoalPercentage}</td>
      <td>${element.freeThrowPercentage}</td>
      <td>${element.seasonType}</td>
    </tr>
    `);

    const careerStatsTable = careerStats
    .map(
      element => `
      <tr>
      <td> ${element.season}</td>
      <td> ${element.gamesPlayed}</td>
      <td> ${element.minutesPerGame}</td>
      <td> ${element.pointsPerGame}</td>
      <td> ${element.assistsPerGame}</td>
      <td> ${element.blocksPerGame}</td>
      <td> ${element.stealsPerGame}</td>
      <td> ${element.turnoversPerGame}</td>
      <td> ${element.fieldGoalPercentage}</td>
      <td> ${element.threePointFieldGoalPercentage}</td>
      <td> ${element.freeThrowPercentage}</td>
      <td> ${element.seasonType}</td>
      </tr>
      `);


    const Data = {
      name: `${firstName.charAt(0).toUpperCase() + firstName.slice(1)} ${lastName.charAt(0).toUpperCase() + lastName.slice(1)}`,
      height: height,
      weight: weight,
      positions: positions,
      dob: dateBorn,
      dod: dateDied,
      pob: birthPlace,
      draft: draftInfo,
      nbaDebut: nbaDebut,
      headshot: headshotUrl,
      statsTable:
      `
      <table border = '1'>
      <thead>
      <tr>
      <th>Season</th>
      <th>Team</th>
      <th>Age</th>
      <th>Games Played</th>
      <th>MPG</th>
      <th>PPG</th>
      <th>APG</th>
      <th>BPG</th>
      <th>SPG</th>
      <th>TPG</th>
      <th>FG%</th>
      <th>3P%</th>
      <th>FT%</th>
      <th> Season Type</th>
      </tr>
      </thead>
      <tbody>
      ${statsTable}
        </tbody>
        </table>
      `,

      careerStats: 
      `
      <table border = '1'>
      <thead>
      <tr>
      <th>Career</th>
      <th>Games Played</th>
      <th>MPG</th>
      <th>PPG</th>
      <th>APG</th>
      <th>BPG</th>
      <th>SPG</th>
      <th>TPG</th>
      <th>FG%</th>
      <th>3P%</th>
      <th>FT%</th>
      <th> Season Type</th>
      </tr>
      </thead>
      <tbody>
      ${careerStatsTable}
      </tbody>
      </table>
      `
    }

    try{
      await client.connect();
      const res = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .insertOne({name:firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase() +  " " +lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase(),
                                    headshot: headshotUrl,
                                    playerId: playerId,
                                    searchDate: Date()
                        });
    }
    catch (e) {
      console.log(e);
    } finally {
      client.close();
    }
    

    res.render("playerSearch", Data);
}


app.get("/", async (req, res) => {
    let previousSearches;

     try {
        await client.connect();
        previousSearches = await client.db(databaseAndCollection.db)
                                .collection(databaseAndCollection.collection).
                                find().sort({ searchDate: -1 }).toArray();
                              }
                              catch(err){
                                console.log(err);
                              }finally {
                                client.close(); 
                              }

    console.log(JSON.stringify(previousSearches));

    let searchHistory;

    if(previousSearches.length === 0){
      console.log("Got Here");
      searchHistory = ``;
    }else{
      
           searchHistory = 
           previousSearches.map
          (
            (element)=> {
             return `<tr>
              <td class = 'previousEntry'>
                <img class = 'entryIMG' src = '${element.headshot}'>
                ${element.name}
              </td>
              </tr>`;
            });
            searchHistory =
            `
            <table border = '1'>
            ${searchHistory}
            </table>
            `

        }

        console.log("search History = " + searchHistory);
    const data = {
      previousSearches: searchHistory
  }
res.render("index", data);
});

app.post("/playerSearch", (req, res) => {
    let {firstName, lastName} = req.body;
    getPlayer(firstName, lastName, res);
});



process.stdin.on('readable', () => {
  let input;
  while ((input = process.stdin.read()) !== null) {
      const command = input.toString().trim();
      if (command === 'q') {
          console.log('Shutting down the server');
          process.exit(0);
      }
  }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

