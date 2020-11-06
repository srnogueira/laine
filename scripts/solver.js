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
    // LeeKesler
    LeeKesler:function(prop,Tr,inputX){
	return lkFun(prop,Tr,inputX)
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
    guess_list = [0.05,0.1,0.5,1,10,1E3,1E5];
    ans_list = [0,0,0,0,0,0,0];
    
    // Set guesses and calculate expressions
    let aux;
    let avg=[0,0,0,0,0,0];
    for(let n=0;n<3;n++){
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
	avg[index]+=1;
    }
    
    let big=0;
    for(let i=0;i<avg.length;i++){
	if (avg[i]>big){
	    index=i;
	    big=avg[i];
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
    let pre_diff=0;
    while (!converged){
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
            if (count2>20){
                break;
            }
        }
	if (diff<1E-6){
	    converged=true;
	}
	else if(pre_diff==diff){
	    return false;
	}
	else{
	    pre_diff=diff;
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
	if (count>30){
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

// Check if simple equation => var = expression
function simpleEquation(line){
    line=line.trim(); // remove spaces
    let parts = line.split('=')
    let first = parts[0]; // get first right side expression
    let list = ['*','/','+','-','^','('];
    let numb = ['0','1','2','3','4','5','6','7','8','9'];

    for (let i=0; i<numb.length ; i++){
	if (first[0]==numb[i]){
	    return false;
	}
    }
    for (let i=0; i<list.length ; i++){
	if (first.includes(list[i])){
	    return false;
	}
    }
    return true;
}

function cleanLines(lines){
    let right=[];
    let book=[];
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
		    // Store
		    if (simpleEquation(aux[j])){
			let sides = aux[j].split('=')
			book.push([sides[0],sides[1]]);
		    }
		}
	    }
	    else{
		right.push(formatEquation(lines[i]));
		// Store
		if (simpleEquation(lines[i])){
		    let sides = lines[i].split('=')
		    book.push([sides[0],sides[1]]);
		}
	    }
	}
    }
    return [right,book];
}

function writeAns(value,key,map){
    const outDiv = document.querySelector(".out");
    let msg;
    if (value != null){
	value = value.toPrecision(5);
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
	value = value.toPrecision(5);
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
const textBox = document.querySelector(".box");
const outDiv = document.querySelector(".out"); 
	
// Solve non-linear system
function laine(fast) {
    try {
	// Start solver
	outDiv.innerHTML="";  // clear space
	let parser=math.parser();  // create parser object
	let lines=(textBox.value).split("\n");  // break text into lines
	let name;
	
	// MathJax equations
	if (!fast){
	    writeEqs(lines);
	}
	
	// Get expression lines and 'substitution book'
	let aux =cleanLines(lines);  // clean text
	lines = aux[0];
	book = aux[1];
	
	// Solving with substitution
	lines.sort(moreVar);  // sorting
	let solutions = new Map();  // solution dictionary
	let again = false;  // loop flag
	while (lines.length>0){
	    name=varsName(lines[0]);  // get vars in line
	    // Solve one var problems 
	    if (name.length===1){
		try {
		    parser=OneNR(lines[0],name,parser,false);  // Newton-Raphson
		}
		catch{
		    parser=OneNR(lines[0],name,parser,true);  // Bisecant 
		}
		// Check if solution has already been computed
		if (solutions.has(name[0])){
		    throw new laineError('[Redefined variable]','This variable has been redefined: '+name[0]);
		}
		// Remove from the book (important for multi variable problems)
		for (let i=0; i<book.length; i++){
		    if (lines[0].includes(book[i][0]) && lines[0].includes(book[i][1])){
			book.splice(i,1);
			break;
		    }
		}
		// Store and clear
		solutions.set(name[0],parser.get(name));  // store solution
		lines.shift();  // clear solved line
	    }
	    else {
		again=false;  // flag
		// Reduce the number of variables (if possible)
		for (let i=0; i<lines.length; i++){
		    name=varsName(lines[i]);
		    for (let j=0; j<name.length; j++){
			if (solutions.has(name[j])){
			    // Using mathjs, update symbol node to numerical answer
			    let node = math.parse(lines[i]);
			    let trans = node.transform(function (node,path,parent) {
				if (node.isSymbolNode && node.name === name[j]) {
				    return new math.ConstantNode(solutions.get(name[j]))
				} else {
				    return node
				}
			    })
			    // Revert line(node) to text
			    lines[i]=trans.toString();
			    again=true; // flag
			}
		    }
		}
		// If there is no modifications flag is false
		if (!again){
		    break;
		}
		// Otherwise, maybe there is new one variable problems
		lines.sort(moreVar);
		// Make same modifications to the book
		for (let i=0; i<book.length; i++){
		    name=varsName(book[i][1]);
		    for (let j=0; j<name.length; j++){
			if (solutions.has(name[j])){
			    let node = math.parse(book[i][1]);
			    let trans = node.transform(function (node,path,parent) {
				if (node.isSymbolNode && node.name === name[j]) {
				    return new math.ConstantNode(solutions.get(name[j]))
				} else {
				    return node
				}
			    })
			    book[i][1]=trans.toString();
			}
		    }
		}
	    }
	}


	
	// Solving multiple equations at the same time
	if (lines.length>0){
	    // Apply text substitution using math.js (reduces the chances of failure)
	    let changeLine=false;
	    let maxTimes=0;
	    for(let i=0;i<lines.length;i++){
		changeLine=false;
		name=varsName(lines[i]);
		for (let k=0; k<name.length; k++){ // Its not the max number of changes
		    for(let j=0;j<book.length;j++){
			// Warning: this condition works, but I not 100% sure.
			if (name[k]==book[j][0] && !lines[i].includes(book[j][1])){
			    let node = math.parse(lines[i]);
			    let node2 = math.parse(book[j][1]);
			    let trans = node.transform(function (node,path,parent) {
				if (node.isSymbolNode && node.name === name[k]) {
				    return node2
				} else {
					return node
				}
			    })
			    lines[i]=trans.toString();
			    changeLine=true;
			}
		    }
		}

		
		if (changeLine){
		    maxTimes++
		}
		if (maxTimes==(lines.length-1)){
		    break;
		}
	    }
	    
	    // Try solving using Newton-Raphson with random guesses multiple times 
	    let test=false;
	    let count=0;
	    while (test==false){
		try {
		    test=MultiNR(lines,parser,solutions);
		}
		catch{
		    test=false
		}
		count++
		if (count>10){
		    throw new laineError('[Max. tries]','Sorry, laine tried 10 times and could not find a solution');
		    break
		}
	    }
	    solutions=test; // update solutions
	    
	}

	if (fast)
	{
	    solutions.forEach(writeFast); // write text
	    box.style.display="block";
	    mathDiv.style.display="none";
	    textBox.style.display="block";
	}
	else
	{
	    solutions.forEach(writeAns); // write MathJax
	    MathJax.typeset();  // render MathJax (slow)
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
