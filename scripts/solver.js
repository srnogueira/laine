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
    this.alert = "Error: "+name+"\nDescription: "+message+"\nLine: "+numb;
}

/*
  PARSING LINES INTO EQUATIONS
*/

function checkLine(line,number=""){
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
    this.line = line.split('#')[0];
    this.lhs = this.line.split('=')[0];
    this.rhs = this.line.split('=')[1];
    this.text = this.lhs+"-("+this.rhs+")";
    this.simple = singleVar(this.lhs);
    this.vars = varsName(this.text,scope);
    this.number = number;
    this.compiled = math.compile(this.text);
}

function updateEquation(equation,name,value,scope){
    /*
      Function: make algebraic substituitions
    */
    let node = math.parse(equation.lhs);
    let node2 = math.parse(value);
    let trans = node.transform(function (node,path,parent) {
	if (node.isSymbolNode && node.name === name) {
	    return node2;
	} else {
	    return node;
	}
    });
    equation.lhs=trans.toString();
    node = math.parse(equation.rhs);
    trans = node.transform(function (node,path,parent) {
	if (node.isSymbolNode && node.name === name) {
	    return node2;
	} else {
	    return node;
	}
    });
    equation.rhs=trans.toString();
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
		    parser.evaluate(aux[j]);
		}
		catch{
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
    let jacAux = []
    for (let i=0; i<equations.length; i++){
	compiled[i] = math.compile(equations[i].text);
	numbers[i] = equations[i].number;
	lineVars=equations[i].vars;
	jacAux.push([]);
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

function find_guess(problem,negative,binary){
    /*
      Function: Find a suitable first guess for multivariable expressions
    */
    
    // Binary search - for one variable
    if (binary){
	return binary_search(problem);
    }

    // Negative or positive guesses
    let guess_list = negative ? [-0.01,-0.05,-0.1,-0.5,-1,-3E2,-1E3,-1E5] : [0.01,0.05,0.1,0.5,1,3E2,1E3,1E5];
    
    // Check a good guess (at least two times)
    let aux,index,lower,ans_list;
    let avg=[0,0,0,0,0,0,0,0];
    let names = problem.names;
    let compiled = problem.compiled;
    let scope = problem.scope;
    let count = 0;
    while (true){
	// Calculate for each guess
	ans_list = [0,0,0,0,0,0,0,0];
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
		catch{
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
    return guess_list[index];
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
	if (xNear-x==0){
	    xNear = x*1.001;
	}
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

function solver(problem,parser,negative,binary){
    /*
      Function: Multivariable Newton-Raphson + Line search
    */
    
    // Initial
    let names = problem.names;
    
    // First guess and evaluation
    let guesses=[];
    let Xguesses=[];
    let answers=[];
    let first_guess=find_guess(problem,negative,binary);
    for (let i=0;i<names.length;i++){
	guesses.push(first_guess*(1+Math.random())); // Initial guess + random number
    }
    answers=calcFun(problem,guesses,answers);
    let diff=error(answers);
    
    // Newton-Raphson
    let count=0;
    let jac=math.zeros(answers.length,guesses.length);
    let dx, Xdiff, factor, count2, rerror;
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
		rerror=Math.abs(1-Xdiff/diff);
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
	if (diff<5E-6 && rerror<1E-2){
	    break;
	}
	else if(diff<5E-8){
	    break;
	}
	else if(rerror<1E-5 && diff>5E-10){
	    throw new laineError('Bad start','laine could not find a good initial guess',problem.numbers);
	}
	else{
	    count++;
	}
	
	// Break long iterations
	if (count>30){
	    throw new laineError('Max. iterations','laine exceeded the iteration limit',problem.numbers);
	}
    }

    // Update on parser
    for (let i=0;i<guesses.length;i++){
	parser.set(names[i],guesses[i]);
    }
    return parser;    
}

/*
  REPORTS
*/

function writeAns(solution,fast){
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

    if(fast){
	let para = outDiv.insertRow(-1);
	let varCell = para.insertCell(0);
	varCell.textContent = key;
	let valueCell = para.insertCell(1);
	valueCell.textContent = value.toString();
    }
    else{
	
	msg=key+" = "+value.toString();
	let para=document.createElement('p');
	para.textContent=formatMathJax(msg);
	outDiv.appendChild(para);
    }
}

function formatMathJax(line){
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
		    line+=piece+"]";
		}
	    }
	}
	// Double underlines
	if (line.includes("][")){
	    line=line.replace(/\]\[/g,",");
	}
    }

    // Return parse to Tex
    return "$$"+math.parse(line).toTex({parenthesis: 'auto'})+"$$";
}

const mathDiv = document.querySelector(".mathDiv");
    
// Write equations
function writeEqs(lines){
    // Clear and start
    mathDiv.innerHTML="";
    let title=document.createElement('h2');
    title.textContent="Report";
    mathDiv.appendChild(title);

    let text;
    for (let i=0;i<lines.length;i++){
	// Check if is an equation or comment
	if (checkLine(lines[i].trim())){
	    // Remove side comments
	    lines[i]=(lines[i].split('#'))[0]
	    // Check if is there is more than one equation
	    if (lines[i].includes(';')){
		let aux = lines[i].split(';');
		for (let j=0;j<aux.length;j++){
		    let para=document.createElement('p');
		    para.textContent=formatMathJax(aux[j]);
		    mathDiv.appendChild(para);
		}
	    }
	    else{
		let para=document.createElement('p');
		para.textContent=formatMathJax(lines[i]);
		mathDiv.appendChild(para);
	    }
	}
	else{
	    // para juntar multiplas linhas
	    let para=document.createElement('p');
	    text=lines[i].slice(1,lines[i].length);
	    if (i<lines.length-1){
		while (!checkLine(lines[i+1].trim())){
		    if (lines[i+1]==''){
			break;
		    }
		    text+=lines[i+1].slice(1,lines[i+1].length);
		    i++;
		    if ((i+1)==lines.length){
			break;
		    }
		}
	    }
	    para.textContent=text;
	    mathDiv.appendChild(para);
	}   
    }
    
}

/*
  LAINE
*/

const outDiv = document.querySelector(".out");
let parser=math.parser();  // create parser object

function laine_fun(fast) {
    let t1 = performance.now();
    
    // Clear parser
    parser.clear();
    
    // Start solver
    let lines=(editor.getValue()).split("\n");  // break text into lines
    
    // MathJax equations
    if (!fast){
	writeEqs(lines);
    }
    
    // Get expression lines and 'substitution book'
    let equations =cleanLines(lines,parser);  // clean text	    
    equations.sort(moreVar);  // sorting

    let name,solutions;    
    while (equations.length>0){
	// Avoid long loops
	if (performance.now()-t1>3E3){
	    throw new laineError('Difficult (or unsolvable) problem',
				 'laine tried multiple times and could not find a solution',
				 equations[0].number);
	}
	    
	// Solve one var problems 
	name=equations[0].vars;
	if (name.length==1){
	    
	    // Check if solution has already been computed
	    if (parser.get(name[0])!=undefined){
	    	throw new laineError('Redefined variable','Variable '+name[0]+' has been redefined',equations[0].number);
	    }
	    
	    // Try to solve the 1D problem
	    let problem1D = new Problem([equations[0]],parser)
	    let solved = false;
	    let negative = false;
	    let binary = false;
	    let count = 0;
	    while (!solved){
		try {
		    count++;
		    parser = solver(problem1D,parser,binary,negative);
		    solved=true;
		}
		catch(e){
		    if (count>2 && e.alert == undefined){
			throw new laineError("Unexpected error",e,equations[0].number);
		    }
		    else{
			binary = count==1? true: false;
			negative = count==2? true: false;
			if (count>2){
			    throw new laineError('Difficult (or unsolvable) problem',
						 'laine tried multiple times and could not find a solution',
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
		let changeLine=false;
		let maxTimes=0;		
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
			break;
		    }
		}
		// Check if has an 1D problem to loop or not
		equations.sort(moreVar);
		if (equations[0].vars.length != 1){
		    break;
		}	
	    }
	}
    }

    // Solving multiple equations at the same time
    if (equations.length>0){	
	// Try solving using Newton-Raphson with random guesses multiple times 
	let count=0;
	let negative=false;
	let solved=false;
	let problem = new Problem(equations,parser);
	
	// Check the problem is correct
	if (equations.length != problem.names.length){
	    throw new laineError('Degrees of freedom',
			       'The problem has '+problem.names.length+' variables and '+equations.length+' equations',
			       problem.numbers);
	}
	
	while (!solved){
	    try {
		count++;
		solved=true;
		parser=solver(problem,parser,negative=negative);
	    }
	    catch{
		solved=false
		if (count>10){
		    negative=negative ? false: true; // flip - maybe is negative, try once
		}
	    }
	    if (performance.now()-t1>3E3){
		throw new laineError('Difficult (or unsolvable) problem',
				     'laine tried multiple times and could not find a solution',
				    problem.numbers);
	    }
	}
	console.log("MultiNR tries:",count);
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
	mathDiv.style.display="inline";
	editorDiv.style.display="none";
	MathJax.typeset();  // render MathJax (slow)
    }    
    solBox.style.display="block";
    let t2 =performance.now();
    console.log("evaluation time:",t2-t1,"ms");
}

function laine(fast){
    try{
	laine_fun(fast);
    }
    catch(e){
	if (e.alert==undefined){
	    alert(e);
	}
	else{
	    alert(e.alert);
	}
    }
}
