'use strict';

// Create a parser object
const parser=math.parser();

/*
  LAINE
*/
function laineSolver(text,laineOptions) {
    /*
      Description : Solves equations from a non-linear system (text) with certain options (laineOptions)
      Returns : a solution object | a problem object
    */
    // SETUP
    const t1 = performance.now();
    // No options included
    laineOptions = laineOptions === undefined ? {} : laineOptions;
    laineOptions.userGuess = laineOptions.userGuess === undefined ? {} : laineOptions.userGuess;
    // Clear parser and errors
    if (laineOptions.yVar === undefined){
	parser.clear();
    }

    // PARSE LINES
    let lines=text.split("\n");  // break text into lines
    let equations;
    equations =cleanLines(lines,laineOptions);  // clean text
    equations.sort((a,b) => a.vars.length - b.vars.length);  // sorting

    // SOLVE 1D AND 2D PROBLEMS
    let name;
    loop1D_2D: while (equations.length>0){
	// Avoid long loops
	if (performance.now()-t1>3E3){
	    throw new laineError('Difficult (or unsolvable) problem','Could not find a solution',equations[0].number);
	}
	// In Plots : break loop if y is already computed
	if (laineOptions.yVar !== undefined){
	    if (parser.get(laineOptions.yVar)!==undefined){
		return false;
	    }
	}

	// Get number of variables : (0) just remove ; (1) 1D solve; (2+) try to reduce size  
	name=equations[0].vars;
	if (name.length === 0){
	    equations.shift();
	}
	else if (name.length===1){
	    // SOLVE 1D PROBLEM
	    // Check if solution has already been computed
	    if (parser.get(name[0])!==undefined){
	    	throw new laineError('Redefined variable',`Variable ${name[0]} has been redefined`,equations[0].number);
	    }
	    // Try to solve the 1D problem
	    let problem1D = new Problem([equations[0]])
	    let options = solveOptions(laineOptions);
	    // Try to solve the 1D problem
	    problem1D.solve(options);
	    equations.shift();  // clear solved line
	}
	else {
	    // TRY TO REDUCE PROBLEM DIMENSIONS
	    // (1) Remove vars that already have been computed
	    let loop1D=false;  // flag
	    let scope=parser.getAll();
	    for (let i=0; i<equations.length; i++){
		name=equations[i].vars;
		for (let j=0; j<name.length; j++){
		    if (scope[name[j]]!==undefined){
			equations[i].updateComputedVars();
			loop1D=true; // flag
			break;
		    }
		}
	    }
	    equations.sort((a,b) => a.vars.length - b.vars.length);

	    if (!loop1D){
		// (2) Algebraic substitution
	    	let changeLine=true;
		let maxTimes=0;
		substitutions : while (changeLine){
		    for(let i=0;i<equations.length;i++){
			changeLine=false;
			name=equations[i].vars;
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
			    maxTimes++;
			}
			if (maxTimes===(equations.length-1)){
			    break substitutions;
			}
		    }
		}
		equations.sort((a,b) => a.vars.length - b.vars.length);

		if (equations[0].vars.length !== 1){
		    // TRY TO FIND 2D PROBLEMS AND SOLVE
		    let changed = false;
		    let varsA,varsB;
		    loop2D: for (let i = 0; i<equations.length ; i++){
			if (equations[i].vars.length === 2){
			    for (let j = i+1; j<equations.length; j++){
				if (equations[j].vars.length === 2){
				    varsA = equations[i].vars;
				    varsB = equations[j].vars;
				    if ((varsA[0] === varsB[0] && varsA[1] === varsB[1]) || (varsA[1] === varsB[0] && varsA[0] === varsB[1])){
					let options2D = solveOptions(laineOptions);
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

		    // If sucessfull, update equations and loop;  break the loop, otherwise.
		    if (changed){
			for (let i=0;i<equations.length;i++){
			    let varsEquation = equations[i].vars;
			    if (varsEquation.includes(varsA[0]) || varsEquation.includes(varsA[1])){
				equations[i].updateComputedVars();
			    }
			}
			equations.sort((a,b)=>a.vars.length - b.vars.length);
		    }
		    else{
			break loop1D_2D;
		    }
		}
	    }
	}
    }

    // SOLVE PROBLEMS WITH 'N' DIMENSIONS
    if (equations.length>0){
	// Terminate if is a "plot run"
	if (laineOptions.plot === true){
	    let problem = new Problem(equations);
	    problem.options = laineOptions.userGuess;
	    return problem;
	}

	// Separate the problem in blocks if possible: this method does not guarantee a block with minimal size
	while(equations.length !== 0){
	    let vars = new Set(equations[0].vars);
	    let block = [equations[0]];
	    equations.shift();
	    let count = 0;
	    blockSearch:
	    while(vars.size !== block.length && equations.length !== 0 && count < equations.length){
		// check if next equation has variables of the block
		for(let name of equations[count].vars){
		    if (vars.has(name)){
			for (let name2 of equations[count].vars){
			    vars.add(name2);
			}
			block.push(equations[count]);
			equations.splice(count,1);
			count = 0;
			continue blockSearch;
		    }
		}
		count++;
	    }
	    let options = solveOptions(laineOptions);
	    let problem = new Problem(block);
	    // Check the problem is correct
	    if (block.length !== problem.names.length){
		throw new laineError('Degrees of freedom',`The problem has ${problem.names.length} variables and ${block.length} equations`,problem.numbers);
	    }
	    problem.solve(options);

	    // In Plots : break loop if y is already computed
	    if (laineOptions.yVar !== undefined){
		if (parser.get(laineOptions.yVar)!==undefined){
		    return false;
		}
	    }
	    
	    // Loop with updated values if there is more equations to solve 
	    if (equations.length !== 0){
		for (let equation of equations){
		    equation.updateComputedVars();
		}
	    }
	}
    }    
    const t2 =performance.now();
    console.log("evaluation time:",t2-t1,"ms");
}

/*
  AUXILIARY FUNCTIONS
*/
function laineError(name,message,numb) {
    /*
      Function: create error object
    */
    this.name = name;
    this.message = message;
    this.lineNumber = numb;
};

/*
  PARSING LINES INTO EQUATIONS
*/
function cleanLines(lines,options){
    /*
      Function: Pre-parse lines into equations
    */
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
		let sides = subLine.split('=');
		// check if is a guess
		if(subLine.endsWith("?")){
		    subLine = subLine.slice(0,-1);
		    if (checkLine(subLine,i+1)){
			let value = parseFloat(sides[1]);
			if (!value){
			    throw new laineError("Guess input","Please input guesses as 'var = value?'",i+1);
			}
			let name = sides[0].trim();
			options.userGuess[name] = value;
		    }
		    continue;
		}
		// If the equations is 'var = something', chances are that we can simply evaluate the expression;
		if (singleVar(sides[0])){
		    try{
			// Store constants and user-defined functions
			const ans = parser.evaluate(subLine);
			if (ans.type==="Unit"){
			    // Remove object from parser scope (avoid errors)
			    const lhs = sides[0].trim();
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
			    //console.error(e);
			    const name = e.name ? e.name : "Unexpected"
			    throw new laineError(name,e.message,i+1);
			}	
		    }
		}
		else{
		    // Try to create a equation object
		    try{
			equations.push(new Equation(subLine,i+1));
		    }
		    catch(e){
			//console.error(e);
			const name = e.name ? e.name : "Unexpected"
			throw new laineError(name,e.message,i+1);
		    }
		}
	    }
	}
    }
    return equations;
}

function checkLine(line,number){
    /* 
       Function: checks if the line is an equation
    */
    if (line===""||line.startsWith("#")){
	return false;
    }
    const form = /\=/; // OBS: could be improved for '=(blank)' or '(blank)='
    if (!form.test(line)){
	throw new laineError("Not an equation/comment/blank","Something is missing/remaining",number);
    }
    return true;
}

/*
  EQUATION OBJECT
*/
function Equation(line,number){
    /*
      Function: constructor for equation object
    */
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
    this.updateComputedVars = updateComputedVars;
    this.update = updateEquation;
}

function singleVar(lhs){
    /*
      Function: check if the left-hand side (lhs) of an equation is a single variable
    */
    const numb = /\d/;
    const op = /(\*|\/|\+|\-|\^)/;
    if (numb.test(lhs[0]) || op.test(lhs)){
	return false;
    }    
    return true;
}

function varsName(line){
    /*
      Function: get all variables names of a line text
    */
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

function updateEquation(name,value){
    /*
      Function: apply algebraic substituitions in a Equation
    */
    if (name !== undefined && value !== undefined){
	this.lhs=updateText(this.lhs,name,value);
	this.rhs=updateText(this.rhs,name,value);
	this.text = `${this.lhs}-(${this.rhs})`;
    }
    this.vars = varsName(this.text);
};

function updateText(text,name,value){
    /*
      Function: make algebraic substitutions in a expression
    */
    const regex = new RegExp("\\b"+name+"\\b",'g');
    const newText = `(${value.toString()})`
    return text.replace(regex,newText);
};

function updateComputedVars(){
    /*
      Function: update number of variables based on the parser scope
    */
    const scope = parser.getAll();
    const names = this.vars;
    let namesLength = names.length;
    // Remove if computed;
    for (let i=0;i<namesLength;i++){
	if (scope[names[i]] !== undefined){
	    names.splice(i,1);
	    i--;
	    namesLength--;
	}
    }
}

/*
  PROBLEM OBJECT
*/
function Problem(equations){  
    /*
      Function: create the problem object
    */
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

function solveProblem(options){
    /*
      Automate the problem solving
    */
    // Number of vars
    const dimension = this.equations.length;
    let returned;
    let count = 0;
    let solved = false;
    const maxCount = dimension === 1 ? 4 : 10;
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
		    options.excludedList = count === 1 ? true: false;
		    options.binary = count === 2 ? true: false;
		}
		else {
		    options.excludedList = options.excludedList ? false: true;
		    if (count===2 || count===3 || count === 6 || count ===7){
			options.pairSearch = true;
		    }
		    else{
			options.pairSearch = false;
		    }
		    if (count>3 && count <8){
			options.negative = true; 
		    }
		    else{
			options.negative = false;
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

function solveOptions(laineOptions){
    /*
      Creates a default option object for solve function
    */
    return {negative:false,
	    binary:false,
	    returnValue:false,
	    pairSearch:false,
	    guessPlot:laineOptions.guessPlot,
	    userGuess:laineOptions.userGuess,
	    excludedList:false};
}

/*
  AUTOMATE GUESS SEARCH
*/
function Guess(array,error){
    /*
      A guess object
    */
    this.value = array;
    this.error = error;
}

function find_guess(problem,options){
    /*
      Function: Find a suitable first guess for multivariable expressions
    */
    // Binary search - for one variable
    if (options.binary){
	return binary_search(problem);
    }
    
    // Negative or positive guesses
    let guessList = getGuessList(options);
    const guessListLength = guessList.length;
    
    // Check if problem has two variables (better guesses):
    let bestPair = [];
    let guesses = [];
    let lowerPair = Infinity;
    if (problem.names.length === 2 && options.pairSearch){ // This could be done recursivelly using userGuess.
	// Recursive search
	let guessOptions=[];
	options.pairSearch=false;
	for (let name of problem.names){
	    for (let guess of guessList){
		options.userGuess[name.trim()]=guess;
		try{
		    let result = find_guess(problem,options);
		    if (result !== undefined && result.length !== 0){
			guessOptions.push(result[0]);
		    }
		}
		catch(e){
		    //console.error(e);
		    continue;
		}
	    }
	    delete options.userGuess[name.trim()];
	}
	if (guessOptions.length === 0 ){
	    throw laineError("Guess error","Could not find a guess",problem.numbers);
	}
	options.pairSearch=true;
	guessOptions.sort((a,b)=>a.error-b.error);
	return guessOptions;
    }
    else{
	// Check a good guess (at least two times)
	let index,lower,error;
	const names = problem.names;
	const compiled = problem.compiled;
	let scope = problem.scope;
	let guesses = [];
	// Calculate for each guess
	equationLoop:
	for(let i=0;i<guessListLength;i++){ 
	    let varsList = []; // not ideal, but fast
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
		varsList.push(value);
	    }
	    // Calculate
	    error = 0
	    for (let compiledEq of compiled){
		try{
		    const aux=compiledEq.evaluate(scope);
		    if (aux !== Infinity && !isNaN(aux)){
			error+=Math.abs(aux);
		    }
		    else{
			continue equationLoop;
		    }
		}
		catch(e) {
		    //console.error(e);
		    continue equationLoop; // does not include 
		}
	    }
	    guesses.push(new Guess(varsList,error));
	}
	// Sort
	if (guesses.length !==0){
	    guesses.sort((a,b)=>a.error-b.error);
	}
	else{
	    throw new laineError("Find guess","Could not find a guess",problem.numbers);
	}
	return guesses;
    }
}

function binary_search(problem){
    /*
      Function: find a 1D guess using binary search
    */
    // Inputs
    const name = problem.names[0];
    const compiled = problem.compiled[0];
    let scope = problem.scope;
    
    // Define variables : points have to respect the limits of thermodynamic functions
    const points = [1E6,1E4,6E3,273.15,2E2,1E2,1,1E-2,0,-1E-2,-1,-1E2,-1E4,-1E6];

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
	if (isNaN(ans[i]) || typeof(ans[i])!=='number'){
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
    return [new Guess([mid],0)];
}

function getGuessList(options){
    /*
      Function : creates the guessList;
    */
    let guessList = options.excludedList ? [0,1E-4,1E-2,1,100,1E4,1E6] : [0,1E-5,1E-3,0.1,10,1E3,1E5];
    if (options.negative){
	for (let i=0; i<guessList.length ; i++){
	    guessList[i] *= -1;
	}
    }
    return guessList;
}

/* 
   SOLVER
*/
function solver(problem,options){
    /*
      Function: Multivariable Newton-Raphson + Line search
    */
    // Initial
    const names = problem.names;
    const namesLength = names.length;
    
    // First guess and evaluation
    let guesses=[];
    let Xguesses=[];
    let answers=[];
    let guessOptions,guessTry;

    if (options.guessPlot===undefined){
	guessOptions = find_guess(problem,options);
    }
    else{
	let values=[]
	for (let name of names){
	    values.push(options.guessPlot[name]);
	}
	guessOptions = [new Guess(values,0)]
    }
    let jac=math.zeros(namesLength,namesLength);
    let dx, Xdiff, factor, count, count2, guessChange;
    let countOptions = 0
    guessLoop:
    while (countOptions<3 && guessOptions.length>0){
	guessTry = guessOptions[0];
	guesses=[];
	for (let i=0;i<namesLength;i++){
	    guesses.push(guessTry.value[i]);
	}
	answers=calcFun(problem,guesses,answers);
	let diff=error(answers);

	count=0;
	// Newton-Raphson
	while (count<100){
	    // Calculate step
	    jac=update_jac(problem,guesses,answers,jac); // this could be optimized
	    dx=math.multiply(math.inv(jac),answers); // this could be optimized

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
		    if (isNaN(answers[i]) || typeof(answers[i])!=="number"){
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
		// Dead end : Line search has not converged
		guessOptions.shift();
		countOptions++;
		continue guessLoop;
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
		    break guessLoop;
		}
		else{
		    count++;
		}
	    }
	    else if(guessChange===0 && diff<1E-6){
		// sometimes the solver will not reach diff<1E-9 because of the machine precision or 'bad functions'
		break guessLoop;
	    }
	    else if((guessChange===0 && diff>1E-6) || !guesses[0]){
		// Bad start : Initial guess was a failure
		guessOptions.shift();
		countOptions++;
		continue guessLoop;
	    }
	    else{
		count++;
	    }

	    // Break long iterations
	    if (count===99){
		// Max. iterations : Exceeded the iteration limit',problem.numbers
		guessOptions.shift();
		countOptions++;
		continue guessLoop;
	    }
	}
    }

    if (guessOptions.length === 0 || countOptions === 3){
	throw new laineError('Bad start','Initial guess was a failure',problem.numbers);
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

function calcFun(problem,guesses,answers){
    /*
      Function: evaluate problem equations
    */
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
