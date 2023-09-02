const express = require("express");
const path = require("path");
const bodyParser = require("body-parser"); //for accessing the body of the requests
const app = express(); //express application created
const port = 3000; //port declaration

//points table of the tournament.
const pointsTable = [
  {
    rank: 1,
    team: "Chennai Super Kings",
    matches: 7,
    won: 5,
    lost: 2,
    nrr: 0.771,
    runsFor: 1130,
    oversFor: 133.1,
    runsAgainst: 1071,
    oversAgainst: 138.5,
    pts: 10,
  },
  {
    rank: 2,
    team: "Royal Challengers Bangalore",
    matches: 7,
    won: 4,
    lost: 3,
    nrr: 0.597,
    runsFor: 1217,
    oversFor: 140,
    runsAgainst: 1066,
    oversAgainst: 131.4,
    pts: 8,
  },
  {
    rank: 3,
    team: "Delhi Capitals",
    matches: 7,
    won: 4,
    lost: 3,
    nrr: 0.319,
    runsFor: 1085,
    oversFor: 126,
    runsAgainst: 1136,
    oversAgainst: 137,
    pts: 8,
  },
  {
    rank: 4,
    team: "Rajasthan Royals",
    matches: 7,
    won: 3,
    lost: 4,
    nrr: 0.331,
    runsFor: 1066,
    oversFor: 128.2,
    runsAgainst: 1094,
    oversAgainst: 137.1,
    pts: 6,
  },
  {
    rank: 5,
    team: "Mumbai Indians",
    matches: 8,
    won: 2,
    lost: 6,
    nrr: -1.75,
    runsFor: 1003,
    oversFor: 155.2,
    runsAgainst: 1134,
    oversAgainst: 138.1,
    pts: 4,
  },
];

app.use(bodyParser.urlencoded({ extended: false })); //to parse the request body

//get request - to send the HTML file when the user hits localhost:3000
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./", "views", "form.html"));
});

//post request - to receive the data the user has submitted through the form
app.post("/", (req, res) => {
  //calling the function to calculate the cases
  analyseCricketScore(
    req.body.yourTeam,
    req.body.oppositionTeam,
    req.body.matchOvers,
    req.body.desiredPosition,
    req.body.tossResult,
    req.body.runs
  );
  res.redirect("/");
});

//hosting the app on the port
app.listen(port, () => {
  console.log(`i'm listening on the ${port})`);
});

//function to get a team's data by passing teamname
function getTeamData(teamName) {
  console.log;
  return (teamdata = pointsTable.find((data) => data.team === teamName));
}

//function to evaluate the pending overs
function evaluateOvers(overs) {
  //input be a decimal number. For ex: 147.1
  const wholeNumber = overs.toString().split(".")[0]; //to get the whole number. Convert decimal number to string and then split from decimal point.
  const decimalNumber = overs.toString().split(".")[1]; //to get the number after decimal point. Split function returns an array of 2 numbers. For ex: ['147','1']
  return (+wholeNumber + +decimalNumber / 6).toFixed(2); //toFixed is used to limit the number after decimal point at 2 digits
}

//function to calculate the revised NRR according to the range of runs and overs obtained
function calculateNRR(
  runsFor,
  oversFor,
  runs,
  runOrOverBoundDetails,
  runsAgainst,
  oversAgainst,
  matchOvers,
  flag //flag is passed to check whether range of runs or range of overs is passed as params. Also to avoid writting of each separate functions to calculate NRR for range of runs and overs
) {
  let totalRunsFor, totalOversFor, totalRunsAgainst, totalOversAgainst;
  totalRunsFor = runsFor + +runs; //'+' sign before 'runs' variable is used to convert it from string to integer
  totalOversAgainst = oversAgainst + +matchOvers;
  totalOversAgainst = evaluateOvers(totalOversAgainst);
  if (flag === 1) {
    //flag = 1 is passed when range of runs is passed as params
    totalOversFor = oversFor + +matchOvers;
    totalRunsAgainst = runsAgainst + runOrOverBoundDetails;
    totalOversFor = evaluateOvers(totalOversFor);

    return totalRunsFor / totalOversFor - totalRunsAgainst / totalOversAgainst; //formula to calculate NRR = runsFor/oversFor - runsAgainst/oversAgainst
  } else {
    //flag = 0 is passed when range of runs is passed as params
    totalOversFor = oversFor + runOrOverBoundDetails;
    totalRunsAgainst = runsAgainst + +runs;
    totalOversFor = evaluateOvers(totalOversFor);

    return totalRunsFor / totalOversFor - totalRunsAgainst / totalOversAgainst;
  }
}

function analyseCricketScore(
  yourTeam,
  oppositionTeam,
  matchOvers,
  desiredPosition,
  tossResult,
  runs // here runs = runs scored or runs chased
) {
  const teamData = getTeamData(yourTeam); //gets the team data
  const runsFor = teamData.runsFor;
  const oversFor = teamData.oversFor;
  const runsAgainst = teamData.runsAgainst;
  const oversAgainst = teamData.oversAgainst;
  const teamRank = teamData.rank;

  //desired position should be greater than or equal to 1 and should not be equal to the team's rank
  if (6 > +desiredPosition >= 1 && +desiredPosition !== teamRank) {
    const nrrLowerBoundData = pointsTable.find(
      //to get the data of the current team on the desiredPosition using find function
      (data) => data.rank == desiredPosition
    );

    //to get the NRR lower bound value from the data obtained
    const nrrLowerBoundValue = nrrLowerBoundData.nrr; //NRR lower bound value = NRR of the current team on the desired position

    const nrrUpperBoundData = pointsTable.find(
      //to get the data of the team one position above the desiredPosition using find function
      (data) => data.rank == +desiredPosition - 1
    );

    const nrrUpperBoundValue = nrrUpperBoundData ? nrrUpperBoundData.nrr : 0; //NRR upper bound value = NRR of the team one position above the desired position
    //NRR upper and lower bound values are calculated to get the range of runs and overs. As to reach the desired position, team's NRR cannot be greater than NRRupperbound.

    if (tossResult === "Batting First") {
      //if toss result is Batting first, range of runs can be calculated for the opposition team
      const flag = 1;

      //formula to calculate runsUpperBound and runsLowerBound: NRR = runsFor/oversfor - runsagainst/oversagainst. Here, Value of runsagainst will give the lower and upper range of runs
      const runsUpperBound = Math.ceil(
        (+runs / +matchOvers - nrrLowerBoundValue) * +matchOvers
      );
      const runsLowerBound = Math.ceil(
        (+runs / +matchOvers - nrrUpperBoundValue) * +matchOvers
      );

      //calculateNRR function called to calculate the range of revised NRR for the team after obtaining range of runs
      const nrrLowerBound = calculateNRR(
        runsFor,
        oversFor,
        runs,
        runsUpperBound,
        runsAgainst,
        oversAgainst,
        matchOvers,
        flag
      );
      const nrrUpperBound = calculateNRR(
        runsFor,
        oversFor,
        runs,
        runsLowerBound,
        runsAgainst,
        oversAgainst,
        matchOvers,
        flag
      );

      console.log(
        `${yourTeam} score ${runs} runs in ${matchOvers}, ${yourTeam} need to restrict ${oppositionTeam} between ${runsLowerBound} to ${runsUpperBound} runs in ${matchOvers} overs.`
      );
      console.log(
        `Revised NRR of ${yourTeam} will be between ${nrrLowerBound} to ${nrrUpperBound}.`
      );
    } else {
      //if toss result is Bowling first, range of overs can be calculated for your team to chase the runs
      const flag = 0;

      //formula to calculate runsUpperBound and runsLowerBound: NRR = runsFor/oversfor - runsagainst/oversagainst. Here, Value of oversfor will give the lower and upper range of overs
      const oversUpperBound = Math.round(
        +runs / (nrrLowerBoundValue + +runs / +matchOvers)
      );
      const oversLowerBound = Math.round(
        +runs / (nrrUpperBoundValue + +runs / +matchOvers)
      );

      //calculateNRR function called to calculate the range of revised NRR for the team after obtaining range of overs
      const nrrLowerBound = calculateNRR(
        runsFor,
        oversFor,
        runs,
        oversUpperBound,
        runsAgainst,
        oversAgainst,
        matchOvers,
        flag
      );
      const nrrUpperBound = calculateNRR(
        runsFor,
        oversFor,
        runs,
        oversLowerBound,
        runsAgainst,
        oversAgainst,
        matchOvers,
        flag
      );

      console.log(
        `${yourTeam} need to chase ${runs} between ${oversLowerBound} to ${oversUpperBound} overs.`
      );
      console.log(
        `Revised NRR of ${yourTeam} will be between ${nrrLowerBound} to ${nrrUpperBound}.`
      );
    }
  } else if (+desiredPosition === teamRank) {
    //if the desiredPosition and the team's rank is same
    console.log(
      "desired position cannot be same as the rank in the tournament points table"
    );
  } else {
    //if the desired position is number is less than 1 and grater than 5
    console.log("Desired position is not valid!");
  }
}
