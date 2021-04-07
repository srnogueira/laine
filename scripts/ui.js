/*
  REPORTS
*/

const outDiv = document.querySelector(".out"); // Solution element
const mathDiv = document.querySelector(".mathDiv"); // Report element
function writeEqs(inputText){
    /*
      Function : Write equations for reports
    */
    'use strict';
    const lines = inputText.split('\n');
    // Clear and start
    mathDiv.innerHTML="";
    let title=document.createElement('h2');
    let text;
    const linesLength = lines.length;
    for (let i=0; i<linesLength ; i++){
	// Check if is an equation or comment
	if (!lines[i].endsWith('?')){
	    if (checkLine(lines[i].trim(),i)){
		// Check if is there is more than one equation
		const aux = lines[i].split(';');
		for (let subline of aux){
		    // Separate side comments
		    const sep = subline.split('#');
		    // Join comments
		    let comment=' \\text{';
		    const sepLength = sep.length
		    for(let i=1;i<sep.length;i++){
			comment+=sep[i];
		    }
		    let para=document.createElement('p');
		    para.textContent="$$"+formatMathJax(sep[0])+comment+"}$$";
		    mathDiv.appendChild(para);
		}
	    }
	    else{
		// Applies markdown format
		let converter = new showdown.Converter();
		text=lines[i].slice(1,lines[i].length);
		let para = converter.makeHtml(text);
		mathDiv.innerHTML+=para;
	    }
	}
    }    
}

function displayResults(fast){
    // show function
    'use strict';
    outDiv.innerText="";  // clear space
    const solutions = Object.entries(parser.getAll());
    const solutionsLength = solutions.length;
    for (let i=0;i<solutionsLength;i++){
	writeAns(solutions[i],fast);
    }
    if (fast) {
	mathDiv.style.display="none";
	editorDiv.style.display="block";
    }
    else {
	mathDiv.style.display="block";
	editorDiv.style.display="none";
	MathJax.typeset();
    }
    solBox.style.display="inline-block";
}

function displayError(e){
    /*
      Function: display error messages
    */
    'use strict';
    errorBox.innerText = "";
    let header = document.createElement("h2");
    header.innerText= "Error";
    let message = document.createElement("span");
    const messageText = `Type: ${e.name}\nDescription: ${e.message}\nLine: ${e.lineNumber}`;
    message.innerText= messageText;
    errorBox.appendChild(header);
    errorBox.appendChild(message);
    errorBox.style.display = "inline-block";
    editor.refresh();
}

function writeAns(solution,fast){
    /*
      Function: write answers in the results box
    */
    'use strict';
    let key = solution[0];
    let value = solution[1];
    let msg;
    switch (typeof(value)){
    case "number":
    	value = value.toPrecision(5);
	break;
    case "function":
	return null;
    }

    let text;
    if (typeof(value)==="object"){
	value = Object.entries(value);
	text="{";
	const valueLength=value.length;
	for (let i=0;i<valueLength;i++){
	    if (typeof(value[i][1])==="number"){
		value[i][1] = value[i][1].toPrecision(5);
	    }
	    text+=value[i][0]+" : "+value[i][1];
	    if (i<(valueLength-1)){
		text+=" ,";
	    }
	}
	text+='}';
    }
    else{
	text = value.toString();
    }
    
    if(fast){
	let para = outDiv.insertRow(-1);
	let varCell = para.insertCell(0);
	varCell.textContent = key;
	let valueCell = para.insertCell(1);
	valueCell.textContent = text;
    }
    else{
	msg=key+" = "+text;
	let para=document.createElement('p');
	para.textContent="$$"+formatMathJax(msg)+"$$";
	outDiv.appendChild(para);
    }
}

function formatMathJax(line){
    /*
      Function: make some corrections in the MathJax style
    */
    'use strict';
    // Add double equals '=='
    const sides=line.split('=');
    line=sides[0]+'=='+sides[1];

    // Change underlines to [] to render correctly
    const symbols = /(\*|\+|\-|\/|\(|\^|\=|,|\))/;
    if (line.includes("_")){
	const pieces=line.split("_");
	line=pieces[0];
	const piecesLength = pieces.length
	for (let i=1;i<piecesLength;i++){
	    const piece=pieces[i];
	    line+="[";
	    const pieceLength = piece.length;
	    for (let j=0;j<pieceLength;j++){
		if (symbols.test(piece[j])){
		    line+=piece.slice(0,j)+"]"+piece.slice(j,pieceLength);
		    break;
		}
		else if (j===(pieceLength-1)){
		    if (piece.slice(pieceLength-1,pieceLength)==='}'){
			line+=piece.slice(0,pieceLength-1)+"]"+piece.slice(pieceLength-1,pieceLength);
		    }
		    else{
			line+=piece+"]";
		    }
		}
	    }
	}
	// Double underlines
	if (line.includes("][")){
	    line=line.replace(/\]\[/g,",");
	}
    }

    // Change greek variables names into symbols (not optimized)
    const greek = ['$alpha','$beta','$gamma','$delta','$epsilon','$zeta','$eta','$theta','$iota','$kappa','$lambda','$mu','$nu','$xi','$omicron','$pi','$rho','$sigma','$tau','$upsilon','$phi','$chi','$psi','$omega','$Alpha','$Beta','$Gamma','$Delta','$Epsilon','$Zeta','$Eta','$Theta','$Iota','$Kappa','$Lambda','$Mu','$Nu','$Xi','$Omicron','$Pi','$Rho','$Sigma','$Tau','$Upsilon','$Phi','$Chi','$Psi','$Omega'];
    for(let letter of greek){
	if (line.includes(letter)){
	    const pieces=line.split(letter);
	    line = pieces[0];
	    const piecesLength = pieces.length;
	    for (let j =1; j<piecesLength; j++){
		line+=`${letter.slice(1)} ${pieces[j]}`; // just add a space
	    }
	}
    }
    
    // Return parse to Tex
    return math.parse(line).toTex({parenthesis: 'auto'});
}

function laine(isfast){
    /*
      Function: calls solver for buttons and create a error message if necessary
    */
    'use strict';
    errorBox.style.display = "";
    const lines = editor.getValue();
    if (!isfast){
	writeEqs(lines);
    }
    try{
	laineSolver(lines);
	displayResults(isfast);
	// MathJax equations 
	editor.refresh(); // avoid problems with resize
	return true;
    }
    catch(e){
	console.error(e);
	displayError(e);
	return false;
    }
}

/*
  EDITOR
*/
// Adding effects with changes
let editorDiv = document.querySelector(".CodeMirror")
const solBox = document.querySelector(".solBox");
const errorBox = document.querySelector(".errorBox");

editor.on("change",function(){
    textBox.value=editor.getValue();
    solBox.style.display="";
    errorBox.style.display="";
});

/*
  Button name : Mobile vs. Desktop
*/
const solveButton = document.querySelector(".solve");
const reportButton = document.querySelector(".report");

function changeTextButtons() {
    if (window.innerWidth < 600 && solveButton.innerText === "Solve (F2)"){
	solveButton.innerText = "Solve";
	reportButton.innerText = reportButton.innerText == "Report (F4)" ? "Report" : "Edit";
    }
    else if (window.innerWidth >= 600 && solveButton.innerText === "Solve"){
	solveButton.innerText = "Solve (F2)";
	reportButton.innerText = reportButton.innerText == "Report" ? "Report (F4)" : "Edit (F4)";
    }
};
window.onresize = changeTextButtons;

/*
  toggle menus
*/
function toggle(className){
    let x = document.querySelector(className);
    x.style.display = x.style.display === "" ? "block" : "";
};

function clearAll(exception){
    const classes = [".fileBox",".functionBox",".propsBox",".HApropsBox",".nasaBox",".lkBox",".plotBox",".propPlotBox",".plotMenuBox"];
    // Clear all - leave exception
    for (let i=0;i<classes.length;i++){
	if (classes[i] !== exception){
	    document.querySelector(classes[i]).style.display="";
	}
    }
    // Toggle Report button - leave it if is a double click
    if ((reportButton.innerText === "Edit (F4)" || reportButton.innerText === "Edit") && exception !== "report"){
	mathDiv.style.display="";
	solBox.style.display="";
	editorDiv.style.display="block";
	reportButton.innerText=window.innerWidth < 600 ? "Report" : "Report (F4)";
	editor.refresh();
    }
};

// Remove menus

// editor is defined on editor.js
editor.on("focus",clearAll);
editor.on("click",clearAll);


/*
  Dropdown menus
*/

function dropdownMenu(buttonClass,boxClass,dropdownClass){
    const button = document.querySelector(buttonClass);
    const box = document.querySelector(boxClass);
    button.onclick = function(){
	clearAll(boxClass);
	toggle(boxClass);
    };
    const dropdown = document.querySelector(dropdownClass);
    button.onmouseover = function(){
	if (window.innerWidth >= 600){
	    box.style.display="block";
	}
    };
    dropdown.onmouseleave = () => box.style.display="";
}

// File dropdown menu
dropdownMenu(".file",".fileBox",".fileDropdown");

// Function button
dropdownMenu(".function",".functionBox",".functionDropdown");

// Plots menu
dropdownMenu(".plotMenu",".plotMenuBox",".plotDropdown");

/*
  SubMenus
*/

function subMenus(buttonClass,boxClass,cancelClass){
    const button = document.querySelector(buttonClass)
    button.onclick = function() {
	clearAll();
	toggle(boxClass);
	editor.refresh();
    };
    const cancelButton = document.querySelector(cancelClass)
    cancelButton.onclick = function() {
	toggle(boxClass);
	editor.refresh();
    }
};

// PropsSI
subMenus(".props",".propsBox",".propsCancel");

// HAPropsSI
subMenus(".HAprops",".HApropsBox",".HApropsCancel");

// NasaSI
subMenus(".nasa",".nasaBox",".nasaCancel");

// Lee-Kesler
subMenus(".lk",".lkBox",".lkCancel");

// Parametric analysis
const plotMenuButton = document.querySelector(".plot")
plotMenuButton.onclick = function(){
    clearAll();
    // Global var laineProblem
    laineProblem = plot_check();
    if (laineProblem !== false){
	toggle(".plotBox");
    }
    else{
	solBox.style.display = "";
    }
};

const plotCancelButton = document.querySelector(".plotCancel")
plotCancelButton.onclick = function(){toggle(".plotBox")};

const plotButton  = document.querySelector(".plotDraw");
plotButton.onclick = function(){
    laine_plot();
    toggle(".plotBox");
    editor.refresh();
};

// Property plot
const propPlotMenuButton = document.querySelector(".propPlot")
propPlotMenuButton.onclick = function(){
    clearAll();
    if (checkStates()){
	toggle(".propPlotBox");
    }
};

const propPlotCancelButton = document.querySelector(".propPlotCancel")
propPlotCancelButton.onclick = function(){toggle(".propPlotBox")};

const propPlotButton = document.querySelector(".propPlotDraw")
propPlotButton.onclick = function(){
    clearAll();
    plotStates();
}

// Close buttons
const closeSolutionButton  = document.querySelector(".closeSolution");
closeSolutionButton.onclick = function(){
    solBox.style.display = "";
    editor.refresh();
};

const closePlotButton  = document.querySelector(".closePlot");
closePlotButton.onclick = function(){
    let draw = document.querySelector(".plotDrawBox");
    draw.style.display = "";
    editor.refresh();
};

/*
  Solver interface
*/
function report() {
    if (mathDiv.style.display === "" || mathDiv.style.display === "none"){
	clearAll("report");
	laine(false);
	reportButton.innerText = window.innerWidth < 600 ? "Edit" : "Edit (F4)";
    }
    else{
	clearAll();
    }
}
reportButton.onclick = report;

solveButton.onclick = function(){
    clearAll();
    laine(true);
    if (reportButton.innerText === "Edit (F4)"){
	report();
    }
}

function shortcut(key){
    if (key.code === "F2"){
	solveButton.click();
    }
    else if (key.code === "F4"){
	reportButton.click();
    }
}
document.onkeydown=shortcut;

/*
  Write functions
*/

// PropsSI
function writePropsSI(){
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

    const text = `property=PropsSI('${propName}','${input1Name}',${value1.value},'${input2Name}',${value2.value},'${fluidName}')`;
    textBox.value+="\n"+text;
    editor.getDoc().setValue(textBox.value);
    clearAll();
}
const PropsSIButton = document.querySelector(".butPropsSI");
PropsSIButton.onclick = writePropsSI;

// HAPropsSI
function writeHAPropsSI(){
    const property = document.querySelector(".HAProperty");
    const input1 = document.querySelector(".HAInput1");
    const input2 = document.querySelector(".HAInput2");
    const input3 = document.querySelector(".HAInput3");
    const value1 = document.querySelector(".HAvalue1");
    const value2 = document.querySelector(".HAvalue2");
    const value3 = document.querySelector(".HAvalue3");

    const propName=property.options[property.selectedIndex].value;
    const input1Name=input1.options[input1.selectedIndex].value;
    const input2Name=input2.options[input2.selectedIndex].value;
    const input3Name=input2.options[input3.selectedIndex].value;

    const text = `property=HAPropsSI('${propName}','${input1Name}',${value1.value},'${input2Name}',${value2.value},'${input3Name}',${value3.value})`;
    textBox.value+="\n"+text;
    editor.getDoc().setValue(textBox.value);
    clearAll();
}
const HAPropsSIButton = document.querySelector(".butHAPropsSI");
HAPropsSIButton.onclick = writeHAPropsSI;

// Nasa Glenn
function writeNasa(){
    const property = document.querySelector(".nasaProp");
    const specie = document.querySelector(".nasaSpecie");
    const temp = document.querySelector(".nasaT");
    
    const propName=property.options[property.selectedIndex].value;
    const specieName=specie.options[specie.selectedIndex].value;

    const text=`property=NasaSI('${propName}',${temp.value},'${specie.value}')`;
    textBox.value+="\n"+text;
    editor.getDoc().setValue(textBox.value);
    clearAll();
}
const NasaButton = document.querySelector(".butNasa");
NasaButton.onclick = writeNasa;

// Lee - Kesler
function writelk(){
    const property = document.querySelector(".lkProp");
    const temp = document.querySelector(".lkT");
    const press = document.querySelector(".lkP");    
    const propName = property.options[property.selectedIndex].value;
    
    let text;
    if (propName==="Prsat"){
	text = `property=LeeKesler('${propName}',${temp.value},'f')`;
    }
    else if (press.value === "f" || press.value==='g'){
	text = `property=LeeKesler('${propName}',${temp.value},'${press.value}')`;
    }
    else{
	text = `property=LeeKesler('${propName}',${temp.value},${press.value})`;
    }
    textBox.value+="\n"+text;

    editor.getDoc().setValue(textBox.value);
    clearAll();
}
const leeKeslerButton = document.querySelector(".butlk");
leeKeslerButton.onclick = writelk;

/*
  File menu
*/

// New file
function newFile() {
    // Textbox defined in editor.js
    let confirmation = confirm("Are you sure?");
    let fileName = document.getElementById("inputFileNameToSaveAs")
    if (confirmation){
	textBox.value = "";
	editor.getDoc().setValue(textBox.value);
	fileName.value="";
    }
    clearAll();
};
const newButton = document.querySelector(".new");
newButton.onclick = newFile;

// Save a file
function destroyClickedElement(event) {
    document.body.removeChild(event.target);
};

function saveFile() {
    let textToSave = document.getElementById("box").value;
    let textToSaveAsBlob = new Blob([textToSave], {type:"text/plain"});
    let textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    
    let downloadLink = document.createElement("a");
    const filename = document.getElementById("inputFileNameToSaveAs").value;
    if (filename===""){
	downloadLink.download="laineSave.txt";
    }
    else{ 
	downloadLink.download = filename+".txt";
    }
    downloadLink.innerHTML = "Download File";
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "";
    document.body.appendChild(downloadLink);
    
    downloadLink.click();
    clearAll();
};

function exportDataFile() {
    let textToSave = exportData;
    let textToSaveAsBlob = new Blob([textToSave], {type:"text/plain"});
    let textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    
    let downloadLink = document.createElement("a");
    let filename = document.getElementById("inputFileNameToSaveAs").value;
    downloadLink.download="laineData.txt";
    downloadLink.innerHTML = "Download File";
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "";
    document.body.appendChild(downloadLink);
    
    downloadLink.click();
}

// Load a file
let fileInput = document.getElementById("fileToLoad");
function loadFileAsText(){
    clearAll();    
    fileInput.click();
    if (reportButton.innerText=="Edit (F4)"){
	reportButton.click();
    }
};

function changeText() {
    let downloadLink = document.createElement("a");
    let fileToLoad = fileInput.files[0];
    let fileReader = new FileReader();

    fileReader.onload = function(fileLoadedEvent) {
	let textFromFileLoaded = fileLoadedEvent.target.result;
	editor.getDoc().setValue(textFromFileLoaded);	
    };

    document.getElementById("inputFileNameToSaveAs").value = fileToLoad.name.slice(0,-4);
    fileReader.readAsText(fileToLoad, "UTF-8");
};

fileInput.addEventListener("change", function(){
    changeText();
    fileInput.value="";}, false);

/*
  Close warning
*/
window.onbeforeunload = function(e) {
    e = e || window.event;

    // For IE and Firefox prior to version 4
    if (e) {
        e.returnValue = 'Sure?';
    }

    // For Safari
    return 'Sure?';
};
