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

// Errors
function laineError(name,message) {
    this.name = name;
    this.message = message;
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

/* 
   Solver auxiliary functions
*/

// Calculate answers
function calcFun(scope,compiled,names,guesses,answers){
    let store=[];

    // Set all guesses
    for (let i=0;i<names.length;i++){
	store.push(scope[names[i]]);
	scope[names[i]]=guesses[i];
    }

    // Calculate all lines
    for (let i=0;i<compiled.length;i++){
	answers[i]=compiled[i].evaluate(scope);
    }
    
    return answers;
}

// Sum absolute difference - Has to be a sum!
function error(answers){
    let diff=0;
    for (let i=0; i<answers.length; i++){
	diff+=Math.abs(answers[i]);
    }
    return diff;
}

// Numerical derivative
function derivative(scope,compiled,name,f,x){
    // Determine x+dx
    let absDelta=1E-6;
    let relDelta=1E-6; 
    let xNear;
    xNear = x*(1+relDelta);
    if (xNear-x==0){
	xNear=x+absDelta;
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

// Find a suitable first guess for multivariable expressions
function find_guess(compiled,names,scope,negative){    
    // Guess list
    let guess_list = negative ? [-0.05,-0.1,-0.5,-1,-3E3,-1E5] : [0.05,0.1,0.5,1,3E3,1E5];
    
    // Check a good guess (at least two times)
    let aux,index,lower,ans_list;
    let avg=[0,0,0,0,0,0];
	
    while (true){
	// Calculate for each guess
	ans_list = [0,0,0,0,0,0];
	for(let i=0;i<guess_list.length;i++){
	    for (let j=0;j<names.length;j++){
		scope[names[j]]=guess_list[i]*(1+Math.random());
            }
	    for (let z=0;z<compiled.length;z++){
		aux=compiled[z].evaluate(scope);
		ans_list[i]+=Math.abs(aux);
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
    }
    
    return guess_list[index];
}

// Simple binary search
function binary_search(compiled,name,scope){
    // Define variables
    let tripoints = [-1E8,1E-5,1E8];
    let ans = [1,1,1];
    let limits,mid;
    
    // First evaluation    
    for (i=0;i<tripoints.length;i++){
	scope[name]=tripoints[i];
	ans[i]=compiled.evaluate(scope);
    }

    // Brackets
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
	    return Math.abs(ans[1])<Math.abs(ans[2]) ? tripoints[1] : tripoints[2];
	}
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
	count+=1;

	// Break long iterations
	if (count > 50){
	    break;
	}
    }
    return mid;
}

function update_jac(scope,compiled,names,guesses,answers,jac){
    let der;
    for (let i=0;i<answers.length;i++){
	for (let j=0;j<guesses.length;j++){
	    der=derivative(scope,compiled[i],names[j],answers[i],guesses[j]);
	    jac.subset(math.index(i,j),der);
	}
    }
    return jac;
}

/* 
   Solver main functions
*/

// Multivariable Newton-Raphson + Line search
function MultiNR(compiled,scope,parser,names,negative){

    // First guess and evaluation
    let guesses=[];
    let Xguesses=[];
    let answers=[];
    let first_guess=find_guess(compiled,names,scope,negative);
    for (let i=0;i<names.length;i++){
	guesses.push(first_guess*(1+Math.random())); // Initial guess + random number
	Xguesses.push(1);
	answers.push(1);
    }    
    answers=calcFun(scope,compiled,names,guesses,answers);
    let diff=error(answers);
    
    // Newton-Raphson
    let count=0;
    let jac=math.ones(answers.length,guesses.length);
    let dx, Xdiff, factor, count2, rerror;
    while (true){

	// Calculate step
	jac=update_jac(scope,compiled,names,guesses,answers,jac);
	dx=math.multiply(math.inv(jac),answers);

	// Line search loop
        count2=0;
	factor=1;
        while (true){
	    
	    // Try updated guess
	    for (let i=0;i<guesses.length;i++){
		Xguesses[i]=guesses[i]-dx.subset(math.index(i))*factor;
	    }
	    answers=calcFun(scope,compiled,names,Xguesses,answers);
	    
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
	    if (count2>20){
                break;
            }
        }

	// Check convergence
	if (diff<5E-5 && rerror<1E-2){
	    break;
	}
	else if(diff<5E-8){
	    break;
	}
	else if(rerror<0.005){
	    throw new laineError('[Bad start]','Sorry, laine had a bad starting position');
	}
	else{
	    count++;
	}
	
	// Break long iterations
	if (count>30){
	    throw new laineError('[Max. iterations]','Sorry, laine could not find a solution for: '+variables);
	}
    }

    // Update on parser
    for (let i=0;i<guesses.length;i++){
	parser.set(names[i],guesses[i]);
    }
    return parser;    
}

// One dimension Newton Raphson + Line search
function OneNR(line,name,parser,flag){
    // Compile line
    let compiled = math.compile(line);
    let scope= parser.getAll();
    
    // Find guess
    let guess;
    let first_guess;
    if (flag ==true){
	first_guess = binary_search(compiled,name,scope);
	guess = [first_guess,1];
    }
    else {
	first_guess=find_guess([compiled],name,scope,false);
	guess=[first_guess*(1+Math.random()),1];
    }
    
    // First eval
    scope[name]=guess[0];
    let ans=[compiled.evaluate(scope),1];
    
    // Root-finding loop
    let count=0;
    let der,count2,factor,rerror;;
    while (true){
	// Determine derivative
	der=derivative(scope,compiled,name,ans[0],guess[0]);
	
	// Second loop - Line search
	count2=0;
	factor=1;
	while (true){
	    
	    // Test new guess
	    guess[1]=guess[0]-ans[0]/der*factor;
	    scope[name]=guess[1];
	    ans[1]=compiled.evaluate(scope);

	    // Better guess condition
	    if (Math.abs(ans[1])>Math.abs(ans[0])){
		factor/=2; // Try again with smaller step
		count2++;
	    }
	    else {
		rerror=Math.abs(1-ans[1]/ans[0]);
		ans[0]=ans[1];
		guess[0]=guess[1];
		break;
	    }

	    // Break long iterations
	    if (count2>10){
		break;
	    }
	}

	// Tolerance condition
	if (Math.abs(ans[0])<5E-6 && rerror<1E-2){
	    parser.set(name,guess[0]);
	    break;
	}
	else if (Math.abs(ans[0])<5E-8){
	    parser.set(name,guess[0]);
	    break;
	}
	else{
	    count++;
	}

	// Break long iterations
	if (count>30){
	    throw new laineError('[Max. iterations]','Sorry, laine could not find a solution for '+name);
	}
    }
    return parser;
}

/*
  laine auxiliary function
*/

function writeAns(solution,fast){
    let key = solution[0];
    let value = solution[1];
    let msg;
    if (typeof(value)=="number"){
	value = value.toPrecision(5);
    }
    msg=key+" = "+value.toString();
    
    let para=document.createElement('p');
    para.textContent=fast ? msg : formatMathJax(msg);
    
    outDiv.appendChild(para); // out is a global constant
}

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

// Compare number of vars
function moreVar(a,b){
    let aVars=varsName(a.text);
    let bVars=varsName(b.text);
    if (aVars.length<bVars.length){
	return -1;
    }
    if (aVars.length>bVars.length){
	return 1;
    }
    return 0;
}

function equationObj(lhs,rhs,text,simple){
    this.lhs = lhs;
    this.rhs = rhs;
    this.text = text;
    this.simple = simple;
}

// Check if simple equation => var = expression
function simpleEquation(line){
    let lhs=line.split('=')[0];
    let list = ['*','/','+','-','^','('];
    let numb = ['0','1','2','3','4','5','6','7','8','9'];

    for (let i=0; i<numb.length ; i++){
	if (lhs[0]==numb[i]){
	    return false;
	}
    }
    for (let i=0; i<list.length ; i++){
	if (lhs.includes(list[i])){
	    return false;
	}
    }
    return true;
}

// To remove side comments and set equations "= 0"
function lineEquation(line){
    // Remove side comments
    if (line.includes('#')){
	line=line.split('#')[0];
    }
    // Remove equal sign
    let sides=line.split('=');
    let text = sides[0]+"-("+sides[1]+")";
    let simple = simpleEquation(sides[0]);
    let equation = new equationObj(sides[0],sides[1],text,simple);
    
    return equation;
}

function cleanLines(lines,parser){
    let equations = [];
    let aux;
    for (let i=0; i<lines.length; i++){
	// Remove spaces
	lines[i]=lines[i].trim();
	// Check if is an equation
	if (checkLine(lines[i])){
	    // Check if multi equation
	    if (lines[i].includes(';')){
		aux = lines[i].split(';');
	    }
	    else{
		aux=[lines[i]];
	    }

	    // Store equations
	    for (let j=0;j<aux.length;j++){
		try{
		    parser.evaluate(lines[i]);
		}
		catch{
		    equations.push(lineEquation(lines[i]));
		}
	    }
	}
    }
    return equations;
}

/*
  laine core function
*/

const textBox = document.querySelector(".box");
const outDiv = document.querySelector(".out"); 
var parser=math.parser();  // create parser object

// Solve non-linear system
function laine_fun(fast) {
    let t1 = performance.now();
    
    // Clear parser
    parser.clear();
    
    // Start solver
    let lines=(textBox.value).split("\n");  // break text into lines
    
    // MathJax equations
    if (!fast){
	writeEqs(lines);
    }
    
    // Get expression lines and 'substitution book'
    let equations =cleanLines(lines,parser);  // clean text
    equations.sort(moreVar);  // sorting
       
    let name;
    let solutions;  // solution dictionary
    let again = false;  // loop flag
    while (equations.length>0){
	name=varsName(equations[0].text);  // get vars in line
	// Solve one var problems 
	if (name.length==1){
	    // Check if solution has already been computed
	    if (parser.get(name[0])!=undefined){
	    	throw new laineError('[Redefined variable]','This variable has been redefined: '+name[0]);
	    }
	    // Solve
	    try {
		if (equations[0].simple){
		    try{
			parser.evaluate(equation[0].text);
		    }
		    catch{
			parser=OneNR(equations[0].text,name,parser,false);  // Newton-Raphson
		    }
		}
		else{
		    parser=OneNR(equations[0].text,name,parser,false);  // Newton-Raphson
		}
	    }
	    catch{
		parser=OneNR(equations[0].text,name,parser,true);  // Bisecant 
	    }    
	    // Clear
	    equations.shift();  // clear solved line
	}
	else {
	    // This part is slow on the first time, don't know why.
	    again=false;  // flag
	    solutions=parser.getAll();
	    // Reduce the number of variables (if possible)
	    for (let i=0; i<equations.length; i++){
		name=varsName(equations[i].text);
		for (let j=0; j<name.length; j++){
		    if (solutions[name[j]]!=undefined){
			let node = math.parse(equations[i].text);
			let trans = node.transform(function (node,path,parent) {
			    if (node.isSymbolNode && node.name === name[j]) {
				return new math.ConstantNode(solutions[name[j]])
			    } else {
				return node
			    }
			})
			// Revert line(node) to text
			equations[i].text=trans.toString();

			//Book
			node = math.parse(equations[i].rhs);
			trans = node.transform(function (node,path,parent) {
			    if (node.isSymbolNode && node.name === name[j]) {
				return new math.ConstantNode(solutions[name[j]])
			    } else {
				return node
			    }
			})
			equations[i].rhs=trans.toString();
			again=true; // flag

			/*
			// Using mathjs, update symbol node to numerical answer
			let node = math.simplify(equations[i].text,solutions);
			equations[i].text=node.toString();
			if (equations[i].simple){
			    let rhs = math.simplify(equations[i].rhs,solutions);
			    equations[i].rhs=rhs.toString();
			}
			again = true;
			break;
			*/
		    }
		}
	    }
	    // If there is no modifications flag is false
	    if (!again){
		break;
	    }
	    // Otherwise, maybe there is new one variable problems
	    equations.sort(moreVar);
	}
    }

    // Solving multiple equations at the same time
    if (equations.length>0){
	// Apply text substitution using math.js (reduces the chances of failure)
	let changeLine=false;
	let maxTimes=0;
	for(let i=0;i<equations.length;i++){
	    changeLine=false;
	    name=varsName(equations[i].text);
	    for (let k=0; k<name.length; k++){ // if not the max number of changes
		for(let j=0;j<equations.length;j++){
		    if (equations[j].simple==true && name[k]==equations[j].lhs && j!=i){
			let node = math.parse(equations[i].text);
			let node2 = math.parse(equations[j].rhs);
			let trans = node.transform(function (node,path,parent) {
			    if (node.isSymbolNode && node.name === name[k]) {
				return node2
			    } else {
				return node
			    }
			})
			equations[i].text=trans.toString();
			changeLine=true;
		    }
		}
	    }
	    
	    if (changeLine){
		maxTimes++
	    }
	    if (maxTimes==(equations.length-1)){
		break;
	    }
	}
	// Try solving using Newton-Raphson with random guesses multiple times 
	let solved=false;
	let count=0;
	let negative=false;
	// Find variables
	let lineVars;
	let names=[];
	let compiled = [];
	for (let i=0; i<equations.length; i++){
	    lineVars=varsName(equations[i].text)
	    compiled.push(math.compile(equations[i].text));
	    for (let j=0; j<lineVars.length; j++){
		if (!names.includes(lineVars[j])){
		    names.push(lineVars[j]);
		}
	    }
	}
	let scope = parser.getAll();
	
	while (!solved){
	    try {
		count++;
		solved=true;
		parser=MultiNR(compiled,scope,parser,names,negative);
	    }
	    catch{
		solved=false
		if (count==1){
		    negative=negative ? false: true; // flip - maybe is negative, try once
		}
		else{
		    negative=false;
		}
	    }
	    if (count>30){
		throw new laineError('[Max. tries]','Sorry, laine tried 30 times and could not find a solution');
		break
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
	textBox.style.display="block";
    }
    else {
	MathJax.typeset();  // render MathJax (slow)
	mathDiv.style.display="inline";
	textBox.style.display="none";
    }    
    box.style.display="block";
    
    let t2 =performance.now();
    console.log("evaluation time:",t2-t1,"ms");
}

function laine(fast){
    try{
	laine_fun(fast);
    }
    catch(e){
	alert(e.name+" "+e.message);
    }
}
