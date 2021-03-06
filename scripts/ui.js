/*
  toggle menus
*/

const functionButton = document.querySelector(".function");
const fileButton = document.querySelector(".file");

function toggle(className,button=undefined){
    let x = document.querySelector(className);
    let text,signal;
    
    if (x.style.display===""){
	x.style.display="block";
	if (button!=undefined){
	    text = button.innerText;
	    text = text.slice(0,text.length-2)+'-)';
	    button.innerText = text;
	    button.style.backgroundColor = "#F04747";
	    button.style.color = "white";
	}
    }
    else{
	x.style.display="";
	if (button!=undefined){
	    text = button.innerText;
	    text = text.slice(0,text.length-2)+'+)';
	    button.innerText = text;
	    button.style.backgroundColor = "white";
	    button.style.color = "#F04747";
	}
    }
}

function clear(className,button){
    let x = document.querySelector(className);
    x.style.display="";
    if (button!=undefined){
	text = button.innerText;
	text = text.slice(0,text.length-2)+'+)';
	button.innerText = text;
	button.style.backgroundColor = "white";
	button.style.color = "#F04747";
    }
}

const classes = [".fileBox",".functionBox",".propsBox",".HApropsBox",".nasaBox",".lkBox",".plotBox"];
const buttons = [fileButton,functionButton,undefined,undefined,undefined,undefined,undefined];

function clearAll(exception){
    for (let i=0;i<classes.length;i++){
	if (classes[i] != exception){
	    clear(classes[i],buttons[i]);
	}
    }
}

// editor is defined on editor.js
editor.on("focus",function(){
    clearAll();
});

fileButton.onclick = function(){
    clearAll(".fileBox");
    toggle(".fileBox",button=fileButton);
};

functionButton.onclick = function(){
    clearAll(".functionBox");
    toggle(".functionBox",button=functionButton);
};

const propsButton = document.querySelector(".props")
propsButton.onclick = function(){
    clearAll();
    toggle(".propsBox"); };


const propsCancelButton = document.querySelector(".propsCancel")
propsCancelButton.onclick = function(){toggle(".propsBox");};

const HApropsButton = document.querySelector(".HAprops")
HApropsButton.onclick = function(){
    clearAll();
    toggle(".HApropsBox");};

const HApropsCancelButton = document.querySelector(".HApropsCancel")
HApropsCancelButton.onclick = function(){toggle(".HApropsBox");};

const nasaButton = document.querySelector(".nasa")
nasaButton.onclick = function(){
    clearAll();
    toggle(".nasaBox"); };

const nasaCancelButton = document.querySelector(".nasaCancel")
nasaCancelButton.onclick = function(){toggle(".nasaBox");};

const lkButton = document.querySelector(".lk")
lkButton.onclick = function(){
    clearAll();
    toggle(".lkBox"); };

const lkCancelButton = document.querySelector(".lkCancel")
lkCancelButton.onclick = function(){toggle(".lkBox");};

const plotMenuButton = document.querySelector(".plot")
plotMenuButton.onclick = function(){
    clearAll();
    if (document.querySelector(".plotBox").style.display===""){
	let check = laine_plot(true);
	if (check != "error"){
	    toggle(".plotBox");
	}
    }
    else{
	toggle(".plotBox");
    }
};

const plotCancelButton = document.querySelector(".plotCancel")
plotCancelButton.onclick = function(){toggle(".plotBox")};

const plotButton  = document.querySelector(".plotDraw");
plotButton.onclick = function(){laine_plot(false);toggle(".plotBox");};

const closePlotButton  = document.querySelector(".closePlot");
closePlotButton.onclick = function(){
    let draw = document.querySelector(".plotDrawBox");
    draw.style.display = "";
}

/*
  Solver interface
*/
    
const solveButton = document.querySelector(".solve");
const reportButton = document.querySelector(".report");

function report() {
    clearAll();
    if (reportButton.innerText=="Report (F4)"){
	laine();
	reportButton.innerText="Edit (F4)";
	reportButton.style.backgroundColor = "#F04747";
	reportButton.style.color="white";
    }
    else{
	mathDiv.style.display="none";
	solBox.style.display="none";
	editorDiv.style.display="block";
	reportButton.innerText="Report (F4)";
	reportButton.style.backgroundColor = "white";
	reportButton.style.color = "#F04747";
    }
    editor.refresh(); // avoid problems with resize
}
reportButton.onclick = report;

solveButton.onclick = function(){
    clearAll();
    laine(true);
    if (reportButton.innerText == "Edit (F4)"){
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


// PropsSI
function writePropsSI(){
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
    editor.getDoc().setValue(textBox.value);
    propsCancelButton.click();
}

const PropsSIButton = document.querySelector(".butPropsSI");
PropsSIButton.onclick = writePropsSI;

// HAPropsSI
function writeHAPropsSI(){
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
    editor.getDoc().setValue(textBox.value);
    HApropsCancelButton.click();
}
const HAPropsSIButton = document.querySelector(".butHAPropsSI");
HAPropsSIButton.onclick = writeHAPropsSI;

// Nasa Glenn
function writeNasa(){
    const textBox = document.querySelector(".box");
    let property = document.querySelector(".nasaProp");
    let specie = document.querySelector(".nasaSpecie");
    let temp = document.querySelector(".nasaT");
    
    let propName=property.options[property.selectedIndex].value;
    let specieName=specie.options[specie.selectedIndex].value;

    let text="property=NasaSI('"+propName+"',"+temp.value+",'"+specie.value+"')";
    textBox.value+="\n"+text;
    editor.getDoc().setValue(textBox.value);
    nasaCancelButton.click();
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
	text = "property=LeeKesler"+"(\'"+propName+'\','+temp.value+",'f')";
    }
    else if (press.value == "f" || press.value=='g'){
	text = "property=LeeKesler"+"(\'"+propName+'\','+temp.value+",\'"+press.value+"\')";
    }
    else{
	text = "property=LeeKesler"+"(\'"+propName+'\','+temp.value+","+press.value+")";
    }
    textBox.value+="\n"+text;

    editor.getDoc().setValue(textBox.value);
    lkCancelButton.click();
}
const leeKeslerButton = document.querySelector(".butlk");
leeKeslerButton.onclick = writelk;

/*
  File menu
*/

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
	downloadLink.download="laineSave.txt";
    }
    else{ 
	downloadLink.download = filename+".txt";
    }
    downloadLink.innerHTML = "Download File";
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    
    downloadLink.click();
    fileButton.click();
}

function exportDataFile()
{
    let textToSave = exportData;
    let textToSaveAsBlob = new Blob([textToSave], {type:"text/plain"});
    let textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    
    let downloadLink = document.createElement("a");
    let filename = document.getElementById("inputFileNameToSaveAs").value;
    downloadLink.download="laineData.txt";
    downloadLink.innerHTML = "Download File";
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    
    downloadLink.click();
}

const fileInput = document.getElementById("fileToLoad");

function loadFileAsText(){
    clearAll();    
    fileInput.click();
}

function changeText()
{
    let downloadLink = document.createElement("a");
    let fileToLoad = document.getElementById("fileToLoad").files[0];
    let fileReader = new FileReader();

    fileReader.onload = function(fileLoadedEvent) 
    {
	let textFromFileLoaded = fileLoadedEvent.target.result;
	editor.getDoc().setValue(textFromFileLoaded);
	
    };

    document.getElementById("inputFileNameToSaveAs").value = fileToLoad.name.slice(0,-4);
    fileReader.readAsText(fileToLoad, "UTF-8");
}

fileInput.addEventListener("change", changeText, false);
