// User interface javascript

// Resize textbox
function calcHeight(value) {
    let numberOfLineBreaks = (value.match(/\n/g) || []).length;
    // min-height + lines x line-height + padding + border
    let newHeight = 20 + numberOfLineBreaks * 24 + 12 + 2;
    return newHeight;
}

let textarea = document.querySelector(".box");

function autosize(){
    textarea.style.height = calcHeight(textarea.value) + "px";
}

autosize();
textarea.addEventListener("keyup", autosize);

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
}
const PropsSIButton = document.querySelector(".butPropsSI");
PropsSIButton.onclick = generateFun;

//HAPropsSI
function generateFun2(){
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
}
const HAPropsSIButton = document.querySelector(".butHAPropsSI");
HAPropsSIButton.onclick = generateFun2;
