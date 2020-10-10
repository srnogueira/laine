/*
  Solver interface
*/

const solveButton = document.querySelector(".solve");
solveButton.onclick = laine;

function shortcut(key){
    if (key.code === "F2"){
	laine();
    }
    else if (key.code === "F4"){
	edit();
    }
}
document.onkeydown=shortcut;

/*
  Resize textbox
*/

function calcHeight(value) {
    let numberOfLineBreaks = (value.match(/\n/g) || []).length;
    // min-height + lines x line-height + padding + border
    let newHeight = 20 + numberOfLineBreaks * 24 + 4 +1;
    return newHeight;
}

let textarea = document.querySelector(".box");
let box = document.querySelector(".solBox");
let mathDiv = document.querySelector(".mathDiv");

function autosize(){
    textarea.style.height = calcHeight(textarea.value) + "px";
}

function edit(){
    mathDiv.style.display="none";
    box.style.display="none";
    textarea.style.display="block";
}

const editButton = document.querySelector(".edit");
editButton.onclick = edit;

function hide(extra){
    let special = ["ArrowRight","ArrowLeft","ArrowDown","ArrowUp","Control","Shift","Alt"];
    let decision = true ;
    for (i=0;i<special.length;i++){
	if (extra.key == special[i]){
	    decision = false;
	}
    }
    if (decision){
    	box.style.display="";
	//mathDiv.style.display="none";
    }
}

autosize();
textarea.addEventListener("keyup", autosize);
textarea.addEventListener("keydown", hide);

/*
  Help menu
*/

// Toggle
function toggleHelp(){
    let x = document.querySelector(".helpText");
    if (x.style.display===""){
	x.style.display="flex";
	helpButton.innerText="Help (-)";
    }
    else{
	x.style.display="";
	helpButton.innerText="Help (+)";
    }
}
const helpButton = document.querySelector(".help");
helpButton.onclick = toggleHelp;

/* 
   Function menu
*/

// Toggle
function toggleFunctions(){
    let x = document.querySelector(".functionBox");
    if (x.style.display===""){
	x.style.display="flex";
	functionButton.innerText="Functions (-)";
    }
    else{
	x.style.display="";
	functionButton.innerText="Functions (+)";
    }
}

const functionButton = document.querySelector(".function");
functionButton.onclick = toggleFunctions;

// PropsSI
function writePropsSI(){
    const textBox = document.querySelector(".box");
    let fluid = document.querySelector(".FluidName");
    let property = document.querySelector(".Property");
    let input1 = document.querySelector(".Input1");
    let input2 = document.querySelector(".Input2");
    let value1 = document.querySelector(".value1");
    let value2 = document.querySelector(".value2");

    let fluidName=fluid.options[fluid.selectedIndex].value;
    let propName=property.options[property.selectedIndex].value;
    let input1Name=input1.options[input1.selectedIndex].value;
    let input2Name=input2.options[input2.selectedIndex].value;

    let text = "property=PropsSI('"+propName+"','"+input1Name+"',"+value1.value+",'"+input2Name+"',"+value2.value+",'"+fluidName+"')";
    textBox.value+="\n"+text;
    autosize();
    toggleFunctions();
}
const PropsSIButton = document.querySelector(".butPropsSI");
PropsSIButton.onclick = writePropsSI;

// HAPropsSI
function writeHAPropsSI(){
    const textBox = document.querySelector(".box");
    let property = document.querySelector(".HAProperty");
    let input1 = document.querySelector(".HAInput1");
    let input2 = document.querySelector(".HAInput2");
    let input3 = document.querySelector(".HAInput3");
    let value1 = document.querySelector(".HAvalue1");
    let value2 = document.querySelector(".HAvalue2");
    let value3 = document.querySelector(".HAvalue3");

    let propName=property.options[property.selectedIndex].value;
    let input1Name=input1.options[input1.selectedIndex].value;
    let input2Name=input2.options[input2.selectedIndex].value;
    let input3Name=input2.options[input3.selectedIndex].value;

    let text = "property=HAPropsSI('"+propName+"','"+input1Name+"',"+value1.value+",'"+input2Name+"',"+value2.value+",'"+input3Name+"',"+value3.value+")";
    textBox.value+="\n"+text;
    autosize();
    toggleFunctions();
}
const HAPropsSIButton = document.querySelector(".butHAPropsSI");
HAPropsSIButton.onclick = writeHAPropsSI;

// Nasa Glenn
function writeNasa(){
    const textBox = document.querySelector(".box");
    let property = document.querySelector(".nasaProp");
    let fluid = document.querySelector(".nasaFluid");
    let temp = document.querySelector(".nasaT");
    let press = document.querySelector(".nasaP");
    
    let propName=property.options[property.selectedIndex].value;
    let fluidName=fluid.options[fluid.selectedIndex].value;

    let text;
    if ((propName == "s") || (propName == "g") || (propName == "f")) {
	text = "property=Nasa"+propName+"(\""+fluid.value+"\","+temp.value+","+press.value+")";
    }
    else{
	text = "property=Nasa"+propName+"(\""+fluid.value+"\","+temp.value+")";
    }
    textBox.value+="\n"+text;
    autosize();
    toggleFunctions();
}
const NasaButton = document.querySelector(".butNasa");
NasaButton.onclick = writeNasa;

// Lee - Kesler
function writelk(){
    const textBox = document.querySelector(".box");
    let property = document.querySelector(".lkProp");
    let temp = document.querySelector(".lkT");
    let press = document.querySelector(".lkP");
    
    let propName=property.options[property.selectedIndex].value;

    let text;
    if (propName=="Prsat"){
	text = "property=LeeKesler"+propName+"("+temp.value+")";
    }
    else if ((press.value == "f") || (propName == "g")){
	text = "property=LeeKesler"+propName+"("+temp.value+",\""+press.value+"\")";
    }
    else{
	text = "property=LeeKesler"+propName+"("+temp.value+","+press.value+")";
    }
    textBox.value+="\n"+text;
    autosize();
    toggleFunctions();
}
const leeKeslerButton = document.querySelector(".butlk");
leeKeslerButton.onclick = writelk;

/*
  File menu
*/

// Toggle
function toggleFile(){
    let x = document.querySelector(".fileBox");
    if (x.style.display===""){
	x.style.display="flex";
	fileButton.innerText="File (-)";
    }
    else{
	x.style.display="";
	fileButton.innerText="File (+)";
    }
}

const fileButton = document.querySelector(".file");
fileButton.onclick = toggleFile;

// Save a file

function destroyClickedElement(event)
{
    document.body.removeChild(event.target);
}

function saveFile()
{
    let textToSave = document.getElementById("box").value;
    let textToSaveAsBlob = new Blob([textToSave], {type:"text/plain"});
    let textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    
    let downloadLink = document.createElement("a");
    let filename = document.getElementById("inputFileNameToSaveAs").value;
    if (filename===""){
	downloadLink.download="laine_save.txt";
    }
    else{ 
	downloadLink.download = filename;
    }
    downloadLink.innerHTML = "Download File";
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    
    downloadLink.click();
    toggleFile();
}

// Load a file
function loadFileAsText()
{
    let downloadLink = document.createElement("a");
    
    let fileToLoad = document.getElementById("fileToLoad").files[0];
    
    let fileReader = new FileReader();
    fileReader.onload = function(fileLoadedEvent) 
    {
	let textFromFileLoaded = fileLoadedEvent.target.result;
	document.getElementById("box").value = textFromFileLoaded;
	autosize();
    };
    fileReader.readAsText(fileToLoad, "UTF-8");
    toggleFile();
    edit();
}
