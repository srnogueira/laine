/*
  Parser - Auxiliary functions
*/

//  Import functions to math.js parser
math.import({
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
});

function laineError(name,message,numb) {
    /*
      Function: create error object
    */
    this.name = name;
    this.message = message;
    this.numb = numb;
    this.alert = "Type: "+name+"\nDescription: "+message+"\nLine: "+numb;
}

/*
  PARSING LINES INTO EQUATIONS
*/

function checkLine(line,number){
    /* 
       Function: checks if the line is an equation
    */
    if ((line==="")||(line.startsWith("#"))){
	return false;
    }
    let form = /\=/; // OBS: could be improved for '=(blank)' or '(blank)='
    if (!form.test(line)){
	throw new laineError("Not an equation/comment/blank","Something is missing/remaining",number);
    }
    return true;
}

function singleVar(lhs){
    /*
      Function: check if the left-hand side (lhs) of an equation is a single variable
    */
    let numb = /\d/;
    let op = /(\*|\/|\+|\-|\^|\()/;
    if (numb.test(lhs[0]) || op.test(lhs)){
	return false;
    }    
    return true;
}

function varsName(line, scope){
    /*
      Function: get all variables names of a line text
    */
    
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
	// Pass if is already included
	if (symbols.includes(symbolNodes[i].name)){
	    continue;
	}
	let test = scope[symbolNodes[i].name];
	if (typeof(test) == "number" || typeof(test) == "function"){
	    continue;
	}
	// Test if is a function name
	isFunction=false;
	for (let j=0; j<functionNodes.length; j++){
	    if (symbolNodes[i].name == functionNodes[j].fn){
		isFunction=true;
		break;
	    }
        }
	// Include otherwise
	if (!isFunction){
	    symbols.push(symbolNodes[i].name);   
	}
    }
    return symbols;
}

function Equation(line,number,scope){
    /*
      Function: constructor for equation object
    */
    // Original text
    this.line = line.split('#')[0];
    // Equation sides
    let sides = this.line.split('=');
    this.lhs = sides[0].trim();
    this.rhs = sides[1].trim();
    // expression = 0
    this.text = this.lhs+"-("+this.rhs+")";
    // is a simple equation? 
    this.simple = singleVar(this.lhs);
    // store vars
    this.vars = varsName(this.text,scope);
    // line number
    this.number = number;
    // store compiled expression
    this.compiled = math.compile(this.text);
}

function updateSide(side,name,value){
    /*
      Function: make algebraic substitutions in a expression
    */
    let expressionNode = math.parse(side);
    let valueNode = math.parse(value);
    let trans = expressionNode.transform(function (node,path,parent) {
	if (node.isSymbolNode && node.name === name) {
	    return valueNode;
	} else {
	    return node;
	}
    });
    return trans.toString();
};

function updateEquation(equation,name,value,scope){
    /*
      Function: apply algebraic substituitions in a Equation
    */
    equation.lhs=updateSide(equation.lhs,name,value);
    equation.rhs=updateSide(equation.rhs,name,value);
    equation.text = equation.lhs + "-(" + equation.rhs + ")";
    equation.vars = varsName(equation.text,scope);
    equation.compiled = math.compile(equation.text);
};

function cleanLines(lines,parser){
    /*
      Function: Pre-parse lines into equations
    */
    let equations = [];
    let aux;
    for (let i=0; i<lines.length; i++){
	// Remove spaces
	lines[i]=lines[i].trim();
	// Check if is an equation
	if (checkLine(lines[i],i+1)){
	    // Check if multi equation
	    aux = lines[i].split(';');
	    // Store equations
	    for (let j=0;j<aux.length;j++){
		try{
		    // Store constants and user-defined functions
		    let ans = parser.evaluate(aux[j]);
		    if (ans.type=="Unit"){
			// Remove object from parser scope (avoid errors)
			lhs = aux[j].split('=')[0].trim();
			parser.remove(lhs);
			// Throw a dummy error
			throw new laineError("Parse error","Not a real evaluation",i+1);
		    }
		}
		catch{
		    // Try to create a equation object
		    try{
			equations.push(new Equation(aux[j],i+1,parser.getAll()));
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
function Problem(equations,parser){  
    /*
      Function: create the problem object
    */    
    // Separate information
    let compiled =[];
    let numbers = []
    let lineVars;
    let names = [];
    let jacAux = [];
    for (let i=0; i<equations.length; i++){
 	compiled[i] = math.compile(equations[i].text); // Not ideal, but required
	numbers[i] = equations[i].number;
	lineVars=equations[i].vars;
	jacAux.push([]);
	// Store variables names and the variables in each line
	for (let j=0; j<lineVars.length; j++){
	    if (!names.includes(lineVars[j])){
		names.push(lineVars[j]);
		jacAux[i].push(names.length-1);
	    }
	    else{
		for (let z=0; z<names.length; z++){
		    if (names[z] == lineVars[j]){
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
    this.scope = parser.getAll();
    this.numbers = numbers;
    this.jacAux = jacAux;
}

/* 
   SOLVER
*/

function binary_search(problem){
    /*
      Function: find a 1D guess using binary search
    */
    
    // Inputs
    let name = problem.names[0];
    let compiled = problem.compiled[0];
    let scope = problem.scope;
    
    // Define variables
    let points = [1E8,1E6,1E5,6E4,273.15,200,10,4,0.3,0.01,1E-6,-1E-6,-1,-1E4,-1E8];
    
    // First evaluation
    let sign,index,limits,mid;
    let ans=[];
    let lower=Infinity;
    for (i=0;i<points.length;i++){
	// Try to evaluate guess
	scope[name] = points[i];
	try{
	    ans[i] = compiled.evaluate(scope);
	}
	catch{
	    sign=undefined;
	    continue;
	}
	
	// If out of range
	if (ans[i]==NaN || typeof(ans[i])!='number'){
	    sign=undefined;
	    continue;
	}
	
	if (sign != undefined && sign != Math.sign(ans[i])){
	    limits = [points[i-1],points[i]];
	    ans = [ans[i-1],ans[i]];
	    break;
	}
	else{
	    sign = Math.sign(ans[i]);
	}
	if(Math.abs(ans[i])<lower){
	    lower=Math.abs(ans[i]);
	    index=i;
	}
    }

    // If no range is found, return a point close to zero
    if (limits==undefined){
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
	if (Math.sign(mid_ans) == Math.sign(ans[0])){
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
    return mid;
}

function find_guess(problem,parser,options){
    /*
      Function: Find a suitable first guess for multivariable expressions
    */
    // Binary search - for one variable
    if (options.binary){
	return binary_search(problem);
    }

    // Negative or positive guesses
    let guess_list = options.negative ? [-0.01,-0.1,-1,-1E3,-1E5] : [0,0.01,0.05,0.1,0.7,10,3E2,1E3,2E3,1E5];

    // Check if problem has two variables (better guesses):
    let guesses = [];
    let bestPair = [];
    let lowerPair = Infinity;
    if (problem.names.length == 2 && options.pairSearch){
	let first = true;
	for (let x=0 ; x<2 ; x++){
	    // Using flags to switch
	    let f = first ? 0 : 1;
	    let nf = first ? 1 : 0;
	    // Here I use a guess to find another.
	    let fixed = problem.names[f];
	    let notFixed = problem.names[nf];
	    let line = problem.equations[f].lhs+"="+problem.equations[f].rhs;
	    parser.set(fixed,guess_list[0]);
	    parser.remove(notFixed); // Have to remove !
	    let scope = parser.getAll();
	    let equation = new Equation(line,problem.equations[f].number,scope);
	    let copy = new Problem([equation],parser);

	    // Test function
	    let otherLine = problem.equations[nf].lhs+"="+problem.equations[nf].rhs;
	    let otherEquation = new Equation(otherLine,problem.equations[nf].number,scope);
	    
	    // Iterate
	    for (let i=0; i<guess_list.length; i++){
		copy.scope[fixed]=guess_list[i]*(1+Math.random()/2);
		let options1D = {binary:false, negative:options.negative, returnValue:true, pairSearch:false};
		// Solve and store each pair of solution
		try{
		    let result = solver(copy,parser,options1D);
		    scope[fixed]=copy.scope[fixed];
		    scope[notFixed]=result[0];
		    let error = otherEquation.compiled.evaluate(scope);
		    if (first){
			guesses.push([Math.abs(error),[scope[fixed],scope[notFixed]]]);
		    }
		    else{
			guesses.push([Math.abs(error),[scope[notFixed],scope[fixed]]]);
		    }
		}
		catch(e){
		    if (i != guess_list.length - 1){
			continue;
		    }
		}
	    }
	    first=false;
	}

	// Select the best pair
	for(let i=0;i<guesses.length;i++){
	    if (guesses[i][0]!=NaN && guesses[i][0]<lowerPair){
		bestPair=[guesses[i][1][0],guesses[i][1][1]];
		lowerPair=guesses[i][0];
	    }
	}
    }

    // Check a good guess (at least two times)
    let aux,index,lower,ans_list;
    let names = problem.names;
    let compiled = problem.compiled;
    let scope = problem.scope;
    let avg=[0,0,0,0,0,0,0,0,0,0];
    let count = 0;
    while (true){
	// Calculate for each guess
	ans_list = [0,0,0,0,0,0,0,0,0,0];
	equationLoop:
	for(let i=0;i<guess_list.length;i++){
	    for (let j=0;j<names.length;j++){
		scope[names[j]]=guess_list[i]*(1+Math.random());
            }
	    for (let z=0;z<compiled.length;z++){
		try{
		    aux=compiled[z].evaluate(scope);
		    ans_list[i]+=Math.abs(aux);
		}
		catch(e){
		    ans_list[i]=Infinity;
		    continue equationLoop;
		}
	    }
	}
	// Find the index of the lower value
	lower=Infinity;
	for(let i=0;i<guess_list.length;i++){
	    if (ans_list[i]!=NaN && ans_list[i]<lower){
		index=i;
		lower=ans_list[i];
	    }
	}

	// Exit condition
	avg[index]+=1;
	if (avg[index]==2){
	    break;
	}
	count++
	if (count>5){
	    break;
	}
    }

    // check better guess
    if (Math.abs(lowerPair) < Math.abs(lower)){
	return bestPair;
    }
    else{
	return guess_list[index];
    }
}

function calcFun(problem,guesses,answers){
    /*
      Function: evaluate problem equations
    */
    
    let scope = problem.scope;
    let compiled = problem.compiled;
    let names = problem.names;

    // Set all guesses
    for (let i=0;i<names.length;i++){
	scope[names[i]]=guesses[i];
    }

    // Calculate all lines
    for (let i=0;i<compiled.length;i++){
	answers[i]=compiled[i].evaluate(scope);
    }
    
    return answers;
}

function error(answers){
    /*
      Function: Sum absolute difference - Has to be a sum!
    */
    let diff=0;
    for (let i=0; i<answers.length; i++){
	diff+=Math.abs(answers[i]);
    }
    return diff;
}

function derivative(scope,compiled,name,f,x){
    /*
      Function: calculate numerical derivative
    */
    
    // Determine x+dx
    let absDelta=1E-8;
    let relDelta=1E-6; 
    let xNear;
    if (x == 0){
	xNear=x+absDelta;
    }
    else{
	xNear = x*(1+relDelta);
    }

    // Calculate derivative
    let fNear,dfdx;
    scope[name]=xNear
    fNear=compiled.evaluate(scope);
    dfdx=(fNear-f)/(xNear-x);

    // Change value back - parser scope
    scope[name]=x;
    return dfdx;
}

function update_jac(problem,guesses,answers,jac){
    /*
      Function: Calculate jacobian
    */
    let scope = problem.scope;
    let compiled = problem.compiled;
    let names = problem.names;
    let der;
    for (let i=0;i<answers.length;i++){
	let jacAux = problem.jacAux[i];
	for (let j=0;j<jacAux.length;j++){
	    der=derivative(scope,compiled[i],names[jacAux[j]],answers[i],guesses[jacAux[j]]);
	    jac.subset(math.index(i,jacAux[j]),der);
	}
    }
    return jac;
}

function solver(problem,parser,options){
    /*
      Function: Multivariable Newton-Raphson + Line search
    */
    
    // Initial
    let names = problem.names;
    
    // First guess and evaluation
    let guesses=[];
    let Xguesses=[];
    let answers=[];
    let first_guess;

    if (options.guess==undefined){
	first_guess = find_guess(problem,parser,options);
	if (first_guess == undefined){
	    throw new laineError('Bad start','Initial guess was a failure',problem.numbers);
	}

	for (let i=0;i<names.length;i++){
	    if (typeof(first_guess)=="number"){
		guesses.push(first_guess*(1+Math.random())); // Initial guess + random number
	    }
	    else{
		guesses.push(first_guess[i]); // Initial guess + random number
	    }
	}
    }
    else{
	for (let i=0;i<names.length;i++){
	    guesses.push(options.guess[names[i]]);
	}
    }
    answers=calcFun(problem,guesses,answers);
    let diff=error(answers);

    // Newton-Raphson
    let count=0;
    let jac=math.zeros(answers.length,guesses.length);
    let dx, Xdiff, factor, count2, guessChange;
    while (true){
	// Calculate step
	jac=update_jac(problem,guesses,answers,jac);
	dx=math.multiply(math.inv(jac),answers);

	// Line search loop
        count2=0;
	factor=1;
        while (true){    
	    // Try updated guess
	    for (let i=0;i<guesses.length;i++){
		Xguesses[i]=guesses[i]-dx.subset(math.index(i))*factor;
	    }
	    answers=calcFun(problem,Xguesses,answers);
	    
	    // Check if answer is a real number, continue if otherwise
	    for (let i=0;i<guesses.length;i++){
		if (typeof(answers[i])!="number"){
		    factor/=2;
		    count2++;
		    continue;
		}
	    }
	    
	    // Calculate and check errors
	    Xdiff=error(answers)
            if (Xdiff>diff){
                factor/=2;
		count2++;
		continue;
            }
            else{
		guessChange = Math.abs(1-Xdiff/diff);
                diff=Xdiff;
                for (let i=0;i<guesses.length;i++){
	            guesses[i]=Xguesses[i];
	        }
		break;
            }

	    // Break long iterations
	    if (count2>10){
                break;
            }
        }

	// Check convergence
	if (diff<1E-6){
	    // Check if dx is little compared with guess
	    let test = 0;
	    for (let i=0;i<guesses.length;i++){
		if (guesses[i]!=0){
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
	else if(guessChange==0 && diff<1E-6){
	    // sometimes the solver will not reach diff<1E-9 because of the machine precision 
	    break;
	}
	else if((guessChange==0 && diff>1E-6) || !guesses[0]){
	    throw new laineError('Bad start','Initial guess was a failure',problem.numbers);
	}
	else{
	    count++;
	}

	// Break long iterations
	if (count>100){
	    throw new laineError('Max. iterations','Exceeded the iteration limit',problem.numbers);
	}
    }

    // Update on parser
    if (options.returnValue){
	return guesses;
    }
    else{
	for (let i=0;i<guesses.length;i++){
	    parser.set(names[i],guesses[i]);
	}
	return parser;
    }
}

/*
  REPORTS
*/

function writeAns(solution,fast){
    /*
      Function: write answers in the results box
    */
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
    if (typeof(value)=="object"){
	value = Object.entries(value);
	text="{";
	for (let i=0;i<value.length;i++){
	    if (typeof(value[i][1])=="number"){
		value[i][1] = value[i][1].toPrecision(5);
	    }
	    text+=value[i][0]+" : "+value[i][1];
	    if (i<(value.length-1)){
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
    
    // Add double equals '=='
    let sides=line.split('=');
    line=sides[0]+'=='+sides[1];

    // Change underlines to [] to render correctly
    let symbols = /(\*|\+|\-|\/|\(|\^|\=|,|\))/;
    if (line.includes("_")){
	let pieces=line.split("_");
	line=pieces[0];
	for (let i=1;i<pieces.length;i++){
	    let piece=pieces[i];
	    line+="[";
	    for (let j=0;j<piece.length;j++){
		if (symbols.test(piece[j])){
		    line+=piece.slice(0,j)+"]"+piece.slice(j,piece.length);
		    break;
		}
		else if (j==(piece.length-1)){
		    last = piece.length
		    if (piece.slice(last-1,last)=='}'){
			line+=piece.slice(0,last-1)+"]"+piece.slice(last-1,piece.length);
		    }else{
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
    let greek = ['$alpha','$beta','$gamma','$delta','$epsilon','$zeta','$eta','$theta','$iota','$kappa','$lambda','$mu','$nu','$xi','$omicron','$pi','$rho','$sigma','$tau','$upsilon','$phi','$chi','$psi','$omega','$Alpha','$Beta','$Gamma','$Delta','$Epsilon','$Zeta','$Eta','$Theta','$Iota','$Kappa','$Lambda','$Mu','$Nu','$Xi','$Omicron','$Pi','$Rho','$Sigma','$Tau','$Upsilon','$Phi','$Chi','$Psi','$Omega'];
    for(let i =0; i<greek.length ; i++){
	if (line.includes(greek[i])){
	    let pieces=line.split(greek[i]);
	    line = pieces[0];
	    for (let j =1; j<pieces.length; j++){
		line+=greek[i].slice(1)+' '+pieces[j];
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
    
    // Clear and start
    mathDiv.innerHTML="";
    let title=document.createElement('h2');

    let text;
    for (let i=0;i<lines.length;i++){
	// Check if is an equation or comment
	if (checkLine(lines[i].trim(),i)){
	    // Check if is there is more than one equation
	    let aux = lines[i].split(';');
	    for (let j=0;j<aux.length;j++){
		// Separate side comments
		let sep = aux[j].split('#');
		// Join comments
		let comment=' \\text{';
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
    
    let t1 = performance.now();
    let equations;

    // Parse text or use minimal problem (for plots)
    if (list == undefined){
	// Clear parser and errors
	errorBox.style.display = "";
	parser.clear();
    
	// Start solver
	let lines=(editor.getValue()).split("\n");  // break text into lines
    
	// MathJax equations
	if (!fast){
	    writeEqs(lines);
	}
    
	// Get expression lines and 'substitution book'
	equations =cleanLines(lines,parser);  // clean text	    
    }
    else{
	equations = JSON.parse(JSON.stringify(list)) // deepClone (because the algorithm is dumb)
	// parser is a global variable, we just don't erase some variables (related with x)
    }
    equations.sort(moreVar);  // sorting
    
    let name,solutions;    
    while (equations.length>0){
	// Avoid long loops
	if (performance.now()-t1>3E3){
	    throw new laineError('Difficult (or unsolvable) problem',
				 'Could not find a solution',
				 equations[0].number);
	}
	//[plots] Break loop if y is already computed
	if (yVar != undefined){
	    if (parser.get(yVar)!=undefined){
		return false;
	    }
	}

	// Solve one var problems 
	name=equations[0].vars;

	if (name.length == 0){
	    equations.shift();
	}
	else if (name.length==1){
	    // Check if solution has already been computed
	    if (parser.get(name[0])!=undefined){
	    	throw new laineError('Redefined variable','Variable '+name[0]+' has been redefined',equations[0].number);
	    }
	    // Try to solve the 1D problem
	    let problem1D = new Problem([equations[0]],parser)
	    let solved = false;
	    let options1D = {negative:false, binary:false, returnValue:false, pairSearch:false, guess:undefined};
	    if (guesslist != undefined){
		options1D.guess = guesslist;
	    }
	    let count = 0;
	    while (!solved){
		try {
		    count++;
		    parser = solver(problem1D,parser,options1D);
		    solved=true;
		}
		catch(e){
		    if (count>2 && e.alert == undefined){
			throw new laineError("Unexpected error",e,equations[0].number);
		    }
		    else{
			if (guesslist != undefined){
			    options1D.guess = undefined;
			    count = 0;
			    continue;
			}
			if (count==1){
			    options1D.binary = true;
			    options1D.negative = false;
			}
			else{
			    options1D.binary = false;
			    options1D.negative = true;
			}
			if (count>2){
			    throw new laineError('Difficult (or unsolvable) problem',
						 'Could not find a solution',
						 equations[0].number);
			}
		    }
		}
		
	    }
	    equations.shift();  // clear solved line
	}
	else {
	    // Update the number of variables for each equation.
	    let loop1D=false;  // flag
	    let scope=parser.getAll();
	    for (let i=0; i<equations.length; i++){
		name=equations[i].vars;
		for (let j=0; j<name.length; j++){
		    if (scope[name[j]]!=undefined){
			equations[i].vars=varsName(equations[i].text,scope)
			loop1D=true; // flag
			break;
		    }
		}
	    }
	    
	    // Loop or try to reduce the number of variables by algebraic substitution
	    if (loop1D){
		equations.sort(moreVar);
	    }
	    else {
		// Apply text substitution using math.js (reduces the chances of failure)
		let changeLine=true;
		let maxTimes=0;
		equations.sort(moreVar);
		loop1 : 
		while (changeLine){
		    for(let i=0;i<equations.length;i++){
			changeLine=false;
			name=equations[i].vars
			for (let k=0; k<name.length; k++){
			    for(let j=0;j<equations.length;j++){
				if (!equations[j].simple || j == i){
				    continue;
				}
				if (name[k]==equations[j].lhs){
				    updateEquation(equations[i],name[k],equations[j].rhs,parser.getAll());
				    changeLine=true;
				}
			    }
			}
			// Check max number of substitutions
			if (changeLine){
			    maxTimes++
			}
			if (maxTimes==(equations.length-1)){
			    break loop1;
			}
		    }
		}
		
		// Check if has an 1D problem to loop or not
		equations.sort(moreVar);
		if (equations[0].vars.length != 1){
		    // Look for 2D problems
		    let changed = false;
		    for (let i = 0; i<equations.length ; i++){
			if (equations[i].vars.length == 2){
			    for (let j = i+1; j<equations.length; j++){
				if (equations[j].vars.length == 2){
				    let varsA = equations[i].vars;
				    let varsB = equations[j].vars;
				    if ((varsA[0] == varsB[0] && varsA[1] == varsB[1]) || (varsA[1] == varsB[0] && varsA[0]==varsB[1])){
					
					// Try solving using Newton-Raphson with random guesses multiple times 
					let count=0;
					let options2D = {binary:false, negative:false, returnValue:false, pairSearch:false, guess:undefined}
					if (guesslist != undefined){
					    options2D.guess = guesslist;
					}
					let solved=false;
					let problem = new Problem([equations[i],equations[j]],parser);
					while (!solved){
					    try {
						count++;
						parser=solver(problem,parser,options2D);
						solved=true;
					    }
					    catch(e){
						options2D.guess=undefined;
						if (count>10){
						    options2D.pairSearch = options2D.pairSearch? false:true;
						}
						if (count>15){
						    options2D.negative = options2D.negative ? false: true; // flip - maybe is negative, try once
						}
					    }
					    if (performance.now()-t1>3E3){
						throw new laineError('Difficult (or unsolvable) problem',
								     'Could not find a solution',
								     problem.numbers);
					    }
					}
					changed = true;
					break;
				    }
				}
				else{
				    break;
				}
			    }
			}			
			else{
			    break;
			}
		    }
		    if (!changed){
			break;
		    }
		}
	    }
	}
    }

    // Solving multiple equations at the same time
    if (equations.length>0){	
	// Try solving using Newton-Raphson with random guesses multiple times 
	let count=0;
	let options = {negative:false, binary:false, pairSearch:false, returnValue:false, guess:undefined};
	if (guesslist != undefined){
	    options.guess = guesslist;
	}
	let solved=false;
	let problem = new Problem(equations,parser);
	
	// Check the problem is correct
	if (equations.length != problem.names.length){
	    if (plot == true){
		// Return problem to create plot menu
		return problem;
	    }
	    throw new laineError('Degrees of freedom',
			       'The problem has '+problem.names.length+' variables and '+equations.length+' equations',
			       problem.numbers);
	}

	while (!solved){
	    try {
		count++;
		parser=solver(problem,parser,options);
		solved=true;
	    }
	    catch{
		options.guess = undefined;
		if (count>10){
		    options.negative= options.negative ? false: true; // flip - maybe is negative, try once
		}
	    }
	    if (performance.now()-t1>1E3){
		throw new laineError('Difficult (or unsolvable) problem',
				     'Could not find a solution',
				    problem.numbers);
	    }
	}
    }

    // If its a plot run, just terminate
    if (list!=undefined){
	return false;
    }
    
    outDiv.innerHTML="";  // clear space
    solutions = Object.entries(parser.getAll());

    for (i=0;i<solutions.length;i++){
	writeAns(solutions[i],fast);
    }
    		
    if (fast) {
	mathDiv.style.display="none";
	editorDiv.style.display="block";
    }
    else {
	mathDiv.style.display="block";
	editorDiv.style.display="none";
	MathJax.typeset();  // render MathJax (slow)
    }    
    solBox.style.display="block";
    let t2 =performance.now();
    console.log("evaluation time:",t2-t1,"ms");
}

function displayError(messageText){
    /*
      Function: display error messages
    */
    
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
    try{
	laine_fun(undefined,isfast,false,undefined,undefined);
	editor.refresh(); // avoid problems with resize
    }
    catch(e){
	let errorText = e.alert ? e.alert : e;
	displayError(errorText);
    }
}

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
    exportData="y\tx\n";

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
