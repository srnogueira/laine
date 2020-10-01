// User interface javascript

// Resize textbox
function calcHeight(value) {
    let numberOfLineBreaks = (value.match(/\n/g) || []).length;
    // min-height + lines x line-height + padding + border
    let newHeight = 20 + numberOfLineBreaks * 24 + 4 +1;
    return newHeight;
}

let textarea = document.querySelector(".box");
let box = document.querySelector(".solBox");

function autosize(){
    textarea.style.height = calcHeight(textarea.value) + "px";
}

function hide(extra){
    if (extra.key !== "ArrowRight" && extra.key !== "ArrowLeft" && extra.key !== "ArrowDown" && extra.key !== "ArrowUp"){
	box.style.display="";
    }
}

autosize();
textarea.addEventListener("keyup", autosize);
textarea.addEventListener("keydown", hide);

// Help button
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

// Function button
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
function generateFun(){
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
PropsSIButton.onclick = generateFun;

//HAPropsSI
function generateFun2(){
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
HAPropsSIButton.onclick = generateFun2;

//Save a file
function saveFile()
{
    var textToSave = document.getElementById("box").value;
    var textToSaveAsBlob = new Blob([textToSave], {type:"text/plain"});
    var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    
    var downloadLink = document.createElement("a");
    var filename = document.getElementById("inputFileNameToSaveAs").value;
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
}

function destroyClickedElement(event)
{
    document.body.removeChild(event.target);
}

// Load a file
function loadFileAsText()
{
    var downloadLink = document.createElement("a");
    
    var fileToLoad = document.getElementById("fileToLoad").files[0];
    
    var fileReader = new FileReader();
    fileReader.onload = function(fileLoadedEvent) 
    {
	var textFromFileLoaded = fileLoadedEvent.target.result;
	document.getElementById("box").value = textFromFileLoaded;
	autosize();
    };
    fileReader.readAsText(fileToLoad, "UTF-8");
}


// File button
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
