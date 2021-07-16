"use strict";

/*
  imported
*/ 
// from third-party
/*global showdown, MathJax, math */

// from laine.js
/*global checkLine, parser, laineSolver */

// Imported from plots.js
/*global checkParametric, plotParametric, plotStates, exportData, getStates */

// Imported from editor.js
/*global editor, textBox*/

/*
  exported
*/
// to html
/*exported saveFile, exportDataFile, loadFileAsText */

/*
  DOM
*/
const editorDiv = document.querySelector(".CodeMirror");
const solBox = document.getElementById("solBox");
const errorGrid = document.querySelector(".errorGrid");
const errorBox = document.getElementById("errorBox");
const plotPropBox = document.getElementById("contentParametric");
const parametricBox = document.getElementById("contentPropPlot");
const mathDiv = document.querySelector(".mathDiv");
const outDiv = document.querySelector(".out");

/*
  Solver wrapper
*/

/**
 * Calls the solver and display results/errors
 * @param {bool} isfast - If is fast
 * @returns bool
 */
 function laine(isfast) {
  const lines = editor.getValue();
  if (!isfast) {
    writeEqs(lines);
  }
  try {
    laineSolver(lines);
  } catch (e) {
    displayError(e);
    return false;
  }
  displayResults(isfast);
  if (isfast){
    editor.refresh(); // avoid problems with resize
  }
  return true;
}

/*
  Render equations
*/ 

/**
 * Formats the equations for MathJax render and using showdown
 * @param {string} inputText - text with equations
 */
function writeEqs(inputText) {
  const lines = inputText.split("\n");
  // Clear and start
  mathDiv.innerHTML = "";
  let converter = new showdown.Converter();
  for (let i = 0; i < lines.length; i++) {
    // Check if is an equation or comment
    if (checkLine(lines[i].trim(), i)) {
      // Check if is there is more than one equation
      const aux = lines[i].split(";");
      for (let subline of aux) {
        // Separate side comments
        const sep = subline.split("#");
        // Long space and join comments
        let comment = "\\;\\text{";
        for (let j = 1; j < sep.length; j++) {
          comment += sep[j];
        }
        let para = document.createElement("p");
        try {
          para.textContent = "$$" + formatMathJax(sep[0]) + comment + "}$$";
        } catch {
          para.textContent = "$$" + sep[0] + comment + "}$$";
        }
        mathDiv.appendChild(para);
      }
    } else {
      // Disables markdown format if there is an equation
      let flag = false;
      const dels = [
        new RegExp("\\$\\$"),
        new RegExp("\\\\\\("),
        new RegExp("\\\\\\["),
      ];
      for (let del of dels) {
        if (lines[i].match(del)) {
          flag = true;
          break;
        }
      }
      if (flag) {
        mathDiv.innerHTML += `<p>${lines[i].slice(1)}</p>`;
      } else {
        mathDiv.innerHTML += converter.makeHtml(lines[i].slice(1));
      }
    }
  }
}

const greek = [
  "$alpha",
  "$beta",
  "$gamma",
  "$delta",
  "$epsilon",
  "$zeta",
  "$eta",
  "$theta",
  "$iota",
  "$kappa",
  "$lambda",
  "$mu",
  "$nu",
  "$xi",
  "$omicron",
  "$pi",
  "$rho",
  "$sigma",
  "$tau",
  "$upsilon",
  "$phi",
  "$chi",
  "$psi",
  "$omega",
  "$Alpha",
  "$Beta",
  "$Gamma",
  "$Delta",
  "$Epsilon",
  "$Zeta",
  "$Eta",
  "$Theta",
  "$Iota",
  "$Kappa",
  "$Lambda",
  "$Mu",
  "$Nu",
  "$Xi",
  "$Omicron",
  "$Pi",
  "$Rho",
  "$Sigma",
  "$Tau",
  "$Upsilon",
  "$Phi",
  "$Chi",
  "$Psi",
  "$Omega",
];

/**
 * Formats an equation into MathJax
 * @param {string} line - An equation line
 * @returns string
 */
function formatMathJax(line) {
  // Add double equals '=='
  const sides = line.split("=");
  line = sides[0] + "==" + sides[1];
  // Change underlines to [] to render correctly
  const symbols = /(\*|\+|-|\/|\(|\^|=|,|\))/;
  if (line.includes("_")) {
    const pieces = line.split("_");
    line = pieces[0];
    for (let i = 1; i < pieces.length; i++) {
      const piece = pieces[i];
      line += "[";
      const pieceLength = piece.length;
      for (let j = 0; j < pieceLength; j++) {
        if (symbols.test(piece[j])) {
          line += piece.slice(0, j) + "]" + piece.slice(j, pieceLength);
          break;
        } else if (j === pieceLength - 1) {
          if (piece.slice(pieceLength - 1, pieceLength) === "}") {
            line +=
              piece.slice(0, pieceLength - 1) +
              "]" +
              piece.slice(pieceLength - 1, pieceLength);
          } else {
            line += piece + "]";
          }
        }
      }
    }
    // Double underlines
    if (line.includes("][")) {
      line = line.replace(/\]\[/g, ",");
    }
  }
  // Change greek variables names into symbols (not optimized)
  if (line.includes("$")){
    for (let letter of greek) {
      if (line.includes(letter)) {
        const pieces = line.split(letter);
        line = pieces[0];
        for (let j = 1; j < pieces.length; j++) {
          line += `${letter.slice(1)} ${pieces[j]}`; // just add a space
        }
      }
    }
  }
  // Return parse to Tex
  return math.parse(line).toTex({ parenthesis: "auto" });
}

/*
  Render results
*/

/**
 * Creates the answer table
 * @param {bool} fast - a fast or slow (MathJax) render
 */
function displayResults(fast) {
  outDiv.innerText = ""; // clear space
  const solutions = Object.entries(parser.getAll());
  solutions.sort(); // alphabetically
  for (let solution of solutions) {
    writeAns(solution, fast);
  }
  if (fast) {
    mathDiv.style.display = "none";
    editorDiv.style.display = "block";
  } else {
    mathDiv.style.display = "block";
    editorDiv.style.display = "none";
    MathJax.typeset();
  }
  solBox.style.display = "grid";
}

/**
 * Writes the answers in the results box
 * @param {[string,number|object]} solution - Solution from parser
 * @param {bool} fast - If the option is fast
 * @returns 
 */
function writeAns(solution, fast) {
  let key = solution[0];
  let value = solution[1];
  let msg, text;
  // Convert
  if (typeof value === "number") {
    value = value.toPrecision(5);
    text = value.toString();
  } else if (typeof value === "object") {
    // Print common objects
    if (value.type === undefined){
      value = Object.entries(value);
      text = "{";
      const valueLength = value.length;
      for (let i = 0; i < valueLength; i++) {
        if (typeof value[i][1] === "number") {
          value[i][1] = value[i][1].toPrecision(5);
        }
        text += value[i][0] + " : " + value[i][1];
        if (i < valueLength - 1) {
          text += " ,";
          if(fast){
            text += "<br>"; 
          }
        }
      }
      text += "}";
    } else{
      // Print units, matrix and etc.
      text = value.toString();
    }
  } else if(typeof value === "string"){
    text = `"${value.toString()}"`;
  } else{
    return null;
  }
  // Render
  if (fast) {
    let para = outDiv.insertRow(-1);
    let varCell = para.insertCell(0);
    varCell.textContent = key;
    let valueCell = para.insertCell(1);
    valueCell.innerHTML = text;
  } else {
    msg = key + " = " + text;
    let para = document.createElement("p");
    para.textContent = "$$" + formatMathJax(msg) + "$$";
    outDiv.appendChild(para);
  }
}

/*
  Show errors
*/

/**
 * Displays the error for the user
 * @param {laineError} e - A LaineError object
 */
function displayError(e) {
  errorGrid.innerText = "";
  const texts = [
    "<b>Type</b>",
    e.name,
    "<b>Where?</b>",
    e.lineNumber,
    "<b>What?</b>",
    e.message,
    "<b>Help</b>",
    e.help,
  ];
  // Include elements
  for (let text of texts) {
    let elem = document.createElement("span");
    elem.innerHTML = text;
    errorGrid.appendChild(elem);
  }
  // Display box
  errorBox.style.display = "block";
  editor.refresh();
}

/*
  Clear menus and windows
*/

/**
 * Clears the dropdown menus
 * @param {string} exceptionID - exception ID
 */
function clearDropdown(exceptionID) {
  const genericDropbox = document.querySelectorAll(".dropdownContent");
  for (let generic of genericDropbox) {
    if (exceptionID !== generic.id) generic.style.display = "none";
  }
}

/**
 * Clears the menus
 * @param {string} exceptionID - exception id
 */
function clearHiddenMenus(exceptionID) {
  const genericMenus = document.querySelectorAll(".hiddenMenu");
  for (let generic of genericMenus) {
    if (exceptionID !== generic.id) generic.style.display = "none";
  }
}

/**
 * Clears the report view
 */
function clearReportView() {
  if (mathDiv.style.display === "block") {
    mathDiv.style.display = "none";
    solBox.style.display = "none";
    editorDiv.style.display = "block";
    reportButton.innerText = window.innerWidth < 600 ? "Report" : "Report (F4)";
  }
}

/**
 * Wrapper to clear all windows, dropdown and report
 * @param {string} exceptionID - Exception ID
 */
function clearAll(exceptionID) {
  clearDropdown(exceptionID);
  clearHiddenMenus(exceptionID);
  clearReportView();
}

// Apply clear functions into elements

// editor
editor.on("click", function () {
  clearDropdown();
});
editor.on("focus", function () {
  clearDropdown();
});
editor.on("change", function () {
  textBox.value = editor.getValue();
  solBox.style.display = "none";
  plotPropBox.style.display = "none";
  parametricBox.style.display = "none";
});

// interface
document.querySelector(".interface").onclick = function () {
  clearDropdown();
};

/*
  Dropdown menus
*/

/**
 * Adds a hover effect in a dropdown menu
 * @param {element} button - A button element
 */
function dropdownHover(button) {
  const content = button.nextElementSibling;
  button.onmouseover = function () {
    if (window.innerWidth >= 600) {
      content.style.display = "grid";
    }
  };
  const menu = button.parentNode;
  menu.onmouseleave = function () {
    content.style.display = "none";
    document.activeElement.blur();
  };
}

/**
 * Adds a click effect in a dropdown menu
 * @param {element} button - A button element
 */
function dropdownClick(button) {
  const content = button.nextElementSibling;
  const display = content.style.display; // Store
  clearDropdown();
  if (display !== "grid") {
    content.style.display = "grid";
  } else {
    content.style.display = "none";
    document.activeElement.blur();
  }
}

// Apply functions to all dropdown buttons
const dropButtons = document.querySelectorAll(".dropdownButton");
for (let button of dropButtons) {
  dropdownHover(button);
  button.onclick = () => dropdownClick(button);
}

/*
  Hidden menus
*/

/**
 * Adds open, close effects to a hidden menu
 * @param {string} openId - Button id to open menu
 * @param {string} contentId - id for the content in the menu
 * @param {string} closeId - id for the button to close the menu
 */
function hiddenMenu(openId, contentId, closeId) {
  const open = document.getElementById(openId);
  const content = document.getElementById(contentId);
  const close = document.getElementById(closeId);
  open.onclick = function () {
    clearDropdown();
    content.style.display = "block";
    editor.refresh();
  };
  close.onclick = function () {
    content.style.display = "none";
    editor.refresh();
  };
}

// Applies function to hidden menus 
hiddenMenu("openPropsSI", "contentPropsSI", "closePropsSI");
hiddenMenu("openHAPropsSI", "contentHAPropsSI", "closeHAPropsSI");
hiddenMenu("openNasa", "contentNasa", "closeNasa");
hiddenMenu("openLk", "contentLk", "closeLk");

// Parametric menu (needs special function)
hiddenMenu("openParametric", "contentParametric", "closeParametric");
const plotMenuButton = document.getElementById("openParametric");
plotMenuButton.onclick = function () {
  clearDropdown();
  // Get names from problem
  let names;
  try {
    names = checkParametric(editor.getValue());
  } catch (e) {
    displayError(e);
    return false;
  }
  // Clear selections (x and y)
  let xSelect = document.querySelector(".plotX");
  let ySelect = document.querySelector(".plotY");
  xSelect.options.length = 0;
  ySelect.options.length = 0;
  // Include options
  for (const name of names.x) {
    let optX = document.createElement("option");
    optX.value = name;
    optX.text = name;
    xSelect.add(optX);
  }
  for (const name of names.y) {
    let optY = document.createElement("option");
    optY.value = name;
    optY.text = name;
    ySelect.add(optY);
  }
  // Show menu
  document.getElementById("contentParametric").style.display = "block";
  editor.refresh();
};

// Property plot (also needs special functions)
hiddenMenu("openPropPlot", "contentPropPlot", "closePropPlot");
const propPlotMenuButton = document.getElementById("openPropPlot");
propPlotMenuButton.onclick = function () {
  clearDropdown();
  // Erase state table
  stateTable.innerHTML = "";
  tableSize = 1;
  // Update state options
  let check = checkStates(editor.getValue());
  // Show menu
  if (check) {
    document.getElementById("contentPropPlot").style.display = "block";
  }
  editor.refresh();
};

/*
  Special functions for Property plots
*/

let stateOptions; // Global variable for states
const stateTable = document.querySelector(".stateTable");
let tableSize = 1;

/**
 * Stores state option into a global variable
 * @param {string} text - problem text
 * @returns bool
 */
function checkStates(text) {
  // Verify if the problem is valid
  try {
    laineSolver(text);
  } catch (e) {
    displayError(e);
    return false;
  }
  // Parse PropsSI calls into states
  let states = getStates(text);
  // Create the menu
  let optionText;
  let fluids = [];
  let options = [];
  let optionsEntry = []; // Necessary to verify
  let fluidsSelect = document.querySelector(".propPlotFluid");
  fluidsSelect.options.length = 0;
  for (let i = 0; i < states.length; i++) {
    // Fluids
    if (!fluids.includes(states[i].fluid)) {
      fluids.push(states[i].fluid);
      let fluidOpt = document.createElement("option");
      fluidOpt.value = states[i].fluid;
      fluidOpt.text = states[i].fluid;
      fluidsSelect.add(fluidOpt);
    }
    // States
    if (states[i].Q === -1) {
      optionText =
        "T: " +
        states[i].T.toPrecision(5) +
        " [K] ; P: " +
        states[i].P.toPrecision(5) +
        " [Pa]";
    } else {
      optionText =
        "T: " +
        states[i].T.toPrecision(5) +
        " [K] ; P: " +
        states[i].P.toPrecision(5) +
        " [Pa] ; Q:" +
        states[i].Q.toPrecision(5);
    }
    if (!optionsEntry.includes(optionText)) {
      optionsEntry.push(optionText);
      options.push([optionText, states[i]]);
    }
  }
  // Update global variable
  stateOptions = options;
  return true;
}

/**
 * Function to create a new state entry in the menu
 */
function addState() {
  // Create elements
  let stateRow = document.createElement("div");
  let stateNumber = document.createElement("span");
  let stateSelect = document.createElement("select");
  let stateButton = document.createElement("button");
  // Number
  stateNumber.textContent = "(" + tableSize + ")";
  tableSize += 1;
  stateRow.appendChild(stateNumber);
  // Options
  stateSelect.options.length = 0;
  for (let i = 0; i < stateOptions.length; i++) {
    let option = document.createElement("option");
    option.value = i;
    option.text = stateOptions[i][0];
    stateSelect.add(option);
  }
  stateRow.appendChild(stateSelect);
  // Button
  stateButton.textContent = "Delete";
  stateButton.style.padding = "5px";
  stateRow.appendChild(stateButton);
  // Table
  stateTable.appendChild(stateRow);
  stateButton.onclick = function () {
    stateTable.removeChild(stateRow);
    tableSize -= 1;
    // Updates state number
    for (let i = 0; i < stateTable.children.length; i++) {
      let row = stateTable.children[i];
      let number = i + 1;
      row.children[0].innerHTML = "(" + number + ")";
    }
  };
}
const addStateButton = document.querySelector(".plotAddState");
addStateButton.onclick = addState;

/*
  Close buttons for hidden menus
*/

/**
 * Closes the menu based on the DOM position
 * @param {element} button - A button
 */
function hideGrandParentDiv(button) {
  const grandparent = button.parentNode.parentNode;
  button.onclick = function () {
    grandparent.style.display = "none";
    editor.refresh();
  };
}

// Apply to all buttons
const closeButtons = document.querySelectorAll(".hiddenMenuClose");
for (let button of closeButtons) {
  hideGrandParentDiv(button);
}

/*
  Create plots
*/

const plotButton = document.querySelector(".plotDraw");

/**
 * Creates parametric plots
 */
plotButton.onclick = function () {
  clearDropdown();
  clearHiddenMenus("contentParametric");
  let div = document.getElementById("canvasDiv");
  div.innerText = "";
  let options = {
    x: document.querySelector(".plotX").value,
    y: document.querySelector(".plotY").value,
    from: document.querySelector(".plotXfrom").value,
    to: document.querySelector(".plotXto").value,
    points: document.querySelector(".plotNpoints").value,
  };
  let canvas;
  let text = editor.getValue();
  try {
    canvas = plotParametric(text, options);
  } catch (e) {
    displayError(e);
    document.getElementById("plotDrawBox").style.display = "none";
  }
  div.appendChild(canvas);
  document.getElementById("plotDrawBox").style.display = "block";
  editor.refresh();
};

const propPlotButton = document.querySelector(".propPlotDraw");

/**
 * Creates a property plot
 */
propPlotButton.onclick = function () {
  clearDropdown();
  clearHiddenMenus("contentPropPlot");
  let div = document.getElementById("canvasDiv");
  div.innerText = "";
  let canvas;
  let stateList = []
  let list = stateTable.children;
  for (let i = 0; i < list.length; i++) {
    const stateID = list[i].children[1].value;
    const state = stateOptions[stateID][1];
    stateList.push(state);
  }
  let type = document.querySelector(".propPlotType");
  try {
    canvas = plotStates(stateList, type);
  } catch (e) {
    displayError(e);
  }
  div.appendChild(canvas);
  document.getElementById("plotDrawBox").style.display = "block";
  let solutionDiv = document.getElementById("solBox");
  solutionDiv.style.display = "none";
  editor.refresh();
};

/*
  Solve and report
*/

const solveButton = document.querySelector(".solve");
/**
 * Solver button
 */
solveButton.onclick = function () {
  clearAll();
  laine(true);
  if (reportButton.innerText === "Edit (F4)") {
    reportButton.click();
  }
};

const reportButton = document.querySelector(".report");
/**
 * Report button
 */
reportButton.onclick = function () {
  if (!mathDiv.style.display || mathDiv.style.display === "none") {
    clearDropdown();
    clearHiddenMenus();
    if (laine(false)) {
      reportButton.innerText = window.innerWidth < 600 ? "Edit" : "Edit (F4)";
    }
  } else {
    clearAll();
    editor.refresh();
  }
};

/**
 * Keyboard shortcuts
 * @param {key} key - A keyboard key
 */
function shortcut(key) {
  if (key.code === "F2") {
    solveButton.click();
  } else if (key.code === "F4") {
    reportButton.click();
  }
}
document.onkeydown = shortcut;

/**
 * Changes the menu names for different screen sizes
 */
function changeTextButtons() {
  if (window.innerWidth < 600 && solveButton.innerText === "Solve (F2)") {
    solveButton.innerText = "Solve";
    reportButton.innerText =
      reportButton.innerText == "Report (F4)" ? "Report" : "Edit";
  } else if (window.innerWidth >= 600 && solveButton.innerText === "Solve") {
    solveButton.innerText = "Solve (F2)";
    reportButton.innerText =
      reportButton.innerText == "Report" ? "Report (F4)" : "Edit (F4)";
  }
}
window.onresize = changeTextButtons;

/*
  Thermodynamic functions helper
*/

// Counter
let number = 1;

/**
 * Write a PropsSI call in the editor
 */
function writePropsSI() {
  // Data
  const fluid = document.querySelector(".FluidName").value;
  const property = document.querySelector(".Property").value;
  const input1 = document.querySelector(".Input1").value;
  const input2 = document.querySelector(".Input2").value;
  const value1 = document.querySelector(".value1").value;
  const value2 = document.querySelector(".value2").value;
  // Check if is trivial
  const trivials = [
    "acentric",
    "M",
    "PCRIT",
    "TCRIT",
    "RHOCRIT",
    "RHOMOLAR_CRITICAL",
  ];
  let flag, text;
  for (let trivial of trivials) {
    if (property == trivial) {
      flag = true;
      break;
    }
  }
  // Write function
  if (flag) {
    text = `${property}_${number}=Props1SI('${property}','${fluid}')`;
  } else {
    text = `${property}_${number}=PropsSI('${property}','${input1}',${value1},'${input2}',${value2},'${fluid}')`;
  }
  number+=1;
  textBox.value += "\n" + text;
  editor.getDoc().setValue(textBox.value);
  clearDropdown();
}
const PropsSIButton = document.querySelector(".butPropsSI");
PropsSIButton.onclick = writePropsSI;

/**
 * Write a HAPropsSI call in the editor
 */
function writeHAPropsSI() {
  // Data
  const property = document.querySelector(".HAProperty").value;
  const input1 = document.querySelector(".HAInput1").value;
  const input2 = document.querySelector(".HAInput2").value;
  const input3 = document.querySelector(".HAInput3").value;
  const value1 = document.querySelector(".HAvalue1").value;
  const value2 = document.querySelector(".HAvalue2").value;
  const value3 = document.querySelector(".HAvalue3").value;
  // Write
  const text = `${property}_${number}=HAPropsSI('${property}','${input1}',${value1},'${input2}',${value2},'${input3}',${value3})`;
  number+=1;
  textBox.value += "\n" + text;
  editor.getDoc().setValue(textBox.value);
}
const HAPropsSIButton = document.querySelector(".butHAPropsSI");
HAPropsSIButton.onclick = writeHAPropsSI;

/**
 * Write a NasaSI call in the editor
 */
function writeNasa() {
  // Data
  const property = document.querySelector(".nasaProp").value;
  const specie = document.querySelector(".nasaSpecie").value;
  const inputType = document.querySelector(".nasaInputType").value;
  const input = document.querySelector(".nasaInput").value;
  // Write
  const text = `${property}_${number}=NasaSI('${property}','${inputType}',${input},'${specie}')`;
  number+=1;
  textBox.value += "\n" + text;
  editor.getDoc().setValue(textBox.value);
}
const NasaButton = document.querySelector(".butNasa");
NasaButton.onclick = writeNasa;

/**
 * Write a Lee-Kesler call in the editor
 */
function writelk() {
  const property = document.querySelector(".lkProp").value;
  const input1 = document.querySelector(".lkInput1").value;
  const inputType1 = document.querySelector(".lkInputType1").value;
  const input2 = document.querySelector(".lkInput2").value;
  const inputType2 = document.querySelector(".lkInputType2").value;
  let text = `${property}_${number}=LeeKesler('${property}','${inputType1}',${input1},'${inputType2}',${input2})`;
  number+=1;
  textBox.value += "\n" + text;
  editor.getDoc().setValue(textBox.value);
}
const leeKeslerButton = document.querySelector(".butlk");
leeKeslerButton.onclick = writelk;

/*
  File management
*/

/**
 * Creates a new file
 */
function newFile() {
  let confirmation = confirm("Are you sure?");
  if (confirmation) {
    textBox.value = "";
    editor.getDoc().setValue(textBox.value);
  }
  clearAll();
}
const newButton = document.querySelector(".new");
newButton.onclick = newFile;

/**
 * Saves a file
 */
function saveFile() {
  let textToSave = document.getElementById("box").value;
  let textToSaveAsBlob = new Blob([textToSave], { type: "text/plain" });
  let textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
  let downloadLink = document.createElement("a");
  downloadLink.download = "laineSave.txt";
  downloadLink.innerHTML = "Download File";
  downloadLink.href = textToSaveAsURL;
  downloadLink.onclick = destroyClickedElement;
  downloadLink.style.display = "";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  clearDropdown();
}

/**
 * Destroys downloaded element
 * @param {object} event - An event
 */
 function destroyClickedElement(event) {
  document.body.removeChild(event.target);
}

/**
 * Exports plot data
 */
function exportDataFile() {
  let textToSave = exportData;
  let textToSaveAsBlob = new Blob([textToSave], { type: "text/plain" });
  let textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
  let downloadLink = document.createElement("a");
  downloadLink.download = "laineData.txt";
  downloadLink.innerHTML = "Download File";
  downloadLink.href = textToSaveAsURL;
  downloadLink.onclick = destroyClickedElement;
  downloadLink.style.display = "";
  document.body.appendChild(downloadLink);
  downloadLink.click();
}

/**
 * Wrapper to load a file
 */
 function loadFileAsText() {
  clearAll();
  fileInput.click();
  // Returns to normal editor
  if (reportButton.innerText === "Edit (F4)") {
    reportButton.click();
  }
}

// A file to load (invisible button)
let fileInput = document.getElementById("fileToLoad");
fileInput.addEventListener(
  "change",
  function () {
    changeText();
    fileInput.value = "";
  },
  false
);

/**
 * Loads the file into the editor
 */
function changeText() {
  let fileToLoad = fileInput.files[0];
  let fileReader = new FileReader();
  fileReader.onload = function (fileLoadedEvent) {
    let textFromFileLoaded = fileLoadedEvent.target.result;
    editor.getDoc().setValue(textFromFileLoaded);
  };
  fileReader.readAsText(fileToLoad, "UTF-8");
}

/**
 * Warning to close a window
 * @param {object} e - event listener
 * @returns string
 */
window.onbeforeunload = function (e) {
  e = e || window.event;
  // For IE and Firefox prior to version 4
  if (e) {
    e.returnValue = "Sure?";
  }
  // For Safari
  return "Sure?";
};