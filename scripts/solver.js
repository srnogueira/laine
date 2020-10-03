/*
  CoolProp to math.js
*/

math.import({
    // PropsSI
    PropsSI:function (P,X,XX,Y,YY,N){
	    return Module.PropsSI(P,X,XX,Y,YY,N)
    },
    // HAPropsSI
    HAPropsSI:function (P,X,XX,Y,YY,Z,ZZ){
	    return Module.HAPropsSI(P,X,XX,Y,YY,Z,ZZ)
    },
});

/*
  Parser - Auxiliary functions
*/

// To set equations "= 0"
function minusRight(line){
    let sides=line.split('=');
    return sides[0]+"-("+sides[1]+")";
}

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
	    answers.push(parser.evaluate(lines[i]))
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
    let absDelta=1E-3;
    let relDelta=1E-8;
    let xNear,fNear,dfdx;

    // Check if x is zero
    if(x===0){
    	xNear = x+absDelta;
    }
    else{
	    xNear = x*(1+relDelta);
    }

    // Calculate derivative
    parser.set(name,xNear)
    fNear=parser.evaluate(line);
    dfdx=(fNear-f)/(xNear-x);

    // Change value back - parser scope
    parser.set(name,x);
    return dfdx;
}

// Find a suitable first guess
function find_guess(lines,names,parser){
    let guess_list = [0.1,3E2,1E5];
    let ans_list = [0,0,0];

    // Set all guesses
    let aux;
    for(let i=0;i<guess_list.length;i++){
	    for (let j=0;j<names.length;j++){
	        parser.set(names[j],guess_list[i]);
        } 
	    for (let z=0;z<lines.length;z++){
            aux=parser.evaluate(lines[z]);
            ans_list[i]+=Math.abs(aux);
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

// Iterate a step
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
    while (!converged){
        dx=step(parser,lines,names,guesses,answers);
        // Second loop
        count2=0;
	    factor=1;
        converged2=false;
        while (!converged2){
            for (let i=0;i<guesses.length;i++){
	            Xguesses[i]=guesses[i]-dx.subset(math.index(i))*factor;
	        }
	        answers=calcFun(parser,lines,names,Xguesses);
            Xdiff=error(answers)
            if (Xdiff>diff){
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

// One dimension Newton Raphson + Line search
function OneNR(line,name,parser){
    // Setup default conditions
    let ans=[1,1];
    let first_guess=find_guess([line],name,parser);
    let guess=[first_guess*(1+Math.random()),1];

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
	        if (count2>20){
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
    const outDiv = document.querySelector(".out"); 
    value = math.round(value,3);
    let msg=key+" = "+value.toString();
    let para=document.createElement('p');
    para.textContent=msg;
    outDiv.appendChild(para); // out is a global constant
}

// Solve non-linear system
function laine() {
    const textBox = document.querySelector(".box");
    const outDiv = document.querySelector(".out"); 
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
    let box = document.querySelector(".solBox");
    box.style.display="block";
}

/*
  User inputs
*/

const solveButton = document.querySelector(".solve");
solveButton.onclick = laine;

function shortcut(key){
    if (key.code === "F2"){
	laine();
    }
}
document.onkeydown=shortcut;
