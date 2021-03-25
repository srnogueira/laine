/*
  Parametric analysis plot
*/

// Data for download
var exportData;
var laineProblem;

function plot_check(){
    /*
      Function: Create a plot menu and save problem for latter 
    */
    
    // Check if the problem has 1 degree of freedom
    let problem = laine_fun(undefined,true,true,undefined,undefined);
    if (problem == undefined){
	let errorText= "Type: No degree of freedom \nDescription: Try to remove an equation";
	displayError(errorText);
	return false;
    }

    let degrees = problem.names.length-problem.equations.length;

    if (degrees>1){
	let errorText= "Type: 2 or + degrees of freedom \nDescription: Try to include more equations";
	displayError(errorText);
	return false;
    }

    // If is the first run, just create a menu
    let xSelect = document.querySelector(".plotX");
    let ySelect = document.querySelector(".plotY");

    xSelect.options.length = 0;
    ySelect.options.length = 0;

    for (let i=0; i<problem.names.length; i++){
	let optX = document.createElement("option");
	let optY = document.createElement("option");
	optX.value = problem.names[i];
	optX.text = problem.names[i];
	optY.value = problem.names[i];
	optY.text = problem.names[i];
	xSelect.add(optX);
	ySelect.add(optY);
    }
    return problem;
}


function laine_plot(){
    /*
      Function: Create a plot
    */
    let t1 = performance.now();

    let problem = laineProblem;
    
    // Second run: solve the problem for multiple values
    let xName = document.querySelector(".plotX").value;
    let yName = document.querySelector(".plotY").value;
    
    let from = parseFloat(document.querySelector(".plotXfrom").value);
    let to = parseFloat(document.querySelector(".plotXto").value);
    let Npoints = document.querySelector(".plotNpoints").value;

    delta = (to-from)/(Npoints-1)
    let data = [];
    exportData=xName+"\t"+yName+"\n";

    // Store guesses
    let storeSolution = new Object(); 
    
    for (let i=0;i<Npoints;i++){
	// Try to solve
	parser.scope[xName] = from + delta*i;
	try{
	    if (i==0){
		laine_fun(problem.equations,true,false,undefined,yName);
	    }
	    else{
		laine_fun(problem.equations,true,false,storeSolution,yName);
	    }
	}
	catch(e){
	    let errorText = e.alert ? e.alert : e;
	    displayError(errorText);
	    return false;
	}
	
	// Store data
	let point = {x: parser.scope[xName], y:parser.scope[yName].toPrecision(5)};
	data.push(point);
	exportData+=""+point.x+"\t"+point.y+"\n";

	// Delete solution
	for (let j=0;j<problem.names.length;j++){
	    if (problem.names[j]!=xName){
		storeSolution[problem.names[j]] = parser.scope[problem.names[j]];
	    }
	    delete parser.scope[problem.names[j]];
	}
    }

    // Draw plot
    let div = document.getElementById("canvasDiv");
    div.innerText = "";
    let canvas = document.createElement("canvas");
    canvas.height="400";
    div.appendChild(canvas);
    let ctx = canvas.getContext("2d");
    let myLineChart = new Chart(ctx, {
	type: 'line',
	data: { datasets:[{
	    fill: false,
	    backgroundColor: 'rgba(0, 0, 0, 1)',
	    borderColor: 'rgba(0, 0, 0, 1)',
	    data: data}]
	      },
	options:{
	    responsive: false,
	    title:{
		display: true,
		text: yName+" vs. "+xName,
	    },
	    maintainAspectRatio:false,
	    legend: {
		display:false,
	    },
	    scales: {
		xAxes: [{
		    display: true,
		    type:"linear",
		    scaleLabel: {
			display: true,
			labelString: xName
		    }
		}],
		yAxes: [{
		    display: true,
		    type: "linear",
		    scaleLabel: {
			display: true,
			labelString: yName
		    }
		}]
	    }
	}
    });
    myLineChart.update();
    
    let plotDrawBox = document.querySelector(".plotDrawBox");
    plotDrawBox.style.display="block";
    
    let t2 = performance.now();
    console.log("Plot time:",t2-t1,"ms")
    return false;
}

/*
  Property plots
*/

function State(text){
    let pieces = text.split(',');
    // State definition
    let value;
    value = parser.evaluate(pieces[2]);
    this.first = [pieces[1].slice(1,-1),value];
    value = parser.evaluate(pieces[4]);
    this.second = [pieces[3].slice(1,-1),value];
    this.fluid = pieces[5].slice(1,-1);
    // Temperature
    this.T = Module.PropsSI("T",this.first[0],this.first[1],this.second[0],this.second[1],this.fluid);
    this.P = Module.PropsSI('P',this.first[0],this.first[1],this.second[0],this.second[1],this.fluid);
    this.Q = Module.PropsSI('Q',this.first[0],this.first[1],this.second[0],this.second[1],this.fluid);
    this.S = Module.PropsSI('S',this.first[0],this.first[1],this.second[0],this.second[1],this.fluid);
    this.H = Module.PropsSI('H',this.first[0],this.first[1],this.second[0],this.second[1],this.fluid);
    this.D = Module.PropsSI('D',this.first[0],this.first[1],this.second[0],this.second[1],this.fluid);
}

// Grab the table to add more states
const stateTable = document.querySelector(".stateTable");
var tableSize = 1;
var stateOptions // Global variable for states

function checkStates(){
    /*
      Function : Creates the property plot menu
    */
    // Erase
    stateTable.innerHTML="";
    tableSize = 1;
    
    let test = laine(true);
    solBox.style.display=""; // not ideal, but works
    if (test==false){
	return false;
    }
	
    // Grab text and match PropsSI calls
    let text = editor.getValue();
    let regexComment = /#.*\n/g; // removes comments
    let regex = /PropsSI\(.*(?=\))/g; // captures PropsSI(...
    let found = text.replace(regexComment,'').match(regex);

    // Parse PropsSI calls into states
    let states = [];
    for (let i=0;i<found.length;i++){
	states.push(new State(found[i]));
    };

    // Create the menu - lazy mode (not exclude wrong possibilities)
    let optionText;
    let fluids = [];
    let options =[];
    let optionsEntry =[]; // Necessary to verify
    let fluidsSelect = document.querySelector(".propPlotFluid");
    fluidsSelect.options.length = 0;

    for (let i=0;i<states.length;i++){
	// Fluids
	if (!fluids.includes(states[i].fluid)){
	    fluids.push(states[i].fluid);
	    let fluidOpt = document.createElement("option");
	    fluidOpt.value = states[i].fluid ;
	    fluidOpt.text = states[i].fluid ;
	    fluidsSelect.add(fluidOpt);
	}

	// States
	if (states[i].Q == -1){
	    optionText ="T: "+states[i].T.toPrecision(5)+" [K] ; P: "+states[i].P.toPrecision(5)+" [Pa]";
	}
	else{
	    optionText ="T: "+states[i].T.toPrecision(5)+" [K] ; P: "+states[i].P.toPrecision(5)+" [Pa] ; Q:"+states[i].Q.toPrecision(5);
	}
	if (!optionsEntry.includes(optionText)){
	    optionsEntry.push(optionText);
	    options.push([optionText,states[i]]);
	}	
    }
    // Update global variable
    stateOptions = options;
    return true;
}

function updateNumber(){
    /*
      Function: Update state numbers
    */
    
    for (let i=0;i<stateTable.children.length;i++){
	let row = stateTable.children[i];
	let number = i+1
	row.children[0].innerHTML = "("+number+")";
    }
    return false;
}

function addState(){
    /*
      Function: creates a new state entry
    */
    
    // Create elements
    let stateRow = document.createElement("tr")
    let stateNumber = document.createElement("td")
    let stateChoice = document.createElement("td")
    let stateSelect = document.createElement("select")
    let stateDelete = document.createElement("td")
    let stateButton = document.createElement("button")

    // Number
    stateNumber.textContent = "("+tableSize+")";
    tableSize += 1;
    stateRow.appendChild(stateNumber);

    // Options
    stateSelect.options.length = 0;
    for (let i=0;i<stateOptions.length;i++){
	let option = document.createElement("option");
	option.value = i;
	option.text = stateOptions[i][0];
	stateSelect.add(option);
    }
    stateChoice.appendChild(stateSelect);
    stateRow.appendChild(stateChoice);

    // Button
    stateButton.textContent = 'Delete';
    stateDelete.appendChild(stateButton);
    stateRow.appendChild(stateDelete);

    // Table
    stateTable.appendChild(stateRow);
    stateButton.onclick = function() {
	stateTable.removeChild(stateRow);
	tableSize -=1;
	updateNumber();
    }
}

function addIso(data,propName,propValue,xMax,xMin,xName,yName,fluid){
    /*
      Function: creates a dataset for a isoline
    */
    let delta = (xMax-xMin)/40;
    for (let i=0;i<41;i++){
	let xValue;
	xValue = parseFloat(xMin)+delta*(i);	
	let yValue = Module.PropsSI(yName,xName,xValue,propName,propValue,fluid);
	if (yName == "D"){
	    yValue = 1/yValue;
	}
	if (xName == "D"){
	    xValue = 1/xValue;
	}
	if (xValue != Infinity & yValue != Infinity){
	    let point = {x: xValue, y:yValue};
	    data.push(point);
	}
    }
    return data;
}
function addIso2(data,propName,propValue,yMax,yMin,yName,xName,fluid){
    /*
      Function: creates a dataset for a isoline
    */
    let delta = (yMax-yMin)/40;
    for (let i=0;i<41;i++){
	let yValue;
	yValue = parseFloat(yMin)+delta*(i);	
	let xValue = Module.PropsSI(xName,yName,yValue,propName,propValue,fluid);
	if (xName == "D"){
	    xValue = 1/xValue;
	}
	if (yName == "D"){
	    yValue = 1/yValue;
	}
	if (xValue != Infinity & yValue != Infinity){
	    let point = {x: xValue, y:yValue};
	    data.push(point);
	}
    }
    return data;
}

const addStateButton = document.querySelector(".plotAddState")
addStateButton.onclick = addState;

function plotStates(){
    /*
      Function: Create the plot
    */
    
    // Axis definition
    let xName,yName,xAxis,yAxis;
    let type = document.querySelector(".propPlotType");
    if (type.value == "Ts"){
	xName = "S";
	xAxis = "s [J/(kg.K)]";
	yName = "T";
	yAxis = "T [K]";
    }
    else if (type.value == "Ph"){
	xName = "H";
	xAxis = "h [J/kg]";
	yName = "P";
	yAxis = "P [Pa]";
    }
    else if (type.value == "Pv") {
	xName = "D";
	xAxis = "v [m³/kg]";
	yName = "P";
	yAxis = "P [Pa]";
    }
    else {
	xName = "D";
	xAxis = "v [m³/kg]";
	yName = "T";
	yAxis = "T [K]";
    }

    // Points definition
    let data = [];
    let list = stateTable.children;
    let yMin=Infinity;
    let yMax=0;
    let fluid;
    let stateList=[];
    exportData="States\n"+xAxis+"\t"+yAxis+"\n";

    for (let i=0;i<list.length;i++){
	let xValue,yValue;
	let stateID = list[i].children[1].children[0].value;
	let state = stateOptions[stateID][1];
	stateList.push(state);
	
	fluid = state.fluid;
	xValue = Module.PropsSI(xName,state.first[0],state.first[1],state.second[0],state.second[1],state.fluid);
	yValue = Module.PropsSI(yName,state.first[0],state.first[1],state.second[0],state.second[1],state.fluid);

	// As number
	if (yValue < yMin){
	    yMin = yValue;
	}
	if (yValue > yMax){
	    yMax = yValue;
	}

	// As string
	if (xName == "D"){
	    let temp = 1/xValue;
	    xValue = temp;
	}
	else{
	    xValue = xValue;
	}
	yValue = yValue;

	let point = {x: xValue, y:yValue};
	data.push(point);
	
	exportData+=""+point.x+"\t"+point.y+"\n";
    }

    // Saturation
    let liqData=[];
    let vapData=[];
    let delta = (yMax-yMin)/20;

    let exportVap = "\nSat. vap.\n"+xAxis+"\t"+yAxis+"\n";
    exportData+="\nSat. liq.\n"+xAxis+"\t"+yAxis+"\n";
    for (let i = 0; i<21 ; i++){
	let ySat,xSat;
	ySat = yMin+delta*(i);
	
	// Sat liq.
	xSat = Module.PropsSI(xName,yName,ySat,"Q",0,fluid);
	if (xSat != Infinity){
	    if (xName == "D"){
		let temp = 1/xSat;
		xSat = temp;
	    }
	    else{
		xSat = xSat;
	    }
	    let pointLiq = {x: xSat, y:ySat};
	    liqData.push(pointLiq);
	    exportData+=""+pointLiq.x+"\t"+pointLiq.y+"\n";
	}

	// Sat vap.
	xSat = Module.PropsSI(xName,yName,ySat,"Q",1,fluid);

	if (xSat != Infinity){
	    if (xName == "D"){
		let temp = 1/xSat;
		xSat = temp;
	    }
	    else{
		xSat = xSat;
	    }
	    let pointVap = {x: xSat, y:ySat};
	    vapData.push(pointVap);
	    exportVap+=""+pointVap.x+"\t"+pointVap.y+"\n";
	}
    }
    exportData += exportVap;

    let dataPoints = { datasets:[{
	label:"States",
	lineTension:0,
	fill: false,
	backgroundColor: 'rgba(0, 0, 0, 1)',
	borderColor: 'rgba(0, 0, 0, 1)',
	data: data,
	showLine:false,
	pointRadius:5,
    },
	{
	    label:"Sat. liq.",
	    backgroundColor: 'rgba(0, 0, 255, 1)',
	    borderColor: 'rgba(0, 0, 255, 1)',
	    data: liqData,
	    pointRadius:0,
	    fill: false
	},
	{
	    label:"Sat. vap.",
	    backgroundColor: 'rgba(255, 0, 0, 1)',
	    borderColor: 'rgba(255, 0, 0, 1)',
	    data: vapData,
	    pointRadius: 0,
	    fill:false
	}]
	      }

    // Process
    let isoLines = ["P","S","T","H","D"]; // T can't be first
    let isoData = []
    for (let i=0;i<stateList.length-1;i++){
	for (let j=0;j<isoLines.length;j++){
	    let prop = isoLines[j];	
	    if (stateList[i][prop] == stateList[i+1][prop]){
		isoData.push(data[i]);
		if (prop == yName | prop==xName){
		    break;
		}
		if (type.value=="Ph"){
		    let yBegin = data[i].y;
		    let yEnd = data[i+1].y;
		    if (yName == "D"){
			yBegin = 1/yBegin;
			yEnd = 1/yEnd;
		    }
		    addIso2(isoData,prop,stateList[i][prop],yEnd,yBegin,yName,xName,fluid);
		    break;
		}
		else{
		    let xBegin = data[i].x;
		    let xEnd = data[i+1].x;
		    if (xName == "D"){
			xBegin = 1/xBegin;
			xEnd = 1/xEnd;
		    }
		    addIso(isoData,prop,stateList[i][prop],xEnd,xBegin,xName,yName,fluid);
		    break;
		}
	    }
	    if (j==isoLines.length-1){
		isoData.push(data[i]);
	    }
	}
    }
    isoData.push(data[stateList.length-1])
    let isoDataPlot = {
	    label:"Process",
	    lineTension:0,
	    borderDash:[5],
	    fill: false,
	    backgroundColor: 'rgba(0, 0, 0, 1)',
	    borderColor: 'rgba(0, 0, 0, 1)',
	data: isoData,
	pointRadius:0
    }
    dataPoints.datasets.push(isoDataPlot);
    // addIso(data,propName,propValue,yMax,yMin,yName,xName,fluid){
    
    // Draw plot
    let div = document.getElementById("canvasDiv");
    div.innerText = "";
    let canvas = document.createElement("canvas");
    canvas.height="400";
    canvas.width="400";
    div.appendChild(canvas);
    let ctx = canvas.getContext("2d");

    let myLineChart = new Chart(ctx, {
	type: 'line',
	data: dataPoints,
		
	options:{
	    responsive: false,
	    title:{
		display: true,
		text: yAxis+" vs. "+xAxis,
	    },
	    maintainAspectRatio:false,
	    legend: {
		display:true,
	    },
	    scales: {
		xAxes: [{
		    display: true,
		    type:"linear",
		    scaleLabel: {
			display: true,
			labelString: xAxis
		    }
		}],
		yAxes: [{
		    display: true,
		    type: "linear",
		    scaleLabel: {
			display: true,
			labelString: yAxis
		    },
		}]
	    }
	}
    });
    myLineChart.update();

    // Show
    solBox.style.display="none";
    let plotDrawBox = document.querySelector(".plotDrawBox");
    plotDrawBox.style.display="block";
}

// Create the saturation line
// Create pressure lines
