"use strict";
// Globals from third-party code
/*global Module Chart */

// Globals from laine.js
/*global laineSolver, laineError, parser*/


// Exported for ui.js
/*exported getStates, exportData, plot_check, laine_plot, checkStates, plotStates */

// Data for download
let exportData;

function plot_check(text) {
  // Function: Create a plot menu and save problem for latter
  // Check if the problem has 1 degree of freedom
  let problem;
  problem = laineSolver(text, { returnProblem: true });
  if (!problem || problem.names.length === 0) {
    let error = new laineError(
      "No degree of freedom",
      "Parametric analysis requires a problem with one degree of freedom",
      "All lines",
      "Try to remove an equation which constrains the problem"
    );
    throw error;
  }
  const degrees = problem.names.length - problem.equations.length;
  if (degrees > 1) {
    let error = new laineError(
      `${degrees} degrees of freedom`,
      "Parametric analysis requires a problem with just one degree of freedom",
      "All lines",
      `Try to include ${degrees - 1} equation(s)`
    );
    throw error;
  }
  return problem;
}

function createPlot(dataObject, xName, yName) {
  /*
      Creates a plot
  */
  let canvas = document.createElement("canvas");
  if (window.innerWidth < 400) {
    canvas.height = window.innerWidth * 0.8;
    canvas.width = window.innerWidth * 0.8;
  } else {
    canvas.height = "400";
    canvas.width = "400";
  }
  let ctx = canvas.getContext("2d");
  let legend = dataObject.datasets.length > 1 ? true : false;
  let myLineChart = new Chart(ctx, {
    type: "line",
    data: dataObject,
    options: {
      responsive: false,
      title: {
        display: true,
        text: yName + " vs. " + xName,
      },
      maintainAspectRatio: false,
      legend: {
        display: legend,
      },
      scales: {
        xAxes: [
          {
            display: true,
            type: "linear",
            scaleLabel: {
              display: true,
              labelString: xName,
            },
          },
        ],
        yAxes: [
          {
            display: true,
            type: "linear",
            scaleLabel: {
              display: true,
              labelString: yName,
            },
          },
        ],
      },
    },
  });
  myLineChart.update();
  return canvas;
}
function laine_plot(text,options) {
  // Function: Create a plot
  const t1 = performance.now();
  let problem = plot_check(text);
  // Second run: solve the problem for multiple values
  let xName = options.x;
  let yName = options.y;
  let from = options.from; 
  let to = options.to;
  const Npoints = options.points ;
  
  from = parser.evaluate(from);
  to = parser.evaluate(to);
  const delta = (to - from) / (Npoints - 1);
  let data = [];
  exportData = `${xName}\t${yName}\n`;
  // Store guesses
  let storeSolution = {};
  let equationLines = "";
  for (let equation of problem.equations) {
    equationLines += `${equation.lhs}=${equation.rhs}\n`;
  }
  let guessText = "";
  for (let userGuess in problem.options) {
    guessText += `${userGuess}=${problem.options[userGuess]}?\n`;
  }
  let errors = [];
  for (let i = 0; i < Npoints; i++) {
    // Try to solve
    let stateVar = `${xName} = ${from + delta * i}\n`;
    try {
      if (i === 0) {
        laineSolver(stateVar + guessText + equationLines, { solveFor: yName });
      } else {
        laineSolver(stateVar + equationLines, {
          savedSolution: storeSolution,
          solveFor: yName,
        });
      }
    } catch (e) {
      //console.error(e);
      errors.push(from + delta * i);
      continue;
    }
    // Store data
    let point = {
      x: parser.scope[xName],
      y: parser.scope[yName].toPrecision(5),
    };
    data.push(point);
    exportData += `${point.x}\t${point.y}\n`;

    // Store solution
    for (let j = 0; j < problem.names.length; j++) {
      if (problem.names[j] !== xName) {
        storeSolution[problem.names[j]] = parser.scope[problem.names[j]];
      }
      delete parser.scope[problem.names[j]];
    }
  }
  if (errors.length > 0) {
    let error = new laineError(
      "Incomplete parametric analysis",
      "laine failed to find solution(s) at some point(s)",
      `x = ${errors.join(",\nx = ")}`,
      "Verify if the problem is correct and change the x range"
    );
    throw error;
  }
  // Draw plot -- could be a function
  const dataObject = {
    datasets: [
      {
        fill: false,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(0, 0, 0, 1)",
        data: data,
      },
    ],
  };
  let canvas = createPlot(dataObject, xName, yName);
  const t2 = performance.now();
  console.log("Plot time:", t2 - t1, "ms");
  return canvas;
}

// PROPERTY PLOTS
function State(text) {
  const pieces = text.split(",");
  // State definition
  let value;
  value = parser.evaluate(pieces[2]);
  this.first = [pieces[1].slice(1, -1), value];
  value = parser.evaluate(pieces[4]);
  this.second = [pieces[3].slice(1, -1), value];
  this.fluid = pieces[5].slice(1, -1);
  // Temperature
  this.T = Module.PropsSI(
    "T",
    this.first[0],
    this.first[1],
    this.second[0],
    this.second[1],
    this.fluid
  );
  this.P = Module.PropsSI(
    "P",
    this.first[0],
    this.first[1],
    this.second[0],
    this.second[1],
    this.fluid
  );
  this.Q = Module.PropsSI(
    "Q",
    this.first[0],
    this.first[1],
    this.second[0],
    this.second[1],
    this.fluid
  );
  this.S = Module.PropsSI(
    "S",
    this.first[0],
    this.first[1],
    this.second[0],
    this.second[1],
    this.fluid
  );
  this.H = Module.PropsSI(
    "H",
    this.first[0],
    this.first[1],
    this.second[0],
    this.second[1],
    this.fluid
  );
  this.D = Module.PropsSI(
    "D",
    this.first[0],
    this.first[1],
    this.second[0],
    this.second[1],
    this.fluid
  );
}

function getStates(text){
  let states = [];
  // Grab text and match PropsSI calls
  const regexComment = /#.*/g; // removes comments
  const regex = /PropsSI\(.*(?=\))/g; // captures PropsSI(...
  const found = text.replace(regexComment, "").match(regex);
  if (found) {
    for (let i = 0; i < found.length; i++) {
      states.push(new State(found[i]));
    }
  } else {
    let e = new laineError(
      "No states found",
      "laine could not find any calls to PropsSI function",
      "All lines",
      "Include a state by calling the PropsSI function for any property"
    );
    throw e;
  }
  return states;
}
// Grab the table to add more states

function addIso(
  data,
  coord,
  propName,
  propValue,
  max,
  min,
  name,
  otherName,
  fluid
) {
  // Function: creates a dataset for a isoline
  const delta = (max - min) / 40;
  let xValue, yValue, xName, yName;
  for (let i = 0; i < 41; i++) {
    if (coord === "x") {
      xValue = parseFloat(min) + delta * i;
      xName = name;
      yName = otherName;
      yValue = Module.PropsSI(
        otherName,
        xName,
        xValue,
        propName,
        propValue,
        fluid
      );
    } else {
      yValue = parseFloat(min) + delta * i;
      yName = name;
      xName = otherName;
      xValue = Module.PropsSI(
        otherName,
        name,
        yValue,
        propName,
        propValue,
        fluid
      );
    }
    yValue = yName === "D" ? 1 / yValue : yValue;
    xValue = xName === "D" ? 1 / xValue : xValue;
    if (xValue !== Infinity && yValue !== Infinity) {
      let point = { x: xValue, y: yValue };
      data.push(point);
      exportData += `${point.x}\t${point.y}\n`;
    }
  }
  return data;
}
function plotStates(list,stateOptions) {
  // Function: Create the plot
  // Axis definition
  const t1 = performance.now();
  let xName, yName, xAxis, yAxis;
  let type = document.querySelector(".propPlotType");
  if (type.value === "Ts") {
    xName = "S";
    xAxis = "s [J/(kg.K)]";
    yName = "T";
    yAxis = "T [K]";
  } else if (type.value === "Ph") {
    xName = "H";
    xAxis = "h [J/kg]";
    yName = "P";
    yAxis = "P [Pa]";
  } else if (type.value === "Pv") {
    xName = "D";
    xAxis = "v [m³/kg]";
    yName = "P";
    yAxis = "P [Pa]";
  } else {
    xName = "D";
    xAxis = "v [m³/kg]";
    yName = "T";
    yAxis = "T [K]";
  }
  // Points definition
  let data = [];
  let yMin = Infinity;
  let yMax = 0;
  let fluid;
  let stateList = [];
  exportData = `States\n${xAxis}\t${yAxis}\n`;
  let xValue, yValue;
  for (let i = 0; i < list.length; i++) {
    const stateID = list[i].children[1].value;
    const state = stateOptions[stateID][1];
    stateList.push(state);
    fluid = state.fluid;
    xValue = Module.PropsSI(
      xName,
      state.first[0],
      state.first[1],
      state.second[0],
      state.second[1],
      state.fluid
    );
    yValue = Module.PropsSI(
      yName,
      state.first[0],
      state.first[1],
      state.second[0],
      state.second[1],
      state.fluid
    );
    // As number
    if (yValue < yMin) {
      yMin = yValue;
    }
    if (yValue > yMax) {
      yMax = yValue;
    }
    // As string
    xValue = xName === "D" ? 1 / xValue : xValue;
    let point = { x: xValue, y: yValue };
    data.push(point);
    exportData += `${point.x}\t${point.y}\n`;
  }
  // Saturation
  let liqData = [];
  let vapData = [];
  const count = 20;
  let delta = (yMax - yMin) / count;
  if (delta === 0) {
    delta = (yMin * 1.1 - yMin * 0.9) / count;
    yMin = 0.9 * yMin;
  }
  let exportVap = `\nSat. vap.\n${xAxis}\t${yAxis}\n`;
  exportData += `\nSat. liq.\n${xAxis}\t${yAxis}\n`;
  let ySat, xSat;
  for (let i = 0; i < count + 1; i++) {
    ySat = yMin + delta * i;
    // Liq.
    xSat = Module.PropsSI(xName, yName, ySat, "Q", 0, fluid);
    if (xSat !== Infinity) {
      xSat = xName === "D" ? 1 / xSat : xSat;
      let pointLiq = { x: xSat, y: ySat };
      liqData.push(pointLiq);
      exportData += `${pointLiq.x}\t${pointLiq.y}\n`;
    }
    // Sat vap.
    xSat = Module.PropsSI(xName, yName, ySat, "Q", 1, fluid);
    if (xSat !== Infinity) {
      xSat = xName === "D" ? 1 / xSat : xSat;
      let pointVap = { x: xSat, y: ySat };
      vapData.push(pointVap);
      exportVap += `${pointVap.x}\t${pointVap.y}\n`;
    }
  }
  exportData += exportVap;
  let dataPoints = {
    datasets: [
      {
        label: "States",
        lineTension: 0,
        fill: false,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(0, 0, 0, 1)",
        data: data,
        showLine: false,
        pointRadius: 5,
      },
      {
        label: "Sat. liq.",
        backgroundColor: "rgba(0, 0, 255, 1)",
        borderColor: "rgba(0, 0, 255, 1)",
        data: liqData,
        pointRadius: 0,
        fill: false,
      },
      {
        label: "Sat. vap.",
        backgroundColor: "rgba(255, 0, 0, 1)",
        borderColor: "rgba(255, 0, 0, 1)",
        data: vapData,
        pointRadius: 0,
        fill: false,
      },
    ],
  };
  // Process
  let isoLines = ["P", "S", "T", "H", "D"]; // T can't be first
  let isoData = [];
  exportData += `\nProcess\n${xAxis}\t${yAxis}\n`;
  for (let i = 0; i < stateList.length - 1; i++) {
    for (let j = 0; j < isoLines.length; j++) {
      let prop = isoLines[j];
      if (stateList[i][prop] == stateList[i + 1][prop]) {
        isoData.push(data[i]);
        exportData += `${data[i].x}\t${data[i].y}\n`;
        if (prop === yName || prop === xName) {
          break;
        }
        // Check mixtures
        if (prop === "T" || prop === "P") {
          // Check if the state is a mixture and the next state is not
          let thisState = stateList[i];
          let nextState = stateList[i + 1];
          if ((thisState.Q !== -1) & (nextState.Q === -1)) {
            // 2 - gas ; 5 - supercritical gas ; 6 - two phase ; 0 - liquid ; 3 - supercritical liquid
            let nextPhase = Module.PropsSI(
              "Phase",
              nextState.first[0],
              nextState.first[1],
              nextState.second[0],
              nextState.second[1],
              fluid
            );
            let Qpoint;
            if ((nextPhase === 2) | (nextPhase === 5)) {
              Qpoint = 1;
            } else if ((nextPhase === 0) | (nextPhase === 3)) {
              Qpoint = 0;
            }
            let xValue = Module.PropsSI(
              xName,
              "T",
              thisState.T,
              "Q",
              Qpoint,
              fluid
            );
            let yValue = Module.PropsSI(
              yName,
              "T",
              thisState.T,
              "Q",
              Qpoint,
              fluid
            );
            yValue = yName === "D" ? 1 / yValue : yValue;
            xValue = xName === "D" ? 1 / xValue : xValue;
            let point = { x: xValue, y: yValue };
            isoData.push(point);
            exportData += `${point.x}\t${point.y}\n`;
          }
        }
        if (type.value === "Ph") {
          let yBegin = data[i].y;
          let yEnd = data[i + 1].y;
          if (yName === "D") {
            yBegin = 1 / yBegin;
            yEnd = 1 / yEnd;
          }
          addIso(
            isoData,
            "y",
            prop,
            stateList[i][prop],
            yEnd,
            yBegin,
            yName,
            xName,
            fluid
          );
          break;
        } else {
          let xBegin = data[i].x;
          let xEnd = data[i + 1].x;
          if (xName === "D") {
            xBegin = 1 / xBegin;
            xEnd = 1 / xEnd;
          }
          addIso(
            isoData,
            "x",
            prop,
            stateList[i][prop],
            xEnd,
            xBegin,
            xName,
            yName,
            fluid
          );
          break;
        }
      }
      if (j === isoLines.length - 1) {
        isoData.push(data[i]);
        exportData += `${data[i].x}\t${data[i].y}\n`;
      }
    }
  }
  isoData.push(data[stateList.length - 1]);
  exportData += `${data[stateList.length - 1].x}\t${
    data[stateList.length - 1].y
  }\n`;
  let isoDataPlot = {
    label: "Process",
    lineTension: 0,
    borderDash: [5],
    fill: false,
    backgroundColor: "rgba(0, 0, 0, 1)",
    borderColor: "rgba(0, 0, 0, 1)",
    data: isoData,
    pointRadius: 0,
  };
  dataPoints.datasets.push(isoDataPlot);
  // Draw plot - could be a function;
  let canvas = createPlot(dataPoints, xAxis, yAxis);
  // Show
  let solutionDiv = document.getElementById("solBox");
  solutionDiv.style.display = "none";
  console.log("Plot time:", performance.now() - t1, "ms");
  return canvas;
}
