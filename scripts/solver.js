/*
  Import functions to math.js
*/

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
    NasaSI:function(prop,T,P,specie){
	return nasaFun(prop,T,P,specie)
    },
    // Lee Kesler - Z
    LeeKeslerZ:function(T,P){
	return leeKesler_Z(T,P)
    },
    // Lee Kesler - h
    LeeKeslerDh:function(T,P){
	return leeKesler_h(T,P)
    },
    // Lee Kesler - st
    LeeKeslerDst:function(T,P){
	return leeKesler_st(T,P)
    },
    // Lee Kesler - Pr_sat
    LeeKeslerPrsat:function(T){
	return Pr_sat(T)
    },
    // Old functions - compatibility
    // Nasa Glenn - Molecular mass
    NasaMW:function(n){
	return nasaFun('MW',0,0,n)
    },
    // Nasa Glenn - Enthalpy
    NasaH:function(n,T){
	return nasaFun('Hmolar',T,0,n)
    },
    // Nasa Glenn - cp
    NasaCp:function(n,T){
	return nasaFun('Cpmolar',T,0,n)
    },
    // Nasa Glenn - Internal energy
    NasaU:function(n,T){
	return nasaFun('Umolar',T,0,n)
    },
    // Nasa Glenn - cv
    NasaCv:function(n,T){
	return nasaFun('Cvmolar',T,0,n)
    },
    // Nasa Glenn - Entropy
    NasaS:function(n,T,P){
	return nasaFun('Smolar',T,P,n)
    },
    // Nasa Glenn - Gibbs
    NasaG:function(n,T,P){
	return nasaFun('Gmolar',T,P,n)
    },
    // Nasa Glenn - Helmholtz
    NasaF:function(n,T,P){
	return nasaFun('HELMHOLTZMOLAR',T,P,n)
    },
});

/*
  Parser - Auxiliary functions
*/

// Check if line is a comment or blank
function checkLine(line){
    if ((line==="")||(line.startsWith("#"))){
	return false;
    }
    return true;
}

// To get all variables names
function varsName(line){
    // Return if is not an equation
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

/* 
   Solver auxiliary functions
*/

// Determine answers
function calcFun(parser,lines,names,guesses){
    // Set all guesses
    for (let i=0;i<names.length;i++){
	parser.set(names[i],guesses[i]);
    }

    // Calculate all lines
    let answers=[];
    for (let i=0;i<lines.length;i++){
	answers.push(parser.evaluate(lines[i]));
    }
    return answers;
}

// Sum absolute difference
function error(answers){
    let diff=0;
    for (let i=0; i<answers.length; i++){
	diff+=Math.abs(answers[i]);
    }
    return diff;
}

// Numerical derivative
function derivative(parser,line,name,f,x){
    let absDelta=1E-6;
    let relDelta=1E-6; // Change to avoid zeros
    let xNear,fNear,dfdx;

    // Check if x is zero
    xNear = x*(1+relDelta);
    if (xNear-x==0){
	xNear=x+absDelta;
    }

    // Calculate derivative
    parser.set(name,xNear)
    fNear=parser.evaluate(line);
    dfdx=(fNear-f)/(xNear-x);

    // Change value back - parser scope
    parser.set(name,x);
    return dfdx;
}

// Find a suitable first guess for multivariable expressions
function find_guess(lines,names,parser){
    let guess_list;
    let ans_list;
    
    // Size of the problem
    guess_list = [0.1,1E3,1E5];
    ans_list = [0,0,0];
    
    // Set guesses and calculate expressions
    let aux;
    for(let i=0;i<guess_list.length;i++){
	for (let j=0;j<names.length;j++){
	    parser.set(names[j],guess_list[i]*(1+Math.random()));
        }
	for (let z=0;z<lines.length;z++){
	    aux=parser.evaluate(lines[z]);
	    ans_list[i]+=Math.abs(aux);
	}
    }
    
    // Find the index of the lower value
    let index;
    let lower=Infinity;
    for(let i=0;i<guess_list.length;i++){
	if ((ans_list[i]!=NaN)&&(Math.abs(ans_list[i])<Math.abs(lower))){
	    index=i;
	    lower=ans_list[i];
	}
    }
    return guess_list[index];
}

// Simple binary search
function binary_search(lines,names,parser){
    // Define variables
    let tripoints = [-1E8,1E-5,1E8];
    let limits;
    let ans = [1,1,1];
    let mid;
    let mid_ans = 2;

    // First evaluation    
    for (i=0;i<tripoints.length;i++){
	parser.set(names[0],tripoints[i]);
	ans[i]=parser.evaluate(lines[0]);
    }
    if (Math.sign(ans[1]) != Math.sign(ans[2])){
	limits = [tripoints[1],tripoints[2]];
	ans = [ans[1],ans[2],0];
    }
    else{
	if (Math.sign(ans[1])!= Math.sign(ans[0])){
	    limits = [tripoints[0], tripoints[1]];
	    ans = [ans[0],ans[1],0];
	}
	else{
	    mid = Math.abs(ans[1])<Math.abs(ans[2]) ? tripoints[1] : tripoints[2]
	    return mid;
	}
    }
    
    // Binary search
    let count = 0;
    while (Math.abs(mid_ans) > 1){
	mid=(limits[0]+limits[1])/2
	parser.set(names[0],mid);
	mid_ans=parser.evaluate(lines[0]);
	if (Math.sign(mid_ans) == Math.sign(ans[0])){
	    limits[0]=mid;
	    ans[0]=mid_ans;
	}
	else{
	    limits[1]=mid;
	    ans[1]=mid_ans;
	}
	count+=1;
	if (count > 50){
	    break;
	}
    }
    return mid;
}

// Iterate a step - This can be optimized
function step(parser,lines,names,guesses,answers){
    let der;
    let jac=math.ones(answers.length,guesses.length);
    
    // Calculate jacobian
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

// Create errors
function laineError(name,message) {
    this.name = name;
    this.message = message;
}

// Multivariable Newton-Raphson + Line search
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
    let Xguesses=[];
    let first_guess=find_guess(lines,names,parser);
    console.log(first_guess);
    for (let i=0;i<names.length;i++){
	guesses.push(first_guess*(1+Math.random())); // Initial guess + random number
	Xguesses.push(1);
    }
    // Newton-Raphson
    let dx;
    let answers=calcFun(parser,lines,names,guesses);
    let diff=error(answers);
    let Xdiff;
    let converged=false;
    let converged2;
    let count=0;
    let count2=0;
    let factor=1;
    let complex=false;
    while (!converged){
	console.log(guesses);
	dx=step(parser,lines,names,guesses,answers);
	// Second loop
        count2=0;
	factor=1;
        converged2=false;
        while (!converged2){
	    complex=false;
            for (let i=0;i<guesses.length;i++){
		Xguesses[i]=guesses[i]-dx.subset(math.index(i))*factor;
	    }
	    answers=calcFun(parser,lines,names,Xguesses);
	    for (let i=0;i<guesses.length;i++){
		if (typeof(answers[i])!="number"){
		    complex=true;
		}
	    }
	    Xdiff=error(answers)
            if (Xdiff>diff || complex){
                factor/=2;
            }
            else{
                converged2=true;
                diff=Xdiff;
                for (let i=0;i<guesses.length;i++){
	            guesses[i]=Xguesses[i];
	        }
            }
            count2++;
            if (count2>10){
                break;
            }
        }
	console.log(Xdiff);
        if (diff<1E-6){
	    converged=true;
	}
	count++;
	if (count>50){
	    let variables='';
	    for (let i=0;i<guesses.length;i++){
		guesses[i]=null;
		if (i != guesses.length-1){
		    variables+=names[i]+', ';
		}
		else{
		    variables+=names[i];
		}
	    }
	    throw new laineError('[Max. iterations]','Sorry, laine could not find a solution for: '+variables);
	    break;
	}
    }

    for (let i=0;i<names.length;i++){
	solutions.set(names[i],guesses[i]);
    }
    return solutions;    
}

// One dimension Newton Raphson + Line search
function OneNR(line,name,parser,flag){
    // Setup default conditions
    let ans=[1,1];
    let first_guess;
    let guess;
    
    if (flag ==true){
	first_guess = binary_search([line],name,parser);
	guess = [first_guess,1];
    }
    else
    {
	first_guess=find_guess([line],name,parser);
	guess=[first_guess*(1+Math.random()),1];
    }
    
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
	if (Math.abs(ans[0])<1E-6){
	    converged=true;
	}
	
        // Max iterations conditions
	count++;
	if (count>25){
	    parser.set(name,null); // old, may delete
	    throw new laineError('[Max. iterations]','Sorry, laine could not find a solution for '+name);
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

// To remove side comments and set equations "= 0"
function formatEquation(line){
    // Remove side comments
    let equation=line.split('#');
    // Remove equal sign
    let sides=equation[0].split('=');
    return sides[0]+"-("+sides[1]+")";
}

function cleanLines(lines){
    let right=[]
    for (let i=0; i<lines.length; i++){
	// Remove spaces
	lines[i]=lines[i].trim();
	// Check if is an equation
	if (checkLine(lines[i])){
	    // Check for lines with multiple equations
	    if (lines[i].includes(';')){
		// Separate the equations
		let aux = lines[i].split(';');
		for (let j=0;j<aux.length;j++){
		    right.push(formatEquation(aux[j]));
		}
	    }
	    else{
		right.push(formatEquation(lines[i]));
	    }
	}
    }
    return right;
}

function writeAns(value,key,map){
    const outDiv = document.querySelector(".out");
    let msg;
    if (value != null){
	value = math.round(value,5);
	msg=key+" = "+value.toString();
    }
    else{
	msg=key+"\" : not converged\"";
    }
    let para=document.createElement('p');

    para.textContent=formatMathJax(msg);
    
    outDiv.appendChild(para); // out is a global constant
}

function writeFast(value,key,map){
    const outDiv = document.querySelector(".out");
    let msg;
    if (value != null){
	value = math.round(value,5);
	msg=key+" = "+value.toString();
    }
    else{
	msg=key+"\" : not converged\"";
    }
    let para=document.createElement('p');

    para.textContent=msg
    
    outDiv.appendChild(para); // out is a global constant
}

/*
  MathJax rendering auxiliary functions
*/

function formatMathJax(line){
    // Add double equals '=='
    let sides=line.split('=');
    line=sides[0]+'=='+sides[1];

    // Change underlines to [] to render correctly
    if (line.includes("_")){
	let pieces=line.split("_");
	line=pieces[0];
	for (let i=1;i<pieces.length;i++){
	    let piece=pieces[i];
	    line+="[";
	    for (let j=0;j<piece.length;j++){
		if (piece[j]=='*' || piece[j]=='+' ||piece[j]=='-' || piece[j]=='/' || piece[j]=='(' || piece[j]=='^' || piece[j]=='=' || piece[j]==',' || piece[j]==')'){
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


// Write equations
function writeEqs(lines){
    let mathDiv = document.querySelector(".mathDiv");
    // Clear and start
    mathDiv.innerHTML="";
    let title=document.createElement('h2');
    title.textContent="Report";
    mathDiv.appendChild(title);

    let text;
    for (let i=0;i<lines.length;i++){
	// Check if is an equation or comment
	if (checkLine(lines[i].trim())){
	    // Check if is there is more than one equation
	    if (lines[i].includes(';')){
		let aux = lines[i].split(';');
		console.log(aux);
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
  laine core function
*/

// Solve non-linear system
function laine(fast) {
    try {
	const textBox = document.querySelector(".box");
	const outDiv = document.querySelector(".out"); 
	// Clear space
	outDiv.innerHTML="";
	// Start solver
	let parser=math.parser(); // Create parser object
	let name;
	// Clean and sort
	let lines=(textBox.value).split("\n");
	writeEqs(lines);
	lines = cleanLines(lines);
	lines.sort(moreVar);
	
	// Solving with substitution
	let solutions = new Map();
	let again = false;
	while (lines.length>0){
	    name=varsName(lines[0]);
	    if (name.length===1){
		// Solve easy problems with one variable
		try {
		    parser=OneNR(lines[0],name,parser,false);
		}
		catch{
		    parser=OneNR(lines[0],name,parser,true);
		}
		solutions.set(name[0],parser.get(name));
		lines.shift();
	    }
	    else {
		// Reduce the number of variables
		again = false;
		for (let i=0; i<lines.length; i++){
		    name=varsName(lines[i]);
		    for (let j=0; j<name.length; j++){
			if (solutions.has(name[j])){
			    // ANOTATION : THIS COULD BE A FUNCTION
			    let node = math.parse(lines[i]);
			    // Using mathjs, update symbol node to numerical answer
			    let trans = node.transform(function (node,path,parent) {
				if (node.isSymbolNode && node.name === name[j]) {
				    return new math.ConstantNode(solutions.get(name[j]))
				} else {
				    return node
				}
			    })
			    // Update the line text
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
	
	// Solving multiple equations at the same time
	if (lines.length>0){
	    /*
	    // Check for pairs of equations
	    Use the jacobian to search for blocks
	    */
	    
	    // Here I would have to check for blocks
	    solutions=MultiNR(lines,parser,solutions);
	}

	if (fast)
	{
	    solutions.forEach(writeFast); // Write answers
	    box.style.display="block";
	    mathDiv.style.display="none";
	    textBox.style.display="block";
	}
	else
	{
	    solutions.forEach(writeAns);
	    MathJax.typeset();
	    mathDiv.style.display="inline";
	    textBox.style.display="none";
	    box.style.display="block";
	}
	
    }
    catch(e) {
	alert(e.name+" : "+e.message);
    }
}

function laineR() {
    laine(false);
}

function checkSets(as,bs){
    if (as.size !== bs.size) return false;
    for (var a of as) if (!bs.has(a)) return false;
    return true;
}
