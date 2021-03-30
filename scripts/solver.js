/*
  AUXILIARY FUNCTIONS
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
    this.lineNumber = numb;
};

/*
  PARSING LINES INTO EQUATIONS
*/

function checkLine(line,number){
    /* 
       Function: checks if the line is an equation
    */
    'use strict';
    if (line===""||line.startsWith("#")){
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
  EQUATION OBJECT
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

function cleanLines(lines,options){
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
		// check if is a guess
		if(subLine.endsWith("?")){
		    subLine = subLine.slice(0,-1);
		    if (checkLine(subLine,i+1)){
			let sides = subLine.split('=');
			let value = parseFloat(sides[1]);
			if (!value){
			    throw new laineError("Guess input","Please input guesses as 'var = value?'",i+1);
			}
			let name = sides[0].trim();
			options.userGuess[name] = value;
		    }
		    continue;
		}
		try{
		    // Store constants and user-defined functions
		    const ans = parser.evaluate(subLine);
		    if (ans.type==="Unit"){
			// Remove object from parser scope (avoid errors)
			lhs = subLine.split('=')[0].trim();
			parser.remove(lhs);
		    }
		}
		catch(e){
		    //console.error(e);
		    // Try to create a equation object
		    try{
			equations.push(new Equation(subLine,i+1));
		    }
		    catch(e){
			const name = e.name ? e.name : "Unexpected"
			throw new laineError(name,e.message,i+1);
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
	    //console.error(e); // for debug
	    if (performance.now()-tStart>3E3 || count > maxCount){
		throw new laineError("Difficult (or unsolvable) problem","Max. evaluation time or tries",this.numbers);
	    }
	    else{
		if (dimension === 1){
		    // Binary search or negative guesses
		    count = options.guessPlot !== undefined ? 0 : count;
		    options.guessPlot = undefined;
		    options.binary = count === 1 ? true: false;
		    options.negative = count === 2 ? true: false;
		}
		else {
		    if (dimension === 2 && count>4){
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
	catch(e){
	    //console.error(e);
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
		let options1D = {binary:false, negative:options.negative, returnValue:true, pairSearch:false, excludedList:[], userGuess:{}, plotGuess:undefined};
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
		catch(e){
		    //console.error(e);
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
		    let value;
		    if (options.userGuess[name] !== undefined){
			value = options.userGuess[name];
		    }
		    else{
			value = guessList[i]*(1+Math.random());
		    }
		    scope[name]=value;
		    varsList[i].push(value);
		}
		// Calculate
		for (let compiledEq of compiled){
		    try{
			const aux=compiledEq.evaluate(scope);
			ans_list[i]+=Math.abs(aux);
		    }
		    catch(e) {
			//console.error(e);
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
	if (varsList[index] === undefined){
	    throw new laineError("Find guess","Could not find a guess",problem.numbers);
	}
	options.excludedList.push(guessList[index]);;
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

    if (options.guessPlot===undefined){
	first_guess = find_guess(problem,options);
	for (let i=0;i<namesLength;i++){
	    guesses.push(first_guess[i]);
	}
    }
    else{
	for (let name of names){
	    guesses.push(options.guessPlot[name]);
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
  LAINE
*/

const parser=math.parser();  // create parser object

function laine_fun(text,laineOptions) {
    /*
      Function : Parse + Solve
      Fast : determines how the solution is presented
      Plot : option that returns the problem to create a plot menu
    */
    'use strict';
    const t1 = performance.now();
    let equations;

    // Parse text or use minimal problem (for plots)
    // Clear parser and errors
    if (laineOptions.yVar === undefined){
	parser.clear();
    }
    
    // Start solver
    let lines=text.split("\n");  // break text into lines

    // Create options objects
    if (laineOptions === undefined){
	laineOptions = {};
    }
    if (laineOptions.userGuess === undefined){
	laineOptions.userGuess = {};
    }
    // Get expression lines and 'substitution book'
    equations =cleanLines(lines,laineOptions);  // clean text
    equations.sort(moreVar);  // sorting
    
    let name;
    loop1D_2D: while (equations.length>0){
	// Avoid long loops
	if (performance.now()-t1>3E3){
	    throw new laineError('Difficult (or unsolvable) problem','Could not find a solution',equations[0].number);
	}
	//[plots] Break loop if y is already computed
	if (laineOptions.yVar !== undefined){
	    if (parser.get(laineOptions.yVar)!==undefined){
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
	    	throw new laineError('Redefined variable',`Variable ${name[0]} has been redefined`,equations[0].number);
	    }
	    // Try to solve the 1D problem
	    let problem1D = new Problem([equations[0]])
	    let options = {negative:false, binary:false, returnValue:false, pairSearch:false, guessPlot:laineOptions.guessPlot, userGuess:laineOptions.userGuess, excludedList:[]};
	    // Try to solve the 1D problem
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
					let options2D = {binary:false, negative:false, returnValue:false, pairSearch:false, guessPlot:laineOptions.guessPlot, userGuess:laineOptions.userGuess, excludedList:[]};
					let problem = new Problem([equations[i],equations[j]]);
					problem.solve(options2D);
					changed = true;
					break loop2D;
				    }
				}
				else{
				    continue loop2D;
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
	let options = {negative:false, binary:false, pairSearch:false, returnValue:false, guessPlot:laineOptions.guessPlot, userGuess:laineOptions.userGuess, excludedList:[]};
	let problem = new Problem(equations);
	// Check the problem is correct
	if (equations.length !== problem.names.length){
	    // Return problem to create plot menu
	    if (laineOptions.plot === true){
		problem.options = laineOptions.userGuess;
		return problem;
	    }
	    throw new laineError('Degrees of freedom',`The problem has ${problem.names.length} variables and ${equations.length} equations`,problem.numbers);
	}

	problem.solve(options);
    }    
    const t2 =performance.now();
    console.log("evaluation time:",t2-t1,"ms");
}
