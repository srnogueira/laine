/*
  Objects from HTML
*/

const solveButton = document.querySelector(".solve");
const helpButton = document.querySelector(".help");
const functionButton = document.querySelector(".function");
const PropsSIButton = document.querySelector(".butPropsSI");
const HAPropsSIButton = document.querySelector(".butHAPropsSI");
const textBox = document.querySelector(".box");
const outDiv = document.querySelector(".out");

/*
  Thermodynamic properties
*/

math.import({
    //air:air,
    PropsSI:function (P,X,XX,Y,YY,N){
	return Module.PropsSI(P,X,XX,Y,YY,N)
    },
    HAPropsSI:function (P,X,XX,Y,YY,Z,ZZ){
	return Module.HAPropsSI(P,X,XX,Y,YY,Z,ZZ)
    },
});

/*
  Functions
*/

// To set equations "= 0"
function minusRight(line){
    let sides=line.split('=');
    return sides[0]+"-("+sides[1]+")";
}

// To get all variables
function varsName(line){
    // Check
    if (!checkLine(line)){
	return [];
    }   
    // Parse string
    let node=math.parse(line);
    // Filter symbol nodes
    let symbolNodes=node.filter(function (node) { 
	return node.isSymbolNode
    })
    // Filter function nodes
    let functionNodes=node.filter(function (node) {
	return node.type=='FunctionNode';
    })
    // Store unique symbols that are not functions
    let symbols=[];
    let isFunction=false;
    for (let i=0; i<symbolNodes.length; i++){
	isFunction=false;
	for (let j=0; j<functionNodes.length; j++){
	    if (symbolNodes[i].name == functionNodes[j].fn){
		isFunction=true;
	    }
	}
	if (!isFunction){
	    symbols.push(symbolNodes[i].name);
	}
    }
    // Remove duplicates
    let unique=[...new Set(symbols)];
    return unique;
}

// Numerical derivative
function derivative(parser,line,name,f,x){
    let absDelta=1E-3;
    let relDelta=1E-8;
    let xNear,fNear,dfdx;

    if(x===0){
	xNear = x+absDelta;
    }
    else{
	xNear = x*(1+relDelta);
    }
    parser.set(name,xNear)
    fNear=parser.evaluate(line);
    dfdx=(fNear-f)/(xNear-x);
    parser.set(name,x); // Aparently parser goes in a higher scope
    return dfdx;
}

// Answers
function calcFun(parser,lines,names,guesses){
    // Set all guesses
    for (let i=0;i<names.length;i++){
	parser.set(names[i],guesses[i]);
    }

    // Calculate all lines
    let answers=[];
    for (let i=0;i<lines.length;i++){
	answers.push(parser.evaluate(lines[i]))
    }
    return answers;
}

function find_guessN(lines,names,parser){
    let guess_list = [1,1E2,1E4,1E6];
    let ans_list = [0,0,0];

    // Set all guesses
    let aux;
    for(let i=0;i<guess_list.length;i++){
	for (let j=0;j<names.length;j++){
	    parser.set(names[i],guess_list[i]);
	}
	for (let j=0;j<lines.lenght;j++){
	    aux=parser.evaluate(lines[i]);
	    ans_list[i]+=aux*aux;
	}
    }
    
    let index;
    let lower=Infinity;
    for(let i=0;i<guess_list.length;i++){
	if ((ans_list[i]!==NaN)&&(Math.abs(ans_list[i])<Math.abs(lower))){
	    index=i;
	    lower=ans_list[i];
	}
    }
    return guess_list[index];
}

function step(parser,lines,names,guesses,answers){
    // Calculate jacobian
    let jac=math.ones(answers.length,guesses.length);
    let der;
    for (let i=0;i<answers.length;i++){
	for (let j=0;j<guesses.length;j++){
	    der=derivative(parser,lines[i],names[j],answers[i],guesses[j]);
	    jac.subset(math.index(i,j),der);
	}
    }

    // Determine step
    let dx=math.multiply(math.inv(jac),answers);
    return dx;
}

function error(answers){
    let diff=0;
    for (let i=0; i<answers.length; i++){
	diff+=answers[i]*answers[i];
    }
    return diff;
}

function MultiNR(lines,parser,solutions){
    // Find variables
    let lineVars;
    let varSet=new Set();
    for (let i=0; i<lines.length; i++){
	lineVars=varsName(lines[i])
	for (let j=0; j<lineVars.length; j++){
	    varSet.add(lineVars[j]);
	}
    }
    let names=[... varSet];

    // First guess and evaluation
    let guesses=[];
    let searchGuess=[];
    let first_guess=find_guessN(lines,names,parser);
    for (let i=0;i<names.length;i++){
	guesses.push(first_guess+Math.random()); // Initial guess + random number
	searchGuess.push(1);
    }

    // Newton-Raphson
    let converged=false;
    let answers=calcFun(parser,lines,names,guesses);
    let dx,converged2;
    let count=0;
    while (!converged){
	dx=step(parser,lines,names,guesses,answers);
	// Line search?
	for (let i=0;i<guesses.length;i++){
	    guesses[i]=guesses[i]-dx.subset(math.index(i));
	}
	answers=calcFun(parser,lines,names,guesses);
	diff=error(answers)
	if (diff<1E-5){
	    converged=true;
	}
	count++;
	if (count>50){
	    console.log('Fail: MultiNR not converged');
	    break;
	}
    }

    for (let i=0;i<names.length;i++){
	solutions.set(names[i],guesses[i]);
    }
    return solutions;    
}

function find_guess(line,name,parser){
    let guess_list = [1,1E2,1E4,1E6];
    let ans_list = [1,1,1];

    for(let i=0;i<guess_list.length;i++){
	parser.set(name,guess_list[i]);
	ans_list[i]=parser.evaluate(line);
    }
    let index;
    let lower=Infinity;
    for(let i=0;i<guess_list.length;i++){
	if ((ans_list!==NaN) && (Math.abs(ans_list[i])<Math.abs(lower))){
	    index=i;
	    lower=ans_list[i];
	}
    }
    return guess_list[index];
}

// 1D solver - Newton Raphson + Line search
function OneNR(line,name,parser){
    // Setup default conditions
    let ans=[1,1];
    let first_guess=find_guess(line,name,parser);
    let guess=[first_guess+Math.random(),1];

    // First eval
    parser.set(name,guess[0]);
    ans[0]=parser.evaluate(line);

    // Root-finding loop
    let count=0;
    let converged=false;
    let deriv,count2,factor,converged2;
    while (!converged){
	// Determine derivative
	deriv=derivative(parser,line,name,ans[0],guess[0])
	// Second loop - Line search
	count2=0;
	factor=1;
	converged2=false;
	while (!converged2){
	    // Test new guess
	    guess[1]=guess[0]-(ans[0]/deriv)*factor;
	    parser.set(name,guess[1]);
	    ans[1]=parser.evaluate(line);

	    // Better guess condition
	    if (Math.abs(ans[1])>Math.abs(ans[0])){
		converged2=false;
		factor/=2 // Try again with smaller step
	    }
	    else {
		converged2=true;
		ans[0]=ans[1];
		guess[0]=guess[1];
	    }

	    // Max iterations condition
	    count2++
	    if (count2>10){
		break; // Prevent infinity loops
	    }
	}

	// Tolerance condition
	if (Math.abs(ans[0])<1E-5){
	    converged=true;
	}

	// Max iterations conditions
	count++;
	if (count>50){
	    console.log('Fail: OneNR not converged');
	    break;
	}
    }
    return parser;
}


// Compare number of vars
function moreVar(a,b){
    let aVars=varsName(a);
    let bVars=varsName(b);
    if (aVars.length<bVars.length){
	return -1;
    }
    if (aVars.length>bVars.length){
	return 1;
    }
    return 0;
}

function checkLine(line){
    if ((line==="")||(line.startsWith("#"))){
	return false;
    }
    return true;
}

function cleanLines(lines){
    let right=[]
    for (let i=0; i<lines.length; i++){
	lines[i]=lines[i].trim();
	if (checkLine(lines[i])){
	    right.push(i);
	}
    }
    let ans=[];
    let transLine;
    for (let i=0;i<right.length;i++){
	transLine=minusRight(lines[right[i]])
	ans.push(transLine);
    }
    return ans;
}

function writeAns(value,key,map){
    value = math.round(value,3);
    let msg=key+" = "+value.toString();
    let para=document.createElement('p');
    para.textContent=msg;
    outDiv.appendChild(para); // out is a global constant
}


// Solve non-linear system
function laine() {
    // Clear space
    outDiv.innerHTML="";
    // Start solver
    let parser=math.parser(); // Create parser object
    let name;
    // Clean and sort
    let lines=(textBox.value).split('\n');
    lines = cleanLines(lines);
    lines.sort(moreVar);
    
    // Solving with substitution
    let solutions = new Map();
    let again = false;
    while (lines.length>0){
	name=varsName(lines[0]);
	if (name.length===1){
	    // Solve
	    parser=OneNR(lines[0],name,parser);
	    solutions.set(name[0],parser.get(name));
	    lines.shift();
	}
	else {
	    // Reduce
	    again = false;
	    for (let i=0; i<lines.length; i++){
		name=varsName(lines[i]);
		for (let j=0; j<name.length; j++){
		    if (solutions.has(name[j])){
			let node = math.parse(lines[i]);
			let trans = node.transform(function (node,path,parent) {
			    if (node.isSymbolNode && node.name === name[j]) {
				return new math.ConstantNode(solutions.get(name[j]))
			    } else {
				return node
			    }
			})
			lines[i]=trans.toString();
			again=true;
		    }
		}
	    }
	    lines.sort(moreVar);
	    if (!again){
		break; // can not solve
	    }
	}
    }
    // Check if there is more
    if (lines.length>0){
	solutions=MultiNR(lines,parser,solutions);
	solutions.forEach(writeAns);
    }
    else{
	solutions.forEach(writeAns); // Write answers
    }
}

/*
  User inputs
*/
solveButton.onclick = laine;

function shortcut(key){
    if (key.code === "F2"){
	laine();
    }
}
document.onkeydown=shortcut;

// Help
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

helpButton.onclick = toggleHelp;

// Functions
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

functionButton.onclick = toggleFunctions;

// Resize
function autosize(e){
    if ((e.keyCode===13)||(e.keyCode===8)||(e.keyCode===46)||(e===true)){
	textBox.style.height="0";
	textBox.style.height=textBox.scrollHeight+"px";
    }
}

autosize(true);
textBox.onkeyup=autosize;

//PropsSI
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

HAPropsSIButton.onclick = generateFun2;
