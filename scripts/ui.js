"use strict";

// LINTER
// Imported from third-party
/*global CodeMirror, showdown, MathJax, math */

// Imported from laine.js
/*global checkLine, parser, laineSolver */
// Imported from plots.js
/*global plot_check, laine_plot, plotStates, exportData, getStates */

// Exported to html
/*exported saveFile, exportDataFile, loadFileAsText */

// EDITOR
let textBox = document.querySelector(".box");
const editor = CodeMirror.fromTextArea(textBox, {
  scrollbarStyle: "null",
  viewportMargin: Infinity,
  lineNumbers: true,
  lineWrapping: true,
  inputStyle: "textarea",
  mode: "laine",
});


// SHOW SOLUTIONS, EQUATIONS AND ERRORS
// Solution and report divs
const outDiv = document.querySelector(".out");
const mathDiv = document.querySelector(".mathDiv");

function writeEqs(inputText) {
  // Function : Write equations for reports
  const lines = inputText.split("\n");
  const linesLength = lines.length;
  // Clear and start
  mathDiv.innerHTML = "";
  let converter = new showdown.Converter();
  for (let i = 0; i < linesLength; i++) {
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

function displayResults(fast) {
  // Function: write answers
  outDiv.innerText = ""; // clear space
  const solutions = Object.entries(parser.getAll());
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

function displayError(e) {
  // Function: display error messages
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

function writeAns(solution, fast) {
  // Function: write answers in the results box
  let key = solution[0];
  let value = solution[1];
  let msg, text;
  // Convert
  if (typeof value === "number") {
    value = value.toPrecision(5);
    text = value.toString();
  } else if (typeof value === "function") {
    return null;
  } else if (typeof value === "object") {
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
      }
    }
    text += "}";
  }
  // Render
  if (fast) {
    let para = outDiv.insertRow(-1);
    let varCell = para.insertCell(0);
    varCell.textContent = key;
    let valueCell = para.insertCell(1);
    valueCell.textContent = text;
  } else {
    msg = key + " = " + text;
    let para = document.createElement("p");
    para.textContent = "$$" + formatMathJax(msg) + "$$";
    outDiv.appendChild(para);
  }
}

function formatMathJax(line) {
  // Function: make some corrections in the MathJax style
  // Add double equals '=='
  const sides = line.split("=");
  line = sides[0] + "==" + sides[1];
  // Change underlines to [] to render correctly
  const symbols = /(\*|\+|-|\/|\(|\^|=|,|\))/;
  if (line.includes("_")) {
    const pieces = line.split("_");
    line = pieces[0];
    const piecesLength = pieces.length;
    for (let i = 1; i < piecesLength; i++) {
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
  for (let letter of greek) {
    if (line.includes(letter)) {
      const pieces = line.split(letter);
      line = pieces[0];
      const piecesLength = pieces.length;
      for (let j = 1; j < piecesLength; j++) {
        line += `${letter.slice(1)} ${pieces[j]}`; // just add a space
      }
    }
  }
  // Return parse to Tex
  return math.parse(line).toTex({ parenthesis: "auto" });
}

function laine(isfast) {
  // Function: calls solver for buttons and create a error message if necessary
  clearAll();
  const lines = editor.getValue();
  if (!isfast) {
    writeEqs(lines);
  }
  try {
    laineSolver(lines);
    displayResults(isfast);
    // MathJax equations
    editor.refresh(); // avoid problems with resize
    return true;
  } catch (e) {
    //console.error(e);
    displayError(e);
    return false;
  }
}

// EDITOR
// Adding effects with changes
const editorDiv = document.querySelector(".CodeMirror");
const solBox = document.getElementById("solBox");
const errorGrid = document.querySelector(".errorGrid");
const errorBox = document.getElementById("errorBox");
const plotPropBox = document.getElementById("contentParametric");
const parametricBox = document.getElementById("contentPropPlot");

// Close menus and windows
function clearDropdown(exceptionID) {
  const genericDropbox = document.querySelectorAll(".dropdownContent");
  for (let generic of genericDropbox) {
    if (exceptionID !== generic.id) generic.style.display = "none";
  }
}
function clearHiddenMenus(exceptionID) {
  const genericMenus = document.querySelectorAll(".hiddenMenu");
  for (let generic of genericMenus) {
    if (exceptionID !== generic.id) generic.style.display = "none";
  }
}
function clearReportView() {
  if (mathDiv.style.display === "block") {
    mathDiv.style.display = "none";
    solBox.style.display = "none";
    editorDiv.style.display = "block";
    reportButton.innerText = window.innerWidth < 600 ? "Report" : "Report (F4)";
  }
  editor.refresh();
}
function clearAll(exceptionID) {
  clearDropdown(exceptionID);
  clearHiddenMenus(exceptionID);
  clearReportView();
}
// Remove menus
// editor is defined on editor.js
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
document.querySelector(".interface").onclick = function () {
  clearDropdown();
};

// HIDDEN MENUS
// Dropdown - hover effect
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
// Dropdown - click effect
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
// Apply to buttons
const dropButtons = document.querySelectorAll(".dropdownButton");
for (let button of dropButtons) {
  dropdownHover(button);
  button.onclick = () => dropdownClick(button);
}
// SUBMENUS
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
// Hidden menus
hiddenMenu("openPropsSI", "contentPropsSI", "closePropsSI");
hiddenMenu("openHAPropsSI", "contentHAPropsSI", "closeHAPropsSI");
hiddenMenu("openNasa", "contentNasa", "closeNasa");
hiddenMenu("openLk", "contentLk", "closeLk");

hiddenMenu("openParametric", "contentParametric", "closeParametric");
const plotMenuButton = document.getElementById("openParametric");
plotMenuButton.onclick = function () {
  clearDropdown();
  let problem;
  try {
    problem = plot_check(editor.getValue());
  } catch (e) {
    displayError(e);
    return false;
  }
  // If is the first run, just create a menu
  let xSelect = document.querySelector(".plotX");
  let ySelect = document.querySelector(".plotY");
  xSelect.options.length = 0;
  ySelect.options.length = 0;
  for (let i = 0; i < problem.names.length; i++) {
    let optX = document.createElement("option");
    let optY = document.createElement("option");
    optX.value = problem.names[i];
    optX.text = problem.names[i];
    optY.value = problem.names[i];
    optY.text = problem.names[i];
    xSelect.add(optX);
    ySelect.add(optY);
  }
  document.getElementById("contentParametric").style.display = "block";
};

hiddenMenu("openPropPlot", "contentPropPlot", "closePropPlot");
const propPlotMenuButton = document.getElementById("openPropPlot");
propPlotMenuButton.onclick = function () {
  clearDropdown();
  // Erase
  stateTable.innerHTML = "";
  tableSize = 1;
  let check = checkStates(editor.getValue());
  if (check) {
    document.getElementById("contentPropPlot").style.display = "block";
  }
};

// PLOT BUTTON
const plotButton = document.querySelector(".plotDraw");
plotButton.onclick = function () {
  clearDropdown();
  let div = document.getElementById("canvasDiv");
  div.innerText = "";

  let options = {
    x: document.querySelector(".plotX").value,
    y: document.querySelector(".plotY").value,
    from: document.querySelector(".plotXfrom").value,
    to: document.querySelector(".plotXto").value,
    points: document.querySelector(".plotNpoints").value
  };

  let canvas;
  let text=editor.getValue();
  try{
    canvas = laine_plot(text,options);
  }
  catch(e){
    displayError(e);
  }
  div.appendChild(canvas);
  document.getElementById("plotDrawBox").style.display = "block";
  editor.refresh();
};

const propPlotButton = document.querySelector(".propPlotDraw");
propPlotButton.onclick = function () {
  clearDropdown();
  let div = document.getElementById("canvasDiv");
  div.innerText = "";
  let canvas;
  try{
    canvas = plotStates(stateTable.children,stateOptions);
  }
  catch(e){
    displayError(e)
  }
  div.appendChild(canvas);
  document.getElementById("plotDrawBox").style.display = "block";
  editor.refresh();
};

const stateTable = document.querySelector(".stateTable");
let tableSize = 1;
let stateOptions; // Global variable for states

function updateNumber() {
  // Function: Update state numbers
  for (let i = 0; i < stateTable.children.length; i++) {
    let row = stateTable.children[i];
    let number = i + 1;
    row.children[0].innerHTML = "(" + number + ")";
  }
  return false;
}
function addState() {
  // Function: creates a new state entry (change it to grids);
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
    updateNumber();
  };
  // Editor
  editor.refresh();
}
const addStateButton = document.querySelector(".plotAddState");
addStateButton.onclick = addState;

function checkStates(text) {
  // Function : Creates the property plot menu

  try {
    laineSolver(text);
  } catch (e) {
    //console.error(e);
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


// CLOSE BUTTON
function hideGrandParentDiv(button) {
  const grandparent = button.parentNode.parentNode;
  button.onclick = function () {
    grandparent.style.display = "none";
    editor.refresh();
  };
}
// Apply
const closeButtons = document.querySelectorAll(".hiddenMenuClose");
for (let button of closeButtons) {
  hideGrandParentDiv(button);
}

// SOLVER AND REPORT
// Button name
const solveButton = document.querySelector(".solve");
const reportButton = document.querySelector(".report");
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
// Solver interface
reportButton.onclick = function () {
  if (mathDiv.style.display === "none") {
    clearDropdown();
    clearHiddenMenus();
    if (laine(false)) {
      reportButton.innerText = window.innerWidth < 600 ? "Edit" : "Edit (F4)";
    }
  } else {
    clearAll();
  }
};
solveButton.onclick = function () {
  clearAll();
  laine(true);
  if (reportButton.innerText === "Edit (F4)") {
    reportButton.click();
  }
};
function shortcut(key) {
  if (key.code === "F2") {
    solveButton.click();
  } else if (key.code === "F4") {
    reportButton.click();
  }
}
document.onkeydown = shortcut;
// Write functions
// PropsSI
function writePropsSI() {
  // Data
  const fluid = document.querySelector(".FluidName");
  const property = document.querySelector(".Property");
  const input1 = document.querySelector(".Input1");
  const input2 = document.querySelector(".Input2");
  const value1 = document.querySelector(".value1");
  const value2 = document.querySelector(".value2");
  const fluidName = fluid.options[fluid.selectedIndex].value;
  const propName = property.options[property.selectedIndex].value;
  const input1Name = input1.options[input1.selectedIndex].value;
  const input2Name = input2.options[input2.selectedIndex].value;
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
    if (propName == trivial) {
      flag = true;
      break;
    }
  }
  if (flag) {
    text = `property=Props1SI('${propName}','${fluidName}')`;
  } else {
    text = `property=PropsSI('${propName}','${input1Name}',${value1.value},'${input2Name}',${value2.value},'${fluidName}')`;
  }
  textBox.value += "\n" + text;
  editor.getDoc().setValue(textBox.value);
  clearDropdown();
}
const PropsSIButton = document.querySelector(".butPropsSI");
PropsSIButton.onclick = writePropsSI;
// HAPropsSI
function writeHAPropsSI() {
  const property = document.querySelector(".HAProperty");
  const input1 = document.querySelector(".HAInput1");
  const input2 = document.querySelector(".HAInput2");
  const input3 = document.querySelector(".HAInput3");
  const value1 = document.querySelector(".HAvalue1");
  const value2 = document.querySelector(".HAvalue2");
  const value3 = document.querySelector(".HAvalue3");
  const propName = property.options[property.selectedIndex].value;
  const input1Name = input1.options[input1.selectedIndex].value;
  const input2Name = input2.options[input2.selectedIndex].value;
  const input3Name = input2.options[input3.selectedIndex].value;
  const text = `property=HAPropsSI('${propName}','${input1Name}',${value1.value},'${input2Name}',${value2.value},'${input3Name}',${value3.value})`;
  textBox.value += "\n" + text;
  editor.getDoc().setValue(textBox.value);
}
const HAPropsSIButton = document.querySelector(".butHAPropsSI");
HAPropsSIButton.onclick = writeHAPropsSI;
// Nasa Glenn
function writeNasa() {
  const property = document.querySelector(".nasaProp");
  const specie = document.querySelector(".nasaSpecie");
  const temp = document.querySelector(".nasaT");
  const propName = property.options[property.selectedIndex].value;
  const text = `property=NasaSI('${propName}',${temp.value},'${specie.value}')`;
  textBox.value += "\n" + text;
  editor.getDoc().setValue(textBox.value);
}
const NasaButton = document.querySelector(".butNasa");
NasaButton.onclick = writeNasa;
// Lee - Kesler
function writelk() {
  const property = document.querySelector(".lkProp");
  const temp = document.querySelector(".lkT");
  const press = document.querySelector(".lkP");
  const propName = property.options[property.selectedIndex].value;
  let text;
  if (propName === "Prsat") {
    text = `property=LeeKesler('${propName}',${temp.value},'f')`;
  } else if (press.value === "f" || press.value === "g") {
    text = `property=LeeKesler('${propName}',${temp.value},'${press.value}')`;
  } else {
    text = `property=LeeKesler('${propName}',${temp.value},${press.value})`;
  }
  textBox.value += "\n" + text;
  editor.getDoc().setValue(textBox.value);
}
const leeKeslerButton = document.querySelector(".butlk");
leeKeslerButton.onclick = writelk;
// File menu
// New file
function newFile() {
  // Textbox defined in editor.js
  let confirmation = confirm("Are you sure?");
  if (confirmation) {
    textBox.value = "";
    editor.getDoc().setValue(textBox.value);
  }
  clearDropdown();
}
const newButton = document.querySelector(".new");
newButton.onclick = newFile;
// Save a file
function destroyClickedElement(event) {
  document.body.removeChild(event.target);
}
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
// Load a file
let fileInput = document.getElementById("fileToLoad");
function loadFileAsText() {
  clearAll();
  fileInput.click();
  if (reportButton.innerText == "Edit (F4)") {
    reportButton.click();
  }
}
function changeText() {
  let fileToLoad = fileInput.files[0];
  let fileReader = new FileReader();
  fileReader.onload = function (fileLoadedEvent) {
    let textFromFileLoaded = fileLoadedEvent.target.result;
    editor.getDoc().setValue(textFromFileLoaded);
  };
  fileReader.readAsText(fileToLoad, "UTF-8");
}
fileInput.addEventListener(
  "change",
  function () {
    changeText();
    fileInput.value = "";
  },
  false
);
// Close warning
window.onbeforeunload = function (e) {
  e = e || window.event;
  // For IE and Firefox prior to version 4
  if (e) {
    e.returnValue = "Sure?";
  }
  // For Safari
  return "Sure?";
};
