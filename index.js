const express = require("express");
const path = require("path");
const bodyParser = require("body-parser"); //for accessing the body of the requests
const { on } = require("events");
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
  return (teamdata = pointsTable.find((data) => data.team === teamName));
}

//function to add two overs
function addOvers(num1, num2) {
  const wholenum1 = num1.toString().split(".")[0];
  const decinum1 = num1.toString().split(".")[1];
  const wholenum2 = num2.toString().split(".")[0];
  const decinum2 = num2.toString().split(".")[1];
  var wholenum = +wholenum1 + +wholenum2;
  var decinum = +decinum1 + +decinum2;

  if (decinum > 5) {
    var temp = Math.floor(decinum / 6);
    wholenum += temp;
    temp = decinum % 6;
    decinum = 0;
    decinum += temp;
    return wholenum + decinum / 10;
  } else {
    return (num1 + num2).toFixed(1);
  }
}

//function to evaluate the pending overs
function evaluateOvers(overs) {
  //input be a decimal number. For ex: 147.1
  const wholeNumber = overs.toString().split(".")[0]; //to get the whole number. Convert decimal number to string and then split from decimal point.
  const decimalNumber = overs.toString().split(".")[1]; //to get the number after decimal point. Split function returns an array of 2 numbers. For ex: ['147','1']

  if (decimalNumber) {
    return +(+wholeNumber + +decimalNumber / 6).toFixed(3); //toFixed is used to limit the number after decimal point at 2 digits
  } else {
    return overs; //returns the over if it is a whole number
  }
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
  totalRunsFor = runsFor + runs;
  totalOversAgainst = addOvers(oversAgainst, matchOvers);
  totalOversAgainst = evaluateOvers(totalOversAgainst);
  if (flag === 1) {
    //flag = 1 is passed when range of runs is passed as params
    totalOversFor = addOvers(oversFor, matchOvers);
    totalRunsAgainst = runsAgainst + runOrOverBoundDetails;
    totalOversFor = evaluateOvers(totalOversFor);

    return (
      totalRunsFor / totalOversFor -
      totalRunsAgainst / totalOversAgainst
    ).toFixed(3); //formula to calculate NRR = runsFor/oversFor - runsAgainst/oversAgainst
  } else {
    //flag = 0 is passed when range of overs is passed as params
    // console.log("Runs",runs, typeof runs)
    totalOversFor = addOvers(oversFor, runOrOverBoundDetails);
    totalRunsAgainst = runsAgainst + runs;
    totalOversFor = evaluateOvers(totalOversFor);
    console.log("TotalRuns for", totalRunsFor, totalOversFor, totalRunsAgainst, totalOversAgainst)
    return (
      totalRunsFor / totalOversFor -
      totalRunsAgainst / totalOversAgainst
    ).toFixed(3);
  }
}

function analyseCricketScore(
  yourTeam,
  oppositionTeam,
  matchOvers,
  desiredPosition,
  tossResult,
  runs
) {
  const team = getTeamData(yourTeam); //get your team data
  const oppTeam = getTeamData(oppositionTeam); //get opposition team data
  let arr = []; //to store the range of runs and overs
  let nrrLowerBound; //the lower bound NRR of your team
  let nrrUpperBound; //the upper bound NRR of your team

  var onPosition = pointsTable.find(
    //to get the data of the current team on the desiredPosition using find function
    (data) => data.rank == desiredPosition
  );

  var upperPosition = pointsTable.find(
    //to get the data of the team above the desiredPosition using find function
    (data) => data.rank == +desiredPosition - 1
  );

  //to check whether the entered desiredPosition is valid or not and whether the difference between the points on the desired position is less than or equal to 2 or not
  if (
    3 > onPosition.pts - team.pts &&
    onPosition.pts - team.pts > -3 &&
    team.rank !== +desiredPosition
  ) {
    //if the toss result is 'Batting First' then the range of runs to restrict the opposition team is being calculated
    if (tossResult === "Batting First") {
      const flag = 1;

      //for loop is used to check on how many runs, the NRR of your team is maintained to be on the desired position
      for (let i = runs; i > 0; i--) {
        //Team NRR is calculated for runs from 0 to runs scored to check on which runs to restrict the opposition team
        let teamNRR = calculateNRR(
          team.runsFor,
          team.oversFor,
          +runs,
          i, //here i is the runs ranging from 0 to runs scored
          team.runsAgainst,
          team.oversAgainst,
          +matchOvers,
          flag
        );

        //opposition team NRR is calculated for runs from 0 to runs scored to check on which runs the values are crossing the limits of upper or lower bound.
        let oppositionTeamNRR = calculateNRR(
          oppTeam.runsFor,
          oppTeam.oversFor,
          i,
          +runs,
          oppTeam.runsAgainst,
          oppTeam.oversAgainst,
          +matchOvers,
          flag
        );

        //lowerPositionNRR is calculated to maintain the lower bound nrr to limit your team on the desired position
        const lowerPositionNRR =
          onPosition.team == oppTeam.team ? oppositionTeamNRR : onPosition.nrr;

        //upperPositionNRR is calculated to maintain the upper bound nrr to limit your team on the desired position
        const upperPositionNRR =
          upperPosition.team == oppTeam.team
            ? oppositionTeamNRR
            : upperPosition.nrr;

        //onPositionNRR is calculated to maintain your team to be on the desired position
        const onPositionNRR = teamNRR;

        //here the condition is checked that the team NRR should be less than the upper bound NRR and
        //more than the lower bound NRR. If the condition satisfies then the value of i from the loop is pushed into the array.
        if (
          lowerPositionNRR < onPositionNRR &&
          onPositionNRR < upperPositionNRR
        ) {
          arr.push(i);
        }
      }

      nrrLowerBound = calculateNRR(
        team.runsFor,
        team.oversFor,
        +runs,
        arr[0], //here arr[0] is the highest run from the run range
        team.runsAgainst,
        team.oversAgainst,
        +matchOvers,
        flag
      );
      nrrUpperBound = calculateNRR(
        team.runsFor,
        team.oversFor,
        +runs,
        arr[arr.length - 1], //here arr[arr.length - 1] is the lowest run from the run range
        team.runsAgainst,
        team.oversAgainst,
        +matchOvers,
        flag
      );

      console.log(
        `${yourTeam} score ${runs} runs in ${matchOvers}, ${yourTeam} need to restrict ${oppositionTeam} between ${
          arr[arr.length - 1]
        } to ${arr[0]} runs in ${matchOvers} overs.`
      );

      console.log(
        `Revised NRR of ${yourTeam} will be between ${nrrLowerBound} to ${nrrUpperBound}.`
      );
    } else {
      //this part of code is being executed when the value of toss result is 'Bowling First'

      const flag = 0;

      //for loop is used to check on how many overs, the NRR of your team is maintained to be on the desired position
      for (let i = matchOvers - 1; i > 0; i--) {
        //for loop is used to loop inside the over. For ex: 18.1, 18.2, 18.3 ...
        for (let j = 6; j > 0; j--) {
          let over;

          //if the value of j = 6, then according to overs when its 17.6 it's turned to 18
          if (j === 6) {
            over = i + 1;
          } else {
            over = i + j / 10;
          }

          //Team NRR is calculated for overs from 0 to oversplayed to check i how many least overs to chase the runs scored by the opposition team
          let teamNRR = calculateNRR(
            team.runsFor + 1,
            team.oversFor,
            +runs,
            over,
            team.runsAgainst,
            team.oversAgainst,
            +matchOvers,
            flag
          );

          //opposition team NRR is calculated for overs from 0 to overs played to check on which over the values are crossing the limits of upper or lower bound.
          let oppositionTeamNRR = calculateNRR(
            oppTeam.runsFor,
            oppTeam.oversFor,
            +runs,
            +matchOvers,
            oppTeam.runsAgainst + 1,
            oppTeam.oversAgainst,
            over,
            flag
          );
            console.log(over,teamNRR, oppositionTeamNRR)
          //lowerPositionNRR is calculated to maintain the lower bound nrr to limit your team on the desired position
          const lowerPositionNRR =
            onPosition.team == oppTeam.team
              ? oppositionTeamNRR
              : onPosition.nrr;

          //upperPositionNRR is calculated to maintain the upper bound nrr to limit your team on the desired position
          const upperPositionNRR =
            upperPosition.team == oppTeam.team
              ? oppositionTeamNRR
              : upperPosition.nrr;

          //onPositionNRR is calculated to maintain your team to be on the desired position
          const onPositionNRR = teamNRR;

          //here the condition is checked that the team NRR should be less than the upper bound NRR and
          //more than the lower bound NRR. If the condition satisfies then the value of over from the loop is pushed into the array.
          if (
            lowerPositionNRR < onPositionNRR &&
            onPositionNRR < upperPositionNRR
          ) {
            arr.push(over);
          }
        }
      }

      nrrLowerBound = calculateNRR(
        team.runsFor + 1,
        team.oversFor,
        +runs,
        arr[0], //here arr[0] is the highest over from the over range
        team.runsAgainst,
        team.oversAgainst,
        +matchOvers,
        flag
      );

      nrrUpperBound = calculateNRR(
        team.runsFor + 1,
        team.oversFor,
        +runs,
        arr[arr.length - 1], //here arr[arr.length - 1] is the lowest over from the over range
        team.runsAgainst,
        team.oversAgainst,
        +matchOvers,
        flag
      );

      console.log(
        `${yourTeam} need to chase ${runs} between ${arr[arr.length - 1]} to ${
          arr[0]
        } overs.`
      );

      console.log(
        `Revised NRR of ${yourTeam} will be between ${nrrLowerBound} to ${nrrUpperBound}.`
      );
    }
  } else {
    console.log("Desired position is not valid!");
  }
}
