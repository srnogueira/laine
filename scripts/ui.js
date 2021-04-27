'use strict';

// SHOW SOLUTIONS, EQUATIONS AND ERRORS
// Solution and report divs
const outDiv = document.querySelector(".out");
const mathDiv = document.querySelector(".mathDiv");

function writeEqs(inputText){
    // Function : Write equations for reports
    const lines = inputText.split('\n');
    const linesLength = lines.length;
    // Clear and start
    mathDiv.innerHTML="";
    let converter = new showdown.Converter();
    for (let i=0; i<linesLength ; i++){
	// Check if is an equation or comment
	if (checkLine(lines[i].trim(),i)){
	    // Check if is there is more than one equation
	    const aux = lines[i].split(';');
	    for (let subline of aux){
		// Separate side comments
		const sep = subline.split('#');
		// Long space and join comments
		let comment='\\;\\text{';
		const sepLength = sep.length
		for(let j=1;j<sep.length;j++){
		    comment+=sep[j];
		}
		let para=document.createElement('p');
		para.textContent="$$"+formatMathJax(sep[0])+comment+"}$$";
		mathDiv.appendChild(para);
	    }
	}
	else{
	    // Disables markdown format if there is an equation
	    let text;
	    let flag=false;
	    const dels = [new RegExp('\\$\\$'),new RegExp('\\\\\\('),new RegExp('\\\\\\[')];
	    for (let del of dels){
		console.log(del);
		console.log(lines[i].match(del));
		if (lines[i].match(del)){
		    flag = true;
		    break;
		}
	    }
	    if (flag){
		mathDiv.innerHTML+=`<p>${lines[i].slice(1)}</p>`;
	    }
	    else{
		mathDiv.innerHTML+=converter.makeHtml(lines[i].slice(1));
	    }
	}
    }    
}

function displayResults(fast){
    // Function: write answers
    outDiv.innerText="";  // clear space
    const solutions = Object.entries(parser.getAll());
    for (let solution of solutions){
	writeAns(solution,fast);
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
    solBox.style.display="grid";
}

function displayError(e){
    // Function: display error messages
    errorGrid.innerText = "";
    const texts = ["<b>Type</b>",e.name,
		   "<b>Where?</b>",e.lineNumber,
		   "<b>What?</b>",e.message,
		   "<b>Help</b>",e.help];
    // Include elements
    for (let text of texts){
	let elem = document.createElement("span");
	elem.innerHTML = text;
	errorGrid.appendChild(elem);
    }
    // Display box
    errorBox.style.display = "block";
    editor.refresh();
}

function writeAns(solution,fast){
    // Function: write answers in the results box
    let key = solution[0];
    let value = solution[1];
    let msg, text;
    // Convert
    if (typeof(value) === "number"){
    	value = value.toPrecision(5);
	text = value.toString();
    }
    else if(typeof(value) === "function"){
	return null;
    }
    else if (typeof(value)==="object"){
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
    console.log(text);
    // Render
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
    // Function: make some corrections in the MathJax style
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
    // Function: calls solver for buttons and create a error message if necessary
    clearAll();
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
	//console.error(e);
	displayError(e);
	return false;
    }
}

// EDITOR
// Adding effects with changes
const editorDiv = document.querySelector(".CodeMirror")
const solBox = document.getElementById("solBox");
const errorGrid = document.querySelector(".errorGrid");
const errorBox = document.getElementById("errorBox");
const contentParametric = document.getElementById("contentParametric");
const contentPropPlot = document.getElementById("contentPropPlot");
editor.on("change",function(){
    textBox.value=editor.getValue();
    if (contentParametric.style.display === "block" || contentPropPlot.style.display === "block"){
	clearAll(true);
    }
    else{
	clearAll();
    }
});
// Clear all
const genericDropbox = document.querySelectorAll(".dropdownContent");
const genericMenus = document.querySelectorAll(".hiddenMenu");
function clearAll(exception){
    // Clear generic classes
    for (let generic of genericDropbox){
	generic.style.display="none";
    }
    if (!exception){
	for (let generic of genericMenus){
	    generic.style.display="none";
	}
    }
    // Toggle Report button - leave it if is a double click
    if (mathDiv.style.display==="block" && exception !== "report"){
	mathDiv.style.display="";
	solBox.style.display="";
	editorDiv.style.display="block";
	reportButton.innerText=window.innerWidth < 600 ? "Report" : "Report (F4)";
    }
    editor.refresh();
};
// Remove menus
// editor is defined on editor.js
editor.on("click",function(){clearAll("report")});
const inter = document.querySelector(".interface");
inter.onclick = function(){clearAll("report")}; // works
// HIDDEN MENUS
// Dropdown - hover effect
function dropdownHover(button){
    const content = button.nextElementSibling;
    button.onmouseover = function(){
	if (window.innerWidth >= 600){
	    content.style.display="grid";
	}
    };
    const menu = button.parentNode;
    menu.onmouseleave = function(){
	content.style.display="none"
	document.activeElement.blur();
    }
}
// Dropdown - click effect
function dropdownClick(button){
    const content = button.nextElementSibling;
    const display = content.style.display // Store
    clearAll(true); // has to include everybody (including other hovers)
    if (display !== "grid"){
	content.style.display="grid";
    }
    else{
	content.style.display="none";
	document.activeElement.blur();
    }
}
// Apply to buttons
const dropButtons = document.querySelectorAll(".dropdownButton");
for (let button of dropButtons){
    dropdownHover(button);
    button.onclick = ()=>dropdownClick(button);
}
// SUBMENUS
function hiddenMenu(openId,contentId,closeId){
    const open = document.getElementById(openId);
    const content = document.getElementById(contentId);
    const close = document.getElementById(closeId);
    open.onclick = function() {
	clearAll();
	content.style.display = "block";
	editor.refresh();
    };
    close.onclick = function() {
	content.style.display = "none";
	editor.refresh();
    }
};
// Hidden menus
hiddenMenu("openPropsSI","contentPropsSI","closePropsSI");
hiddenMenu("openHAPropsSI","contentHAPropsSI","closeHAPropsSI");
hiddenMenu("openNasa","contentNasa","closeNasa");
hiddenMenu("openLk","contentLk","closeLk");
hiddenMenu("openParametric","contentParametric","closeParametric");
// Dynamic content
const plotMenuButton = document.getElementById("openParametric")
plotMenuButton.onclick = function(){
    clearAll();
    laineProblem = plot_check();
    if (laineProblem !== false){
	document.getElementById("contentParametric").style.display = "block";
    }
};
hiddenMenu("openPropPlot","contentPropPlot","closePropPlot");
// Dynamic content
const propPlotMenuButton = document.getElementById("openPropPlot")
propPlotMenuButton.onclick = function(){
    clearAll();
    if (checkStates()){
	document.getElementById("contentPropPlot").style.display = "block";
    }
};
// PLOT BUTTON
const plotButton  = document.querySelector(".plotDraw");
plotButton.onclick = function(){
    clearAll(true);
    laine_plot();
    document.getElementById("plotDrawBox").style.display="block";
    editor.refresh();
};
const propPlotButton = document.querySelector(".propPlotDraw")
propPlotButton.onclick = function(){
    clearAll(true);
    plotStates();
    document.getElementById("plotDrawBox").style.display="block";
    editor.refresh();
}
// CLOSE BUTTON
function hideGrandParentDiv(button){
    const grandparent = button.parentNode.parentNode;
    button.onclick = function(){
	grandparent.style.display="none";
	editor.refresh();
    }
}
// Apply
const closeButtons = document.querySelectorAll(".hiddenMenuClose");
for (let button of closeButtons){
    hideGrandParentDiv(button);
}
// SOLVER AND REPORT
// Button name
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
// Solver interface
reportButton.onclick = function() {
    if (mathDiv.style.display === "none" || mathDiv.style.display === ""){
	clearAll("report");
	if (laine(false)){
	    reportButton.innerText = window.innerWidth < 600 ? "Edit" : "Edit (F4)";
	}
    }
    else{
	clearAll();
    }
}
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
// Write functions
// PropsSI
function writePropsSI(){
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
    const trivials = ["acentric","M","PCRIT","TCRIT","RHOCRIT","RHOMOLAR_CRITICAL"];
    let flag,text;
    for (let trivial of trivials){
	if (propName == trivial){
	    flag = true;
	    break;
	}
    }
    if (flag){
	text = `property=Props1SI('${propName}','${fluidName}')`;
    }
    else{
	text = `property=PropsSI('${propName}','${input1Name}',${value1.value},'${input2Name}',${value2.value},'${fluidName}')`;
    }
    textBox.value+="\n"+text;
    editor.getDoc().setValue(textBox.value);
    clearAll(true);
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
    clearAll(true);
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
    clearAll(true);
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
    clearAll(true);
}
const leeKeslerButton = document.querySelector(".butlk");
leeKeslerButton.onclick = writelk;
// File menu
// New file
function newFile() {
    // Textbox defined in editor.js
    let confirmation = confirm("Are you sure?");
    if (confirmation){
	textBox.value = "";
	editor.getDoc().setValue(textBox.value);
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
    downloadLink.download="laineSave.txt";
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
    fileReader.readAsText(fileToLoad, "UTF-8");
};
fileInput.addEventListener("change", function(){
    changeText();
    fileInput.value="";}, false);
// Close warning
window.onbeforeunload = function(e) {
    e = e || window.event;
    // For IE and Firefox prior to version 4
    if (e) {
        e.returnValue = 'Sure?';
    }
    // For Safari
    return 'Sure?';
};
