"use strict";
/*global Module Chart, laineSolver, laineError, parser*/
/*exported getStates, exportData, checkParametric, plotParametric, checkStates, plotStates */

// Data for download
let exportData;

/**
 * Creates a canvas with the plot
 * @param {object} dataObject - Data to plot
 * @param {string} xName - Name of x
 * @param {string} yName - Name of y
 * @returns canvas
 */
function createPlot(dataObject, xName, yName) {
  // Creates canvas and change it size
  let canvas = document.createElement("canvas");
  if (window.innerWidth < 400) {
    canvas.height = window.innerWidth * 0.8;
    canvas.width = window.innerWidth * 0.8;
  } else {
    canvas.height = "400";
    canvas.width = "400";
  }
  let ctx = canvas.getContext("2d");
  // For property plots use a legend
  let legend = dataObject.datasets.length > 1 ? true : false;
  // Creates the chart
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

/*
  Parametric plots - 2D(x vs. y)
*/

/**
 * Checks if there is one degree of freedom and returns variables names
 * @param {string} text - set of equations in text
 * @returns Set
 */
function checkParametric(text) {
  // Check if the problem has 1 degree of freedom
  let equations = laineSolver(text, { returnProblem: true });

  // Get names of variables
  let namesX = new Set();
  let namesY = new Set();
  for (let equation of equations.e) {
    for (let name of equation.vars) {
      namesX.add(name);
      namesY.add(name);
    }
  }
  /*
  let counter = {};
  for (let equation of equations.s) {
    if (namesX.size === 0){
      for (let name of equation.vars) {
        namesY.add(name);
        // To verify if there is a exception
        if (counter[name] === undefined){
          counter[name]=1;
        } else{
          counter[name]+=1;
        }
      }
    } else{
      let varList = [];
      for (let name of equation.vars){
        if (!namesX.has(name)){
          varList.push(name);
        }
      }
      if (varList.length === 1){
        namesY.add(varList[0]);
      }
    }
  }
  */
  // If there is no degree of freedom
  if (!equations || namesX.size === 0) {
    // Check if there is only simple equations in function of a common variable
    /*
    if(namesY.size !== 0){
      for (let name of namesY){
        if (counter[name]===equations.s.length){
          namesX.add(name);
          return {x:namesX, y:namesY}
        }
      }
    }
    */
    throw new laineError(
      "No degree of freedom",
      "Parametric analysis requires a problem with one degree of freedom",
      "All lines",
      "Try to remove an equation which constrains the problem"
    );
  }

  // Calculate degree of freedom and verify if is one
  const degrees = namesX.size - equations.e.length;
  if (degrees > 1 || degrees == 0) {
    throw new laineError(
      `${degrees} degrees of freedom`,
      "Parametric analysis requires a problem with just one degree of freedom",
      "All lines",
      `Try to include ${degrees - 1} equation(s)`
    );
  }
  return {x:namesX,y:namesY};
}

/**
 * Creates a parametric plot
 * @param {string} text - Text with equations
 * @param {object} options - Plot options
 * @returns canvas
 */
function plotParametric(text, options) {
  const t1 = performance.now();
  // Get options
  let xName = options.x;
  let yName = options.y;
  let from = parser.evaluate(options.from);
  let to = parser.evaluate(options.to);
  const Npoints = options.points;
  const delta = (to - from) / (Npoints - 1);
  // Create plot data
  let data = [];
  exportData = `${xName}\t${yName}\n`;
  // Store guesses
  let storeSolution = {};
  // Equations - get text and names
  let equations = laineSolver(text, { returnProblem: true });
  let equationsText = "";
  let names = new Set();
  for (let equation of equations.e) {
    equationsText += `${equation.lhs}=${equation.rhs}\n`;
    for (let name of equation.vars) {
      names.add(name);
    }
  }
  /*
  for (let equation of equations.s) {
    equationsText += `${equation.lhs}=${equation.rhs}\n`;
    for (let name of equation.vars) {
      names.add(name);
    }
  }
  */
  // Loop solver
  let errors = [];
  for (let i = 0; i < Npoints; i++) {
    let stateVar = `${xName} = ${from + delta * i}\n`;
    try {
      if (i === 0) {
        laineSolver(stateVar + text);
      } else {
        parser.set(xName,from+delta*i);
        laineSolver(equationsText, {
          savedSolution: storeSolution,
          solveFor: yName,
        });
      }
    } catch {
      errors.push(from + delta * i);
      // Delete solutions from parser
      for (let name of names) {
        parser.remove(name);
      }
      continue;
    }

    // Store data
    let point = {
      x: parser.scope[xName],
      y: parser.scope[yName].toPrecision(5),
    };
    data.push(point);
    exportData += `${point.x}\t${point.y}\n`;

    // Store solution and delete it from parser
    storeSolution = parser.getAll();

    // Delete solutions from parser
    for (let name of names) {
      parser.remove(name);
    }
  }

  // Throw errors
  if (errors.length > 0) {
    let error = new laineError(
      "Incomplete parametric analysis",
      "laine failed to find solution(s) at some point(s)",
      `x = ${errors.join(",\nx = ")}`,
      "Verify if the problem is correct and change the x range"
    );
    throw error;
  }

  // Creates plot canvas
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

/*
  Property plots
*/

/**
 * Stores the info about a thermodynamic state
 * @class
 */
class State {
  /**
   * @param {string} text - Text inside the PropsSI() function
   */
  constructor(text) {
    const pieces = text.split(",");
    // State definition
    this.first = [pieces[1].slice(1, -1), parser.evaluate(pieces[2])];
    this.second = [pieces[3].slice(1, -1), parser.evaluate(pieces[4])];
    // Word or variable?
    if (pieces[5][0] !== '"' && pieces[5][0] !== "'"){
      this.fluid = parser.get(pieces[5]);
    } else{
      this.fluid = pieces[5].slice(1, -1);
    }
    this.memory = {};
    // Is much faster to just store this values here
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
    this.H = Module.PropsSI(
      "H",
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
    this.Q = Module.PropsSI(
      "Q",
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
}

/**
 * Finds and creates an array of states
 * @param {string} text - input text from user
 * @returns State[]
 */
function getStates(text) {
  let states = [];
  // Grab text and match PropsSI calls
  const regexComment = /#.*/g; // removes comments
  const regex = /(?<!HA)PropsSI\(.*(?=\))/g; // captures PropsSI(...
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

/**
 * Creates a plot
 * @param {State[]} stateList - Array of states
 * @param {string} type - Type of plot
 * @returns canvas
 */
function plotStates(stateList, type) {
  const t1 = performance.now();

  // Axis definition
  let xName, yName, xAxis, yAxis;
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
  exportData = `States\n${xAxis}\t${yAxis}\n`;
  let data = [];
  let fluid = stateList[0].fluid;
  let yMin = Infinity;
  let yMax = 0;
  let xValue, yValue;
  for (let state of stateList) {
    xValue = state[xName];
    yValue = state[yName];
    if (yValue < yMin) {
      yMin = yValue;
    }
    if (yValue > yMax) {
      yMax = yValue;
    }
    xValue = xName === "D" ? 1 / xValue : xValue;
    let point = { x: xValue, y: yValue };
    data.push(point);
    exportData += `${xValue}\t${yValue}\n`;
  }

  // Saturation
  let liqData = [];
  let vapData = [];
  const nPoints = 20;
  let delta = (yMax - yMin) / nPoints;
  if (delta === 0) {
    delta = (yMin * 1.1 - yMin * 0.9) / nPoints;
    yMin = 0.9 * yMin;
  }
  let exportVap = `\nSat. vap.\n${xAxis}\t${yAxis}\n`;
  exportData += `\nSat. liq.\n${xAxis}\t${yAxis}\n`;
  let ySat, xSat;
  for (let i = 0; i < nPoints + 1; i++) {
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
      if (stateList[i][prop] === stateList[i + 1][prop]) {
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
          if (thisState["Q"] !== -1 && nextState["Q"] === -1) {
            // 2 - gas ; 5 - supercritical gas ; 6 - two phase ; 0 - liquid ; 3 - supercritical liquid
            let nextPhase = Module.PropsSI(
              "Phase",
              nextState.first[0],
              nextState.first[1],
              nextState.second[0],
              nextState.second[1],
              nextState.fluid
            );
            let Qpoint;
            if (nextPhase === 2 || nextPhase === 5) {
              Qpoint = 1;
            } else if (nextPhase === 0 || nextPhase === 3) {
              Qpoint = 0;
            }
            let T = thisState["T"];
            let xValue = Module.PropsSI(xName, "T", T, "Q", Qpoint, fluid);
            let yValue = Module.PropsSI(yName, "T", T, "Q", Qpoint, fluid);
            yValue = yName === "D" ? 1 / yValue : yValue;
            xValue = xName === "D" ? 1 / xValue : xValue;
            let point = { x: xValue, y: yValue };
            isoData.push(point);
            exportData += `${point.x}\t${point.y}\n`;
          }
        }
        // For some reason, CoolProp is really slow for some calls;
        // Here "Ph" is treated differently to be faster
        if (type.value === "Ph") {
          let yBegin = yName === "D" ? 1 / data[i].y : data[i].y;
          let yEnd = yName === "D" ? 1 / data[i + 1].y : data[i + 1].y;
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
          let xBegin = xName === "D" ? 1 / data[i].x : data[i].x;
          let xEnd = xName === "D" ? 1 / data[i + 1].x : data[i + 1].x;
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
      // Not found anything similar between two states
      if (j === isoLines.length - 1) {
        isoData.push(data[i]);
        exportData += `${data[i].x}\t${data[i].y}\n`;
      }
    }
  }
  isoData.push(data[stateList.length - 1]);

  // Export data
  exportData += `${data[stateList.length - 1].x}\t${
    data[stateList.length - 1].y
  }\n`;

  // Plot data
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
  console.log("Plot time:", performance.now() - t1, "ms");
  return canvas;
}

/**
 * Appends data points of an iso-process
 * @param {object[]} data Array of point objects
 * @param {char} coord - The coordinate that it will vary
 * @param {string} propName - Fixed property name (PropsSI)
 * @param {number} propValue - Fixed property value
 * @param {number} max - Max value of coord
 * @param {number} min - Min value of coord
 * @param {string} name - Name of x coordinate (property)
 * @param {string} otherName - Name of the other coordinate
 * @param {string} fluid - Fluid name
 * @returns data
 */
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
