'use strict';
// Create a parser object as global object
const parser=math.parser();
// LAINE
function laineSolver(text,laineOptions) {
    // Description : Solves equations from a non-linear system (text) with certain options (laineOptions)
    // SETUP
    const t1 = performance.now();
    // No options included
    laineOptions = laineOptions === undefined ? {} : laineOptions;
    laineOptions.userGuess = laineOptions.userGuess === undefined ? {} : laineOptions.userGuess;
    // Clear parser and errors
    if (laineOptions.solveFor === undefined){
	parser.clear();
    }
    // PARSE LINES
    let lines=text.split("\n");  // break text into lines
    let equations;
    let subsEquations=[];
    let subsEquationsNames = new Set();
    equations =cleanLines(lines,laineOptions);
    let originalSize = equations.length;
    // REDUCE COMPLEXITY
    if (!laineOptions.solveFor){
	let check = []; // to check duplicates
	// get algebraic substitutions
	let scope = parser.getAll();
	for (let i=0; i<equations.length; i++){
	    check.push(equations[i].text);
	    equations[i].updateComputedVars();
	    let name = equations[i].lhs.trim();
	    if (equations[i].simple && scope[name]===undefined && !subsEquationsNames.has(name)){
		subsEquations.push(equations[i]);
		subsEquationsNames.add(name);
		equations.splice(i,1);
		i--;
	    }
	}
	// Check if has duplicates
	check = new Set(check);
	if (check.size !== originalSize){
	    // Find the copies
	    let copies = new Set();
	    for (let i=0;i<equations.length;i++){
		for (let j=0;j<equations.length;j++){
		    if (i!==j && equations[i].text == equations[j].text){
			copies.add(equations[i].number);
			copies.add(equations[j].number);
		    }
		}
	    }
	    throw new laineError('Duplicated equation',
				 `The problem has multiple copies of a same equation`,
				 `Line(s) ${[...copies].join(', ')}`,
				 'Remove the copies');
	}
	// subtstitute between substitutions
	if (subsEquations.length > 0){
	    let changeLine=true;
	    let maxTimes=0;
	    substitutions : while (changeLine){
		for(let i=0;i<subsEquations.length;i++){
		    changeLine=false;
		    let name=subsEquations[i].vars;
		    for (let k=0; k<name.length; k++){
			for(let j=0;j<subsEquations.length;j++){
			    if (j === i){
				continue;
			    }
			    if (name[k]===subsEquations[j].lhs){
				subsEquations[i].update(name[k],subsEquations[j].rhs);
				changeLine=true;
			    }
			}
		    }
		    // Check max number of substitutions
		    if (changeLine){
			maxTimes++;
		    }
		    if (maxTimes===(subsEquations.length-1)){
			break substitutions;
		    }
		}
	    }
	    // Substitute in equations
	    for(let subsEquation of subsEquations){
		let subs = subsEquation.lhs.trim();
		for(let equation of equations){
		    for (let name of equation.vars){
			if (name===subs){
			    equation.update(name,subsEquation.rhs);
			}
		    }
		}
	    }
	}
    }
    equations.sort((a,b) => a.vars.length - b.vars.length);  // sorting
    // SOLVE 1D-2D PROBLEMS
    equations = solve1D2D(equations,laineOptions);
    if (!equations){
	return false;
    }
    if (equations.length>0){
	equations = solveND(equations,laineOptions);
    }
    if (!equations){
	return false;
    }
    // SOLVE SUBSTITUTIONS
    subsEquations.sort((a,b) => a.vars.length - b.vars.length);  // sorting
    laineOptions.simples = true; // activate simple evaluation
    subsEquations = solve1D2D(subsEquations,laineOptions);
    if (!subsEquations){
	return false;
    }
    if (subsEquations.length>0){
	subsEquations = solveND(subsEquations,laineOptions);
    }
    // DELIVER A PROBLEM (IF REQUESTED)
    if (laineOptions.returnProblem){
	for (let subEquation of subsEquations){
	    subEquation.updateComputedVars();
	}
	for (let equation of equations){
	    subsEquations.push(equation);
	}
	let problem = new Problem(subsEquations);
	problem.options = laineOptions.userGuess;
	return problem;
    }
    if (!subsEquations){
	return false;
    }
    const t2 =performance.now();
    console.log("evaluation time:",t2-t1,"ms");
}
//  AUXILIARY FUNCTIONS
function laineError(name,message,numb,help) {
    /*
      Function: create error object
    */
    this.name = name;
    this.message = message;
    this.lineNumber = numb;
    this.help = help;
};
function solve1D2D(equations,laineOptions){
     // SOLVE 1D AND 2D PROBLEMS
    let name;
    let t1 = performance.now();
    let scope;
    loop1D_2D: while (equations.length>0){
	// Avoid long loops
	if (performance.now()-t1>3E3){
	    throw new laineError('Max. evaluation time',
				 'laine could not find a solution for 1D/2D problems in less than 3 seconds',
				 `Stopped at line ${equations[0].number}`,
				 'Try to simplify the problem and contact the developer');
	}
	// In Plots : break loop if y is already computed
	if (laineOptions.solveFor !== undefined){
	    if (parser.get(laineOptions.solveFor)!==undefined){
		return false;
	    }
	}
	// Get number of variables : (0) just remove ; (1) 1D solve; (2) 2D solve  
	name=equations[0].vars;
	if (name.length === 0){
	    throw new laineError('Redefined variable / No variable',
				 `Some variable has been redefined / There is no variables`,
				 `Line ${equations[0].number}`,
				 `Remove or correct the line ${equations[0].number}`);
	}
	else if (name.length===1){
	    // Try to simply evaluate
	    if (laineOptions.simples){
		try{
		    parser.evaluate(`${equations[0].lhs}=${equations[0].rhs}`)
		    if (parser.get(name[0]) !== undefined){
			equations.shift();
			continue loop1D_2D;
		    }
		}
		catch(e){
		    //console.error(e);
		}
	    }
	    // SOLVE 1D PROBLEM
	    // Try to solve the 1D problem
	    let problem1D = new Problem([equations[0]])
	    if (parser.get(problem1D.names[0]) !== undefined){
		throw new laineError('Redefined variable',
				     `Some variable has been redefined`,
				     `Line ${problem1D.numbers}`,
				     'Remove or correct the line aforementioned');
	    }
	    let options = solveOptions(laineOptions);
	    problem1D.solve(options);
	    equations.shift();  // clear solved line
	}
	else {
	    // TRY TO REDUCE PROBLEM DIMENSIONS
	    // (1) Remove vars that already have been computed
	    let loop1D=false;  // flag
	    scope=parser.getAll();
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
					equations.splice(i,1);
					equations.splice(j-1,1);
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
		    // If sucessfull, update equations and loop; else, break the loop.
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
    return equations;
}
function solveND(equations,laineOptions){
    // SEPARATE BLOCKS
    // OBS: this method does not guarantee a block with minimal size
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
	    if (!laineOptions.returnProblem){
		let help;
		let df = problem.names.length - block.length
		if (df < 0){
		    help = `Try to remove ${-df} equation(s) with at least one of these variables: ${problem.names.join(', ')}`;
		}
		else{
		    help = `Try to include ${df} equation(s) with at least one of these variables: ${problem.names.join(', ')}`;
		}
		throw new laineError('Degrees of freedom',
				     `The problem has ${problem.names.length} variables and ${block.length} equations`,
				     `Line(s) ${problem.numbers}`,
				     help);
	    }
	    else{
		return block;
	    }
	}
	problem.solve(options);
	// In Plots : break loop if y is already computed
	if (laineOptions.solveFor !== undefined){
	    if (parser.get(laineOptions.solveFor)!==undefined){
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
    return true;
}
//  PARSING LINES INTO EQUATIONS
function cleanLines(lines,options){
    // Function: Pre-parse lines into equations
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
		// Check if is a guess
		if(subLine.endsWith("?")){
		    subLine = subLine.slice(0,-1);
		    if (checkLine(subLine,i+1)){
			let value;
			sides[1] = sides[1].trim().slice(0,-1);
			try{
			    value = math.evaluate(sides[1]);
			}
			catch(e){
			    // console.log(e);
			    throw new laineError("Guess syntax",
						 "Guesses should follow this syntax: variable = value ?",
						 `Line ${i+1}`,
						 "Change the guess to a valid input or remove it");
			}
			let name = sides[0].trim();
			options.userGuess[name] = value;
		    }
		    continue;
		}
		// If the equations is 'var = something', chances are that we can simply evaluate the expression;
		if (singleVar(sides[0])){
		    // Check if is already computed
		    if (parser.get(sides[0].trim())!==undefined){
			// Try to evaluate
			try{
			    const ans = parser.evaluate(subLine);			    
			    throw new laineError('Redefined variable',
						 `Variable ${sides[0].trim()} has been redefined`,
						 `Line ${i+1}`,
						 `Remove or correct line ${i+1}`);
			}
			catch(e){
			    if (e.name == "Redefined variable"){
				throw e;
			    }
			}
		    }
		    // Check if is function erasing a variable
		    if (sides[0].endsWith(")")){
			let name = sides[0].split('(');
			if (parser.get(name[0].trim())!==undefined){
			throw new laineError('Redefined variable with a function',
					     `Variable ${name[0].trim()} has been redefined with a function`,
					     `Line ${i+1}`,
					     `Remove or correct line ${i+1}`);
			}
		    }
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
			    throw new laineError("Parsing error",
						 `laine could not parse the equation in line ${i+1}`,
						 `Line ${i+1}`,
						 e.message);
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
			throw new laineError("Parsing error",
					     `laine could not parse the equation in line ${i+1}`,
					     `Line ${i+1}`,
					     e.message);
		    }
		}
	    }
	}
    }
    return equations;
}
function checkLine(line,number){
    // Function: checks if the line is an equation
    if (line===""||line.startsWith("#")){
	return false;
    }
    const form = /\=/; // OBS: could be improved for '=(blank)' or '(blank)='
    if (!form.test(line)){
	throw new laineError("Not an equation, comment or blank",
			     `Line ${number} is not a valid line in laine`,
			     `Line ${number}`,
			     "Verify if there is something missing or strange in this line");
    }
    return true;
}
// EQUATION OBJECT
function Equation(line,number){
    // Function: constructor for equation object
    // Original text
    let equationText = line.split('#')[0];
    // line number
    this.number = number;
    // Equation sides
    let sides = equationText.split('=');
    this.lhs = sides[0].trim();
    this.rhs = sides[1].trim();
    // is a simple equation? 
    this.simple = singleVar(this.lhs,this.rhs);
    // expression = 0
    this.text = `${this.lhs}-(${this.rhs})`;
    // store vars
    this.vars = varsName(this.text);
    // update equation
    this.updateComputedVars = updateComputedVars;
    this.update = updateEquation;
}
function singleVar(lhs,rhs){
    // Function: check if the left-hand side (lhs) of an equation is a single variable
    const numb = /\d/;
    const op = /(\*|\/|\+|\-|\^)/;
    // Check if sole side
    if (numb.test(lhs[0]) || op.test(lhs)){
	return false;
    }
    let name = new RegExp(lhs.trim()+"[\s|(\\*|\\+|\\-|\\/)]");
    // Now check if there the same variable is not on the other side
    if (name.test(rhs)){
	return false;
    }
    else{
	return true;
    }
}
function varsName(line){
    // Function: get all variables names of a line text
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
    // Function: apply algebraic substituitions in a Equation
    if (name !== undefined && value !== undefined){
	this.lhs=updateText(this.lhs,name,value);
	this.rhs=updateText(this.rhs,name,value);
	this.text = `${this.lhs}-(${this.rhs})`;
    }
    this.vars = varsName(this.text);
};
function updateText(text,name,value){
    // Function: make algebraic substitutions in a expression
    const regex = new RegExp("\\b"+name+"\\b",'g');
    const newText = `(${value.toString()})`
    return text.replace(regex,newText);
};
function updateComputedVars(){
    // Function: update number of variables based on the parser scope
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
//PROBLEM OBJECT
function Problem(equations){  
    // Function: create the problem object
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
    // Automate the problem solving
    // Number of vars
    const dimension = this.equations.length;
    let returned;
    let count = 0;
    let solved = false;
    const tStart = performance.now();
    const maxTimes = dimension > 1 ? 20 : 5;
    while (!solved){
	try {
	    count++;
	    returned = solver(this,options);
	    solved=true;
	}
	catch(e){
	    //console.error(e); // for debug
	    if (performance.now()-tStart>2E3 || count >= maxTimes){
		throw new laineError("Difficult problem or there are no real solutions",
				     "laine could not find a feasible solution",
				     `Lines ${this.numbers.join(', ')}`,
				     `1. Check if the problem is correct and there are real solutions \n\n 2. Try to provide a guess for one (or more) of these variables:\n${this.names.join(', ')}\n Input a guess by using a question mark (?):\n variable = value ?\n\n 3. Contact the developer`);
	    }
	    else{
		if (dimension === 1){
		    // Binary search or negative guesses
		    count = options.savedSolution !== undefined ? 0 : count;
		    options.savedSolution = undefined;
		    options.excludedList = count === 1 ? true: false;
		    options.binary = count === 2 ? true: false;
		    options.negative = count === 3 ? true: false;
		}
		else{
		    options.excludedList = options.excludedList ? false: true;
		    if ((count===2 || count===3 || count === 6 || count ===7)){
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
    // Creates a default option object for solve function
    return {negative:false,
	    binary:false,
	    returnValue:false,
	    pairSearch:false,
	    savedSolution:laineOptions.savedSolution,
	    userGuess:laineOptions.userGuess,
	    excludedList:false};
}
// AUTOMATE GUESS SEARCH
function Guess(array,error){
    // A guess object
    this.value = array;
    this.error = error;
}
function find_guess(problem,options){
    // Function: Find a suitable first guess for multivariable expressions
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
    if (problem.names.length === 2 && options.pairSearch){
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
	if (guessOptions.length === 0){
	    throw laineError("Guess error [internal]","Pair seach could not find a guess",problem.numbers);
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
		    if (Math.abs(aux) !== Infinity && !isNaN(aux)){
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
	    throw new laineError("Guess error [internal]","Random search could not find a guess",problem.numbers);
	}
	return guesses;
    }
}
function binary_search(problem){
    // Function: find a 1D guess using binary search
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
	throw new laineError("Guess error [internal]","Binary search could not find a guess",problem.numbers);
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
    let guessList = options.excludedList ? [0,1E-4,1E-2,1,100,1E4,1E6] : [0,1E-5,1E-3,0.1,10,150,1E3,1E5];
    // 150 was included because in some cases the temperature range is quite short (120-300K)
    if (options.negative){
	for (let i=0; i<guessList.length ; i++){
	    guessList[i] *= -1;
	}
    }
    return guessList;
}
//  SOLVER
function solver(problem,options){
    // Function: Multivariable Newton-Raphson + Line search
    // Initial
    const names = problem.names;
    const namesLength = names.length;
    // First guess and evaluation
    let guesses;
    let Xguesses=math.zeros(namesLength,1);
    let answers=math.zeros(namesLength,1);;
    let guessOptions,guessTry;
    if (options.savedSolution===undefined){
	guessOptions = find_guess(problem,options);
    }
    else{
	let values=[]
	for (let name of names){
	    values.push(options.savedSolution[name]);
	}
	guessOptions = [new Guess(values,0)]
    }
    let jac=math.zeros(namesLength,namesLength,'sparse');
    let diff,jacInv, dx, Xdiff, factor, count, count2, guessChange;
    let countOptions = 0
    let tStart = performance.now();
    let tol = 1E-6;
    guessLoop:
    while (countOptions<3 && guessOptions.length>0){
	if ((performance.now()-tStart)>3E3){
	    throw new laineError("Max. Time [internal]","Max. evaluation time on solver",this.numbers);
	}
	guessTry = guessOptions[0];
	guesses=math.zeros(namesLength,1);
	for (let i=0;i<namesLength;i++){
	    guesses.set([i,0],guessTry.value[i]);
	}
	answers=calcFun(problem,guesses,answers);
	diff=Math.abs(math.sum(answers));
	count=0;
	// Newton-Raphson
	let time = 0;
	let test = 0;
	let bad = false;
	let ta;
	loopNR:
	while (count<200){
	    // Calculate step
	    if ((count > 0) && bad && namesLength>1){
		// Broyden requires more iterations but reduces the time and error* on Jacobian evaluations
		// However, Broyden does not converge if used too many times, so here it is only used once between Jacobian evaluations.
		test = math.multiply(answers,math.transpose(dx));
		test = math.divide(test,math.dot(dx,dx));
		jac = math.add(jac,test);
		bad = false;
	    }
	    else{
		jac=update_jac(problem,guesses,answers,jac); // this could be optimized
		if ((performance.now()-ta)>5){
		    bad = true;
		}
	    }
	    jacInv = math.inv(jac);
	    dx=math.multiply(jacInv,answers); // this could be optimized
	    // Line search loop
	    count2=0;
	    factor=1;
            lineSearch: while (count2<20){    
		// Try updated guess
		Xguesses = math.subtract(guesses,math.multiply(dx,factor));
		answers=calcFun(problem,Xguesses,answers);
		// Check if answer is a real number, continue if otherwise
		for (let i=0;i<namesLength;i++){
		    if (isNaN(answers.get([i,0])) || typeof(answers.get([i,0]))!=="number"){
			factor/=2;
			count2++;
			continue lineSearch;
		    }
		}
		// Calculate and check errors
		Xdiff=Math.abs(math.sum(answers));
		if (Xdiff>diff){
                    factor/=2;
		    count2++;
		    continue lineSearch;
		}
		else{
		    guessChange = Math.abs(1-Xdiff/diff);
		    diff=Xdiff;
		    guesses = Xguesses;
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
	    if (diff<tol){
		// Check if dx is little compared with guess
		let test = 0;
		for (let i=0;i<namesLength;i++){
		    if (guesses.get([i,0])!==0){
			test+=Math.abs(dx.get([i,0])/guesses.get([i,0]));
		    }
		    else{
			test+=Math.abs(dx.get([i,0]));
		    }
		}
		if (test < tol){
		    break guessLoop;
		}
		else{
		    count++;
		}
	    }
	    else if(guessChange===0 && diff<tol){
		// sometimes the solver will not reach diff<1E-9 because of the machine precision or 'bad functions'
		break guessLoop;
	    }
	    else if((guessChange===0 && diff>tol)){
		// Bad start : Initial guess was a failure
		guessOptions.shift();
		countOptions++;
		continue guessLoop;
	    }
	    else{
		count++;
	    }
	    if((performance.now()-tStart)>3E3){
		throw new laineError("Max. Time [internal]","Max. evaluation time on solver",this.numbers);
	    }
	    // Break long iterations
	    if (count===199){
		// Max. iterations : Exceeded the iteration limit',problem.numbers
		guessOptions.shift();
		countOptions++;
		continue guessLoop;
	    }
	}
    }
    if (guessOptions.length === 0 || countOptions === 3){
	throw new laineError('Bad start [internal]','Initial guess was a failure',problem.numbers);
    }
    // Update on parser
    if (options.returnValue){
	return guesses;
    }
    else{
	for (let i=0;i<namesLength;i++){
	    parser.set(names[i],guesses.get([i,0]));
	}
	return true;
    }
}
function calcFun(problem,guesses,answers){
    // Function: evaluate problem equations
    let scope = problem.scope;
    const compiled = problem.compiled;
    const names = problem.names;
    // Set all guesses
    const namesLength = names.length;
    for (let i=0;i<namesLength;i++){
	scope[names[i]]=guesses.get([i,0]);
    }
    // Calculate all lines
    const compiledLength = compiled.length;
    for (let i=0;i<compiledLength;i++){
	answers.set([i,0],compiled[i].evaluate(scope));
    }
    return answers;
}
function derivative(scope,compiled,name,f,x){
    // Function: calculate numerical derivative
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
    // Function: Calculate jacobian
    const compiled = problem.compiled;
    const names = problem.names;
    const answersLength = names.length;
    let der,jacAux;
    for (let i=0;i<answersLength;i++){
	jacAux = problem.jacAux[i];
	const jacAuxLength = jacAux.length;
	for (let j=0;j<jacAuxLength;j++){
	    der=derivative(problem.scope,compiled[i],names[jacAux[j]],answers.get([i,0]),guesses.get([jacAux[j],0]));
	    jac.subset(math.index(i,jacAux[j]),der);
	}
    }
    return jac;
}