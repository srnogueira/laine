/*
  Parser - Auxiliary functions
*/

//  Import functions to math.js parser
math.import(
    {
	// PropsSI
	PropsSI:function (n,x,xx,y,yy,f){
	    return Module.PropsSI(n,x,xx,y,yy,f)
	},    
	// HAPropsSI
	HAPropsSI:function (n,x,xx,y,yy,z,zz){
	    return Module.HAPropsSI(n,x,xx,y,yy,z,zz)
	},
	// Nasa Glenn
	NasaSI:function(prop,T,specie){
	    return nasaFun(prop,T,specie)
	},
	// LeeKesler
	LeeKesler:function(prop,Tr,inputX){
	    return lkFun(prop,Tr,inputX)
	},
    }
);

function laineError(name,message,numb) {
    /*
      Function: create error object
    */
    'use strict';
    this.name = name;
    this.message = message;
    this.numb = numb;
    this.alert = `Type: ${name}\nDescription: ${message}\nLine: ${numb}`;
};

/*
  PARSING LINES INTO EQUATIONS
*/

function checkLine(line,number){
    /* 
       Function: checks if the line is an equation
    */
    'use strict';
    if ((line==="")||(line.startsWith("#"))){
	return false;
    }
    const form = /\=/; // OBS: could be improved for '=(blank)' or '(blank)='
    if (!form.test(line)){
	throw new laineError("Not an equation/comment/blank","Something is missing/remaining",number);
    }
    return true;
}

function singleVar(lhs){
    /*
      Function: check if the left-hand side (lhs) of an equation is a single variable
    */
    'use strict';
    const numb = /\d/;
    const op = /(\*|\/|\+|\-|\^|\()/;
    if (numb.test(lhs[0]) || op.test(lhs)){
	return false;
    }    
    return true;
}

function varsName(line){
    /*
      Function: get all variables names of a line text
    */
    'use strict';
    // Parse string
    const node=math.parse(line);
    // Scope
    const scope=parser.getAll();
    // Filter symbol nodes
    const symbolNodes=node.filter((node)=> node.isSymbolNode);
    // Filter function nodes
    const functionNodes=node.filter((node)=> node.type === 'FunctionNode');
    // Store unique symbols that are not functions
    let symbols=[];
    checkFunction: for (let symbolNode of symbolNodes){
	// Pass if is already included
	if (symbols.includes(symbolNode.name)){
	    continue checkFunction;
	}
	// Test if is already parsed/solved
	let test = scope[symbolNode.name];
	if (typeof(test) === "number" || typeof(test) === "function"){
	    continue checkFunction;
	}
	// Test if is a function name
	for (let functionNode of functionNodes){
	    if (symbolNode.name === functionNode.name){
		continue checkFunction;
	    }
        }
	// Include otherwise
	symbols.push(symbolNode.name);
    }
    return symbols;
}

/*
  Equation object
*/

function updateText(text,name,value){
    /*
      Function: make algebraic substitutions in a expression
    */
    'use strict';
    const regex = new RegExp("\\b"+name+"\\b",'g');
    const newText = `(${value.toString()})`
    return text.replace(regex,newText);
};

function updateEquation(name,value){
    /*
      Function: apply algebraic substituitions in a Equation
    */
    'use strict';
    if (name !== undefined && value !== undefined){
	this.lhs=updateText(this.lhs,name,value);
	this.rhs=updateText(this.rhs,name,value);
	this.text = `${this.lhs}-(${this.rhs})`;
    }
    this.vars = varsName(this.text);
};

function Equation(line,number){
    /*
      Function: constructor for equation object
    */
    'use strict';
    // Original text
    let equationText = line.split('#')[0];
    // line number
    this.number = number;
    // Equation sides
    let sides = equationText.split('=');
    this.lhs = sides[0].trim();
    this.rhs = sides[1].trim();
    // is a simple equation? 
    this.simple = singleVar(this.lhs);
    // expression = 0
    this.text = `${this.lhs}-(${this.rhs})`;
    // store vars
    this.vars = varsName(this.text);
    // update equation
    this.update = updateEquation;
}

function cleanLines(lines){
    /*
      Function: Pre-parse lines into equations
    */
    'use strict';
    let equations = [];
    const linesLength = lines.length;
    for (let i=0; i<linesLength; i++){
	// Remove spaces
	lines[i]=lines[i].trim();
	// Check if is an equation
	if (checkLine(lines[i],i+1)){
	    // Check if multi equation
	    const aux = lines[i].split(';');
	    // Store equations
	    for (let subLine of aux){
		try{
		    // Store constants and user-defined functions
		    const ans = parser.evaluate(subLine);
		    if (ans.type==="Unit"){
			// Remove object from parser scope (avoid errors)
			lhs = subLine.split('=')[0].trim();
			parser.remove(lhs);
			// Throw a dummy error
			throw new laineError("Parse error","Not a real evaluation",i+1);
		    }
		}
		catch{
		    // Try to create a equation object
		    try{
			equations.push(new Equation(subLine,i+1));
		    }
		    catch(e){
			throw new laineError("Unexpected error",e,i+1);
		    }
		}
	    }
	}
    }
    return equations;
}

/*
  AUXILARY FUNCTIONS FOR EQUATIONS
*/
function moreVar(a,b){
    /*
      Function: compare number of vars of equations
    */
    'use strict';
    if (a.vars.length<b.vars.length){
	return -1;
    }
    else{
	return 1;
    }
    return 0;
}

/*
  PROBLEM OBJECT
*/
function solveProblem(options){
    /*
      Automate the problem solving
    */
    'use strict';
    // Number of vars
    const dimension = this.equations.length;

    let returned;
    let count = 0;
    let solved = false;
    const maxCount = dimension === 1 ? 3 : 50;
    const tStart = performance.now();
    while (!solved){
	try {
	    count++;
	    returned = solver(this,options);
	    solved=true;
	}
	catch(e){
	    if (performance.now()-tStart>3E3 || count > maxCount){
		console.error(e);
		if (e.alert === undefined){
		    throw new laineError("Unexpected error",e,this.numbers);
		}
		else{
		    throw new laineError('Difficult (or unsolvable) problem','Could not find a solution',this.numbers);
		}
	    }
	    else{
		if (dimension === 1){
		    // Binary search or negative guesses
		    count = options.guess !== undefined ? 0 : count;
		    options.guess = undefined;
		    options.binary = count === 1 ? true: false;
		    options.negative = count === 2 ? true: false;
		}
		else {
		    if (dimension === 2 && count>5){
			options.pairSearch = options.pairSearch ? false: true;
		    }
		    if (count>10){
			options.negative = options.negative ? false: true; // flip - maybe is negative, try once
		    }
		    if (options.excludedList.length > 5){
			options.excludedList = [];
		    }
		}   
	    }   
	}
    }

    if (options.returnValue){
	return returned;
    }
    else{
	return true;
    }
}

function Problem(equations){  
    /*
      Function: create the problem object
    */
    'use strict';
    // Separate information
    let compiled =[];
    let numbers = []
    let names = [];
    let jacAux = [];
    const equationsLength = equations.length;
    for (let i=0; i<equationsLength; i++){
 	compiled[i] = math.compile(equations[i].text); // it is actualy faster to compile only in the Problem
	numbers[i] = equations[i].number;
	const lineVars=equations[i].vars;
	jacAux.push([]);
	// Store variables names and the variables in each line
	for (let symbol of lineVars){
	    if (!names.includes(symbol)){
		names.push(symbol);
		jacAux[i].push(names.length-1);
	    }
	    else{
		const namesLength = names.length;
		for (let z=0; z<namesLength; z++){
		    if (names[z] === symbol){
			jacAux[i].push(z)
			break;
		    }
		}
	    }
	}
	jacAux[i].sort();
    }
    
    this.compiled = compiled;
    this.equations = equations;
    this.names = names;
    this.scope = parser.getAll(); // parser is a global var
    this.numbers = numbers;
    this.jacAux = jacAux;
    this.solve = solveProblem;
}

/* 
   SOLVER
*/

function binary_search(problem){
    /*
      Function: find a 1D guess using binary search
    */
    'use strict';
    // Inputs
    const name = problem.names[0];
    const compiled = problem.compiled[0];
    let scope = problem.scope;
    
    // Define variables
    const points = [1E8,1E6,1E5,6E4,273.15,200,10,4,0.3,0.01,1E-6,-1E-6,-1,-1E4,-1E8];
    
    // First evaluation
    let sign,index,limits,mid;
    let ans=[];
    let lower=Infinity;
    const pointsLength = points.length;
    for (let i=0;i<pointsLength;i++){
	// Try to evaluate guess
	scope[name] = points[i];
	try{
	    ans[i] = compiled.evaluate(scope);
	}
	catch{
	    ans[i] = undefined;
	    sign = undefined;
	    continue;
	}
	
	// If out of range
	if (ans[i]===NaN || typeof(ans[i])!=='number'){
	    sign = undefined;
	    continue;
	}

	let thisSign = Math.sign(ans[i]);
	if (sign !== undefined && sign !== thisSign){
	    limits = [points[i-1],points[i]];
	    ans = [ans[i-1],ans[i]];
	    break;
	}
	else{
	    sign = thisSign;
	}

	let absValue = Math.abs(ans[i]);
	if(absValue<lower){
	    lower=absValue;
	    index=i;
	}
    }

    // If no range is found, return a point close to zero
    if (limits===undefined){
	return points[index];
    }
    
    // Binary search
    let count = 0;
    let mid_ans = 2;
    while (Math.abs(mid_ans) > 1){
	// Calculate midpoint
	mid=(limits[0]+limits[1])/2
	scope[name]=mid
	mid_ans=compiled.evaluate(scope);

	// Choose new brackets
	if (Math.sign(mid_ans) === Math.sign(ans[0])){
	    limits[0]=mid;
	    ans[0]=mid_ans;
	}
	else{
	    limits[1]=mid;
	    ans[1]=mid_ans;
	}
	count++;
	if (count>50){
	    break;
	}
    }
    return [mid];
}

function getGuessList(excludedList,negative){
    /*
      Function : creates the guessList;
    */
    'use strict';
    
    let original = negative ? [-0.01,-0.1,-1,-1E3,-1E5] : [0,0.01,0.05,0.1,0.7,10,3E2,1E3,2E3,1E5];
    let guessList = [];
    for (let guess of original){
	if (!excludedList.includes(guess)){
	    guessList.push(guess);
	}
    }
    if (guessList.length === 0){
	throw laineError('Initial guess','Initial guess was a failure',"null");
    }
    return guessList;
}

function find_guess(problem,options){
    /*
      Function: Find a suitable first guess for multivariable expressions
    */
    // Binary search - for one variable
    'use strict';
    if (options.binary){
	return binary_search(problem);
    }
    
    // Negative or positive guesses
    let guessList;
    if (options.pairSearch === true){
	guessList = options.negative ? [-0.01,-0.1,-1,-1E3,-1E5] : [0,0.01,0.05,0.1,0.7,10,3E2,1E3,2E3,1E5];
    }
    else{
	guessList = getGuessList(options.excludedList,options.negative); //options.negative ? [-0.01,-0.1,-1,-1E3,-1E5] : [0,0.01,0.05,0.1,0.7,10,3E2,1E3,2E3,1E5];
    }
    const guessListLength = guessList.length;
    
    // Check if problem has two variables (better guesses):
    let bestPair = [];
    let guesses = [];
    let lowerPair = Infinity;
    if (problem.names.length === 2 && options.pairSearch){
	let first = true;
	// Evaluations may not be "simmetric"
	let sumFirst=0;
	let countFirst=0;
	let countSecond=0;
	let sumSecond=0;
	for (let x=0 ; x<2 ; x++){
	    // Using flags to switch
	    const f = first ? 0 : 1;
	    const nf = first ? 1 : 0;
	    // Here I use a guess to find another.
	    const fixed = problem.names[f];
	    const notFixed = problem.names[nf];
	    const line = `${problem.equations[f].lhs}=${problem.equations[f].rhs}`;
	    parser.set(fixed,guessList[0]);
	    parser.remove(notFixed); // Have to remove !
	    let scope = parser.getAll();
	    const equation = new Equation(line,problem.equations[f].number);
	    const copy = new Problem([equation]);

	    // Test function
	    const otherLine = `${problem.equations[nf].lhs}=${problem.equations[nf].rhs}`;
	    const otherEquation = new Equation(otherLine,problem.equations[nf].number);
	    const compiledEquation = math.compile(otherEquation.text);
	    
	    // Iterate
	    for (let value of guessList){
		copy.scope[fixed]=value*(1+Math.random()/2);
		let options1D = {binary:false, negative:options.negative, returnValue:true, pairSearch:false, excludedList:[]};
		// Solve and store each pair of solution
		try{
		    const result = solver(copy,options1D);
		    scope[fixed]=copy.scope[fixed];
		    scope[notFixed]=result[0];
		    const error = compiledEquation.evaluate(scope);
		    if (first){
			guesses.push([Math.abs(error),[scope[fixed],scope[notFixed]],first]);
			sumFirst+=Math.abs(error);
			countFirst++;
		    }
		    else{
			guesses.push([Math.abs(error),[scope[notFixed],scope[fixed]],first]);
			sumSecond+=Math.abs(error);
			countSecond++;
		    }
		}
		catch {
		    continue;
		}
	    }
	    first=false;
	}

	// Select the best pair
	const firstAvg = sumFirst/countFirst;
	const secondAvg = sumSecond/countSecond;
	
	for(let guessObject of guesses){
	    let compare = guessObject[2] ? guessObject[0]/firstAvg : guessObject[0]/secondAvg;
	    if (compare!==NaN && compare<lowerPair){
		bestPair=guessObject[1];
		lowerPair=compare;
	    }
	}
	
	return bestPair;
    }
    else{
	// Check a good guess (at least two times)
	let index,lower,varList;
	const names = problem.names;
	const compiled = problem.compiled;
	let scope = problem.scope;
	let avg=[0,0,0,0,0,0,0,0,0,0]; // not ideal, but fast
	let count = 0;
	let varsList;
	while (count<5){
	    // Calculate for each guess
	    let ans_list = [0,0,0,0,0,0,0,0,0,0]; // not ideal, but fast
	    varsList = [[],[],[],[],[],[],[],[],[],[]]; // not ideal, but fast
	    equationLoop:
	    for(let i=0;i<guessListLength;i++){ 
		// Update guess
		for (let name of names){
		    let value = guessList[i]*(1+Math.random());
		    scope[name]=value;
		    varsList[i].push(value);
		}
		// Calculate
		for (let compiledEq of compiled){
		    try{
			const aux=compiledEq.evaluate(scope);
			ans_list[i]+=Math.abs(aux);
		    }
		    catch {
			ans_list[i]=Infinity;
			continue equationLoop;
		    }
		}
	    }
	    // Find the index of the lower value
	    lower=Infinity;
	    for(let i=0;i<guessList.length;i++){
		if (ans_list[i]!==NaN && ans_list[i]<lower){
		    index=i;
		    lower=ans_list[i];
		}
	    }
	    
	    // Exit condition
	    avg[index]+=1;
	    if (avg[index]===2){
		break;
	    }
	    count++
	}
	options.excludedList.push(guessList[index]);
	return varsList[index];
    }
}

function calcFun(problem,guesses,answers){
    /*
      Function: evaluate problem equations
    */
    'use strict';
    let scope = problem.scope;
    const compiled = problem.compiled;
    const names = problem.names;

    // Set all guesses
    const namesLength = names.length;
    for (let i=0;i<namesLength;i++){
	scope[names[i]]=guesses[i];
    }

    // Calculate all lines
    const compiledLength = compiled.length;
    for (let i=0;i<compiledLength;i++){
	answers[i]=compiled[i].evaluate(scope);
    }
    
    return answers;
}

function error(answers){
    /*
      Function: Sum absolute difference - Has to be a sum!
    */
    'use strict';
    let diff=0;
    const answersLength = answers.length;
    for (let i=0; i<answersLength; i++){
	diff+=Math.abs(answers[i]);
    }
    return diff;
}

function derivative(scope,compiled,name,f,x){
    /*
      Function: calculate numerical derivative
    */
    'use strict';
    // Determine x+dx
    const absDelta=1E-8;
    const relDelta=1E-6; 
    let xNear;
    if (x === 0){
	xNear=x+absDelta;
    }
    else{
	xNear = x*(1+relDelta);
    }

    // Calculate derivative
    scope[name]=xNear
    const fNear=compiled.evaluate(scope);
    const dfdx=(fNear-f)/(xNear-x);

    // Change value back - parser scope
    scope[name]=x;
    return dfdx;
}

function update_jac(problem,guesses,answers,jac){
    /*
      Function: Calculate jacobian
    */
    'use strict';
    const compiled = problem.compiled;
    const names = problem.names;
    const answersLength = answers.length;
    let der,jacAux;
    for (let i=0;i<answersLength;i++){
	jacAux = problem.jacAux[i];
	const jacAuxLength = jacAux.length;
	for (let j=0;j<jacAuxLength;j++){
	    der=derivative(problem.scope,compiled[i],names[jacAux[j]],answers[i],guesses[jacAux[j]]);
	    jac.subset(math.index(i,jacAux[j]),der);
	}
    }
    return jac;
}

// OBS : could remove parser, but there are some erros which make this less optimal
function solver(problem,options){
    /*
      Function: Multivariable Newton-Raphson + Line search
    */
    'use strict';
    
    // Initial
    const names = problem.names;
    const namesLength = names.length;
    
    // First guess and evaluation
    let guesses=[];
    let Xguesses=[];
    let answers=[];
    let first_guess;

    if (options.guess===undefined){
	first_guess = find_guess(problem,options);
	if (first_guess === undefined){
	    throw new laineError('Bad start','Initial guess was a failure',problem.numbers);
	}
	for (let i=0;i<namesLength;i++){
	    guesses.push(first_guess[i]);
	}
    }
    else{
	for (let name of names){
	    guesses.push(options.guess[name]);
	}
    }
    answers=calcFun(problem,guesses,answers);
    let diff=error(answers);

    // Newton-Raphson
    let count=0;
    let jac=math.zeros(namesLength,namesLength);
    let dx, Xdiff, factor, count2, guessChange;
    while (count<100){
	// Calculate step
	jac=update_jac(problem,guesses,answers,jac);
	dx=math.multiply(math.inv(jac),answers);

	// Line search loop
        count2=0;
	factor=1;
        lineSearch: while (count2<20){    
	    // Try updated guess
	    for (let i=0;i<namesLength;i++){
		Xguesses[i]=guesses[i]-dx.subset(math.index(i))*factor;
	    }
	    answers=calcFun(problem,Xguesses,answers);
	    
	    // Check if answer is a real number, continue if otherwise
	    for (let i=0;i<namesLength;i++){
		if (typeof(answers[i])!=="number"){
		    factor/=2;
		    count2++;
		    continue lineSearch;
		}
	    }
	    
	    // Calculate and check errors
	    Xdiff=error(answers)
            if (Xdiff>diff){
                factor/=2;
		count2++;
		continue lineSearch;
            }
            else{
		guessChange = Math.abs(1-Xdiff/diff);
                diff=Xdiff;
                for (let i=0;i<namesLength;i++){
	            guesses[i]=Xguesses[i];
	        }
		break lineSearch;
            }
        }

	if (count2 === 20){
	    throw new laineError('Dead end','Line search has not converged',problem.numbers);
	}
	
	// Check convergence
	if (diff<1E-6){
	    // Check if dx is little compared with guess
	    let test = 0;
	    for (let i=0;i<namesLength;i++){
		if (guesses[i]!==0){
		    test+=Math.abs(dx.subset(math.index(i))/guesses[i]);
		}
		else{
		    test+=Math.abs(dx.subset(math.index(i)));
		}
	    }
	    if (test < 1E-6){
		break;
	    }
	    else{
		count++;
	    }
	}
	else if(guessChange===0 && diff<1E-6){
	    // sometimes the solver will not reach diff<1E-9 because of the machine precision 
	    break;
	}
	else if((guessChange===0 && diff>1E-6) || !guesses[0]){
	    throw new laineError('Bad start','Initial guess was a failure',problem.numbers);
	}
	else{
	    count++;
	}

	// Break long iterations
	if (count===99){
	    throw new laineError('Max. iterations','Exceeded the iteration limit',problem.numbers);
	}
    }

    // Update on parser
    if (options.returnValue){
	return guesses;
    }
    else{
	for (let i=0;i<namesLength;i++){
	    parser.set(names[i],guesses[i]);
	}
	return true;
    }
}

/*
  REPORTS
*/

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
		line+=letter.slice(1)+' '+pieces[j];
	    }
	}
    }
    
    // Return parse to Tex
    return math.parse(line).toTex({parenthesis: 'auto'});
}

const mathDiv = document.querySelector(".mathDiv"); // Report element

function writeEqs(lines){
    /*
      Function : Write equations for reports
    */
    'use strict';
    
    // Clear and start
    mathDiv.innerHTML="";
    let title=document.createElement('h2');

    let text;
    const linesLength = lines.length;
    for (let i=0; i<linesLength ; i++){
	// Check if is an equation or comment
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

/*
  LAINE
*/

const outDiv = document.querySelector(".out"); // Solution element
let parser=math.parser();  // create parser object

// Create another version of the solver which uses a Problem as input
function laine_fun(list,fast,plot,guesslist,yVar) {
    /*
      Function : Parse + Solve
      Fast : determines how the solution is presented
      Plot : option that returns the problem to create a plot menu
    */
    'use strict';
    const t1 = performance.now();
    let equations;

    // Parse text or use minimal problem (for plots)
    if (list === undefined){
	// Clear parser and errors
	parser.clear();
    
	// Start solver
	let lines=(editor.getValue()).split("\n");  // break text into lines
    
	// MathJax equations - could be asyncronous.
	if (!fast){
	    writeEqs(lines);
	}
    
	// Get expression lines and 'substitution book'
	equations =cleanLines(lines);  // clean text	    
    }
    else{
	equations = JSON.parse(JSON.stringify(list)) // deepClone (because the algorithm is dumb)
	// parser is a global variable, we just don't erase some variables (related with x)
    }
    equations.sort(moreVar);  // sorting
    
    let name;
    loop1D_2D: while (equations.length>0){
	// Avoid long loops
	if (performance.now()-t1>3E3){
	    throw new laineError('Difficult (or unsolvable) problem',
				 'Could not find a solution',
				 equations[0].number);
	}
	//[plots] Break loop if y is already computed
	if (yVar !== undefined){
	    if (parser.get(yVar)!==undefined){
		return false;
	    }
	}

	// Solve one var problems 
	name=equations[0].vars;

	if (name.length === 0){
	    equations.shift();
	}
	else if (name.length===1){
	    // Check if solution has already been computed
	    if (parser.get(name[0])!==undefined){
	    	throw new laineError('Redefined variable','Variable '+name[0]+' has been redefined',equations[0].number);
	    }
	    // Try to solve the 1D problem
	    let problem1D = new Problem([equations[0]])
	    let options = {negative:false, binary:false, returnValue:false, pairSearch:false, guess:undefined, excludedList:[]};
	    // Try to solve the 1D problem
	    if (guesslist !== undefined){
		options.guess = guesslist;
	    }
	    problem1D.solve(options);
	    equations.shift();  // clear solved line
	}
	else {
	    // Update the number of variables for each equation.
	    let loop1D=false;  // flag
	    let scope=parser.getAll();
	    for (let i=0; i<equations.length; i++){
		name=equations[i].vars;
		for (let j=0; j<name.length; j++){
		    if (scope[name[j]]!==undefined){
			equations[i].vars=varsName(equations[i].text)
			loop1D=true; // flag
			break;
		    }
		}
	    }
	    
	    equations.sort(moreVar);
	    // Loop or try to reduce the number of variables by algebraic substitution
	    if (!loop1D){
		// Apply text substitution using math.js (reduces the chances of failure)
		let changeLine=true;
		let maxTimes=0;
		loop1 : while (changeLine){
		    for(let i=0;i<equations.length;i++){
			changeLine=false;
			name=equations[i].vars
			for (let k=0; k<name.length; k++){
			    for(let j=0;j<equations.length;j++){
				if (!equations[j].simple || j === i){
				    continue;
				}
				if (name[k]===equations[j].lhs){
				    equations[i].update(name[k],equations[j].rhs);
				    changeLine=true;
				}
			    }
			}
			// Check max number of substitutions
			if (changeLine){
			    maxTimes++
			}
			if (maxTimes===(equations.length-1)){
			    break loop1;
			}
		    }
		}
		
		// Check if has an 1D problem to loop or not
		equations.sort(moreVar);
		if (equations[0].vars.length !== 1){
		    // Look for 2D problems
		    let changed = false;
		    let varsA,varsB;
		    loop2D: for (let i = 0; i<equations.length ; i++){
			if (equations[i].vars.length === 2){
			    for (let j = i+1; j<equations.length; j++){
				if (equations[j].vars.length === 2){
				    varsA = equations[i].vars;
				    varsB = equations[j].vars;
				    if ((varsA[0] === varsB[0] && varsA[1] === varsB[1]) || (varsA[1] === varsB[0] && varsA[0] === varsB[1])){
					// Try solving using Newton-Raphson with random guesses multiple times 
					let count=0;
					let options2D = {binary:false, negative:false, returnValue:false, pairSearch:false, guess:undefined, excludedList:[]}
					if (guesslist != undefined){
					    options2D.guess = guesslist;
					}
					let problem = new Problem([equations[i],equations[j]]);
					problem.solve(options2D);
					changed = true;
					break loop2D;
				    }
				}
				else{
				    break loop2D;
				}
			    }
			}			
			else{
			    break loop2D;
			}
		    }
		    if (changed){
			// Update equations
			for (let i=0;i<equations.length;i++){
			    let varsEquation = equations[i].vars;
			    if (varsEquation.includes(varsA[0]) || varsEquation.includes(varsA[1])){
				equations[i].vars = varsName(equations[i].text);
			    }
			}
			equations.sort(moreVar);
		    }
		    else{
			break loop1D_2D;
		    }
		}
	    }
	}
    }

    // Solving multiple equations at the same time
    if (equations.length>0){	
	// Try solving using Newton-Raphson with random guesses multiple times 
	let options = {negative:false, binary:false, pairSearch:false, returnValue:false, guess:undefined, excludedList:[]};
	if (guesslist != undefined){
	    options.guess = guesslist;
	}
	let problem = new Problem(equations);
	
	// Check the problem is correct
	if (equations.length !== problem.names.length){
	    // Return problem to create plot menu
	    if (plot === true){
		return problem;
	    }
	    throw new laineError('Degrees of freedom',`The problem has ${problem.names.length} variables and ${equations.length} equations`,problem.numbers);
	}

	problem.solve(options);
    }

    // If its a plot run, just terminate
    if (list!==undefined){
	return false;
    }
    
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
    const t2 =performance.now();
    console.log("evaluation time:",t2-t1,"ms");
}

function displayError(messageText){
    /*
      Function: display error messages
    */
    'use strict';
    errorBox.innerText = "";
    let header = document.createElement("h2");
    header.innerText= "Error";
    let message = document.createElement("span");
    message.innerText= messageText;
    errorBox.appendChild(header);
    errorBox.appendChild(message);
    errorBox.style.display = "inline-block";
    editor.refresh();
}

function laine(isfast){
    /*
      Function: calls solver for buttons and create a error message if necessary
    */
    'use strict';
    errorBox.style.display = "";
    try{
	laine_fun(undefined,isfast,false,undefined,undefined);
	editor.refresh(); // avoid problems with resize
	return true;
    }
    catch(e){
	console.error(e);
	const errorText = e.alert ? e.alert : e;
	displayError(errorText);
	return false;
    }
}
