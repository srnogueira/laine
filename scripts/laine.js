"use strict";
/*
  imports
*/
// from scripts
/*global math*/

/*
  exports
*/
// for plots.js
/*exported laineSolver, laineError, parser*/

// for ui.js
/*exported laineSolver, parser*/

// Create a parser object as global object
const parser = math.parser();

/**
 * The main solver for non-linear equation systems
 * @param {string} text - Equations in text
 * @param {object} laineOptions - Object with solver options
 * @returns bool|Problem
 */
function laineSolver(text, laineOptions) {
  const t1 = performance.now();
  // Check options and create it if necessary
  laineOptions = laineOptions === undefined ? {} : laineOptions;
  laineOptions.userGuess =
    laineOptions.userGuess === undefined ? {} : laineOptions.userGuess;

  // Clear parser and errors
  if (!laineOptions.solveFor) {
    parser.clear();
  }

  // Parse lines
  let equations = cleanLines(text, laineOptions);

  // Check duplicates
  checkDuplicates(equations);

  // Reduce problem size and split equations in two types
  let simpleEquations = algebraicSubs(equations);

  // Sort equations
  equations.sort((a, b) => a.vars.length - b.vars.length);

  // Solve 1-2D problems in equations
  equations = solve1D(equations, laineOptions);
  // Short-circut if only the solution of one variable is important
  if (laineOptions.solveFor !== undefined) {
    if (parser.get(laineOptions.solveFor) !== undefined) {
      return false;
    }
  }

  // Solves multi-D problems in equations
  if (equations.length > 0) {
    equations = solveND(equations, laineOptions);
  }
  // Short-circut if only the solution of one variable is important
  if (laineOptions.solveFor !== undefined) {
    if (parser.get(laineOptions.solveFor) !== undefined) {
      return false;
    }
  }

  // Delivers a problem if requested
  if (laineOptions.returnProblem) {
    // Update
    for (let equation of equations) {
      equation.updateComputedVars();
    }
    for (let simpleEquation of simpleEquations) {
      simpleEquation.updateComputedVars();
    }
    // Join arrays
    let allEqs = {e:equations, s:simpleEquations};
    return allEqs;
  }

  // Sort substitutions
  simpleEquations.sort((a, b) => a.vars.length - b.vars.length); // sorting
  // Activate simple evaluation mode - It will try to evaluated first, usually works and is faster
  laineOptions.simples = true;

  // Solves 1-2D problems in substitutions
  simpleEquations = solve1D(simpleEquations, laineOptions);
  // Short-circut if only the solution of one variable is important
  if (laineOptions.solveFor !== undefined) {
    if (parser.get(laineOptions.solveFor) !== undefined) {
      return false;
    }
  }

  // Solved n-D problems in substitutions
  if (simpleEquations.length > 0) {
    simpleEquations = solveND(simpleEquations, laineOptions);
  }
  // Short-circut if only the solution of one variable is important
  if (laineOptions.solveFor !== undefined) {
    if (parser.get(laineOptions.solveFor) !== undefined) {
      return false;
    }
  }

  const t2 = performance.now();
  console.log("evaluation time:", t2 - t1, "ms");
  return false;
}

/**
 * Error object
 * @class
 */
class laineError {
  /**
   * Create a error object
   * @param {string} name - Error name
   * @param {string} message - Error description
   * @param {number} numb - Line number
   * @param {string} help - Help text
   */
  constructor(name, message, numb, help) {
    this.name = name;
    this.message = message;
    this.lineNumber = numb;
    this.help = help;
  }
}

/*
  Parsing functions
*/

/**
 * Parses the equation text into an array of equations objects
 * @param {string} lines - Equations text
 * @param {object} options - Options to parser
 * @returns Equations[]
 */
function cleanLines(text, options) {
  let lines = text.split("\n");
  let equations = [];
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].replace(/\s/g,'');
    // Check if is an equation
    if (checkLine(lines[i], i + 1)) {
      // Break multi-lines
      const aux = lines[i].split(";");
      for (let subLine of aux) {
        // Check each subline
        subLine = subLine.split("#")[0]; // remove comments
        if (checkLine(subLine, i + 1)) {
          // Break into sides
          let sides = subLine.split("=");
          // Check if is a guess
          if (subLine.endsWith("?")) {
            // Check if line is valid
            let value;
            sides[1] = sides[1].slice(0, -1);
            try {
              value = math.evaluate(sides[1]);
            } catch (e) {
              throw new laineError(
                "Guess syntax",
                "Guesses should follow this syntax: variable = value ?",
                `Line ${i + 1}`,
                "Change the guess to a valid input or remove it"
              );
            }
            let name = sides[0];
            options.userGuess[name] = value;
            continue;
          }
          // Check if is a single variable
          if (singleVar(sides[0], sides[1])) {
            let flag = true;
            // Check if is already computed
            if (parser.get(sides[0]) !== undefined) {
              // Store value to replace
              let value = parser.get(sides[0]);
              // Try to evaluate
              try {
                let ans = parser.evaluate(subLine);
                if (typeof ans !== "object") {
                  throw new laineError(
                    "Redefined variable",
                    `Variable ${sides[0]} has been redefined`,
                    `Line ${i + 1}`,
                    `Remove or correct line ${i + 1}`
                  );
                } else {
                  // Restore value
                  parser.set(sides[0], value);
                }
                flag = false;
              } catch (e) {
                if (e.name === "Redefined variable") {
                  throw e;
                }
              }
            }
            // Check if is a function erasing a variable
            if (sides[0].endsWith(")")) {
              let name = sides[0].split("(");
              if (parser.get(name[0]) !== undefined) {
                throw new laineError(
                  "Redefined variable with a function",
                  `Variable ${name[0]} has been redefined with a function`,
                  `Line ${i + 1}`,
                  `Remove or correct line ${i + 1}`
                );
              }
            }
            // Try to simply evaluate the expression;
            try {
              if (flag) {
                const ans = parser.evaluate(subLine);
                // Check if the parser did not mistaked as "unit" and is not a "function"
                if (typeof(ans) !=="function" && (ans.type === "Unit" || isNaN(ans))) {
                  // Remove object from parser scope
                  const lhs = sides[0];
                  parser.remove(lhs);
                  throw new Error("dummy"); // jump to catch
                }
              } else{
                throw new Error("dummy"); // jump to catch
              }
            } catch {
              // Try to create a equation object
              try {
                equations.push(new Equation(subLine, i + 1));
              } catch (e) {
                throw new laineError(
                  "Parsing error",
                  `laine could not parse the equation in line ${i + 1}`,
                  `Line ${i + 1}`,
                  e.message
                );
              }
            }
          } else {
            // Create an equation
            try {
              equations.push(new Equation(subLine, i + 1));
            } catch (e) {
              throw new laineError(
                "Parsing error",
                `laine could not parse the equation in line ${i + 1}`,
                `Line ${i + 1}`,
                e.message
              );
            }
          }
        }
      }
    }
  }
  return equations;
}

/**
 * Test if a line is an equation, blank or comment
 * @param {string} line - An line of text
 * @param {number} number - The line number
 * @returns bool
 */
function checkLine(line, number) {
  // Function: checks if the line is an equation
  if (line === "" || line.startsWith("#")) {
    return false;
  }
  const form = /=/;
  if (!form.test(line)) {
    throw new laineError(
      "Not an equation, comment or blank",
      `Line ${number} is not a valid line in laine`,
      `Line ${number}`,
      "Verify if there is something missing or strange in this line"
    );
  }
  return true;
}

/**
 * Find duplicated lines/equations
 * @param {string[]} lines - Array of lines of text
 * @param {Equation[]} equations - Array of equations objects
 */
function checkDuplicates(equations) {
  // Number of equations
  let uniqueEq = new Set();
  for (let equation of equations) {
    uniqueEq.add(equation);
  }
  if (uniqueEq.size !== equations.length) {
    // Find the copies
    let copies = new Set();
    for (let i = 0; i < equations.length; i++) {
      for (let j = 0; j < equations.length; j++) {
        if (i !== j && equations[i].text() == equations[j].text()) {
          copies.add(equations[i].number);
          copies.add(equations[j].number);
        }
      }
    }
    throw new laineError(
      "Duplicated equation",
      `The problem has multiple copies of a same equation`,
      `Line(s) ${[...copies].join(", ")}`,
      "Remove the copies"
    );
  }
}

/**
 * Equation object
 * @class
 */
class Equation {
  /**
   * Constructor for the Equation object
   * @param {string} line - Equation line as text
   * @param {number} number - Line number
   */
  constructor(line, number) {
    // line number
    this.number = number;
    // Equation sides
    let sides = line.split("=");
    this.lhs = sides[0];
    this.rhs = sides[1];
    // Is a simple equation? * Not a method because the function is used elsewhere
    this.simple = singleVar(this.lhs, this.rhs);
    // Store vars names * Not included as a method because is time consuming
    this.vars = varsName(`${this.lhs}-(${this.rhs})`);
  }

  /**
   * Delivers the expression = 0
   * @returns string
   */
  text() {
    return `${this.lhs}-(${this.rhs})`;
  }

  /**
   * Updates a variable to a number
   * @param {string} name - Var name
   * @param {number} value - Var value
   */
  update(name, value) {
    // Function: apply algebraic substituitions in a Equation
    if (name !== undefined && value !== undefined) {
      // Ugly solution for $ and regex mismatch
      // Still not capture things like "2varName"
      if (name[0] == "$") {
        name = "\\B\\" + name;
      } else {
        name = "\\b" + name;
      }
      const regex = new RegExp(name + "\\b", "g");
      const newText = `(${value.toString()})`;
      this.lhs = this.lhs.replace(regex, newText);
      this.rhs = this.rhs.replace(regex, newText);
    }
    this.vars = varsName(`${this.lhs}-(${this.rhs})`);
  }

  /**
   * Updates the variables to numbers if they were already computed in the parser
   */
  updateComputedVars() {
    const scope = parser.getAll();
    const names = this.vars;
    let namesLength = names.length;
    // Remove if computed;
    let flag = false;
    for (let i = 0; i < namesLength; i++) {
      if (scope[names[i]] !== undefined) {
        names.splice(i, 1);
        i--;
        namesLength--;
        flag = true;
      }
    }
    return flag;
  }
}

/**
 * Verifies if the equation is "simple" (var = expression)
 * @param {string} lhs - Left hand side of the equation
 * @param {string} rhs - Right hand side of the equation
 * @returns bool
 */
function singleVar(lhs, rhs) {
  const numb = /\d/;
  const op = /(\*|\/|\+|-|\^)/;
  // Check if starts with a number or has an operation
  if (numb.test(lhs[0]) || op.test(lhs)) {
    return false;
  }
  let name = new RegExp("[^\\w]" + lhs + "[^\\w]");
  // Now check if there the same variable is not on the other side
  if (name.test(rhs)) {
    return false;
  } else {
    return true;
  }
}

/**
 * Get all variables names in an line text
 * @param {string} line - text with the equation line
 * @returns string[]
 */
function varsName(line) {
  // Parse string
  const node = math.parse(line);
  // Scope
  const scope = parser.getAll();
  // Filter symbol nodes
  const symbolNodes = node.filter((node) => node.isSymbolNode);
  // Filter function nodes
  const functionNodes = node.filter((node) => node.type === "FunctionNode");
  // Store unique symbols that are not functions
  let symbols = [];
  checkFunction: for (let symbolNode of symbolNodes) {
    // Pass if is already included
    if (symbols.includes(symbolNode.name)) {
      continue checkFunction;
    }
    // Test if is already parsed/solved
    let test = scope[symbolNode.name];
    if (typeof test === "number" || typeof test === "function") {
      continue checkFunction;
    }
    // Test if is a function name
    for (let functionNode of functionNodes) {
      if (symbolNode.name === functionNode.name) {
        continue checkFunction;
      }
    }
    // Include otherwise
    symbols.push(symbolNode.name);
  }
  return symbols;
}

/*
  Algebraic substitution
*/

/**
 * Find substitutions and split them from the original equations array
 * Substitutions are applied to substitions and to equations
 * @param {Equations[]} equations - Array of equations objects
 * @returns Equations[]
 */
function algebraicSubs(equations) {
  let simpleEquations = [];
  let simpleEquationsNames = new Set();
  const scope = parser.getAll();
  // Get algebraic substitutions
  for (let i = 0; i < equations.length; i++) {
    equations[i].updateComputedVars();
    let name = equations[i].lhs;
    if (
      equations[i].simple &&
      scope[name] === undefined &&
      !simpleEquationsNames.has(name)
    ) {
      simpleEquations.push(equations[i]);
      simpleEquationsNames.add(name);
      equations.splice(i, 1);
      i--;
    }
  }
  // Subtstitute between substitutions (actually very important)
  if (simpleEquations.length > 0) {
    let change = true;
    let count = 0; // avoiding infinity loops, because some vars replaced by update function
    while (count < 5 && change) {
      change = false;
      for (let i = 0; i < simpleEquations.length; i++) {
        let name = simpleEquations[i].vars;
        for (let k = 0; k < name.length; k++) {
          for (let j = 0; j < simpleEquations.length; j++) {
            if (j === i) {
              continue;
            }
            if (name[k] === simpleEquations[j].lhs) {
              simpleEquations[i].update(name[k], simpleEquations[j].rhs);
              change = true;
            }
          }
        }
      }
      count++;
    }
    // Substitute in equations
    for (let simpleEquation of simpleEquations) {
      let subs = simpleEquation.lhs;
      for (let equation of equations) {
        for (let name of equation.vars) {
          if (name === subs) {
            equation.update(name, simpleEquation.rhs);
          }
        }
      }
    }
  }
  return simpleEquations;
}

/*
  Solver sequences
*/

/**
 * Solves the one dimensional and two dimensional problems
 * @param {Equation[]} equations - Array of equations
 * @param {object} laineOptions - Options object
 * @returns Equation[]
 */
function solve1D(equations, laineOptions) {
  let name;
  let t1 = performance.now();
  loop1D: while (equations.length > 0) {
    // Avoid long loops
    if (performance.now() - t1 > 3e3) {
      throw new laineError(
        "Max. evaluation time",
        "laine could not find a solution for 1D/2D problems in less than 3 seconds",
        `Stopped at line ${equations[0].number}`,
        "Try to simplify the problem and contact the developer"
      );
    }
    // In Plots : break loop if y is already computed
    if (laineOptions.solveFor !== undefined) {
      if (parser.get(laineOptions.solveFor) !== undefined) {
        return [];
      }
    }
    // Get number of variables : (0) error ; (1) 1D solve; (2) 2D solve
    name = equations[0].vars;
    if (name.length === 0) {
      throw new laineError(
        "Redefined variable / No variable",
        `Some variable has been redefined / There is no variables`,
        `Line ${equations[0].number}`,
        `Remove or correct the line ${equations[0].number}`
      );
    } else if (name.length === 1) {
      // Try to simply evaluate
      if (laineOptions.simples) {
        try {
          parser.evaluate(`${equations[0].lhs}=${equations[0].rhs}`);
          if (parser.get(name[0]) !== undefined) {
            equations.shift();
            continue loop1D;
          }
        } catch {
          //console.error(e);
        }
      }
      // Try to solve the 1D problem
      let problem1D = new Problem([equations[0]]);
      if (parser.get(problem1D.names[0]) !== undefined) {
        throw new laineError(
          "Redefined variable",
          `Some variable has been redefined`,
          `Line ${problem1D.numbers}`,
          "Remove or correct the line aforementioned"
        );
      }
      let options = solveOptions(laineOptions);
      problem1D.solve(options);
      equations.shift(); // clear solved line
    } else {
      // TRY TO REDUCE PROBLEM DIMENSIONS
      let change = false; // flag
      for (let i = 0; i < equations.length; i++) {
        let flag = equations[i].updateComputedVars();
        if (flag) {
          change = true;
        }
      }
      equations.sort((a, b) => a.vars.length - b.vars.length);
      // If no variables were removed than:
      if (!change) {
        break loop1D;
      }
    }
  }
  return equations;
}

/**
 * Solves multidimensional problems in blocks
 * @param {Equations[]} equations - Array of equations objects
 * @param {object} laineOptions - solver options
 * @returns Equations[]
 */
function solveND(equations, laineOptions) {
  // OBS: this method does not guarantee a block with minimal size
  while (equations.length !== 0) {
    let vars = new Set(equations[0].vars);
    let block = [equations[0]];
    equations.shift();
    let count = 0;
    blockSearch: while (
      vars.size !== block.length &&
      equations.length !== 0 &&
      count < equations.length
    ) {
      // check if next equation has variables of the block
      for (let name of equations[count].vars) {
        if (vars.has(name)) {
          for (let name2 of equations[count].vars) {
            vars.add(name2);
          }
          block.push(equations[count]);
          equations.splice(count, 1);
          count = 0;
          continue blockSearch;
        }
      }
      count++;
    }
    let options = solveOptions(laineOptions);
    let problem = new Problem(block);
    // Check the problem is correct
    if (block.length !== problem.names.length) {
      // Returns an error or an array of Equations if requested (Plots)
      if (!laineOptions.returnProblem) {
        let help;
        let df = problem.names.length - block.length;
        if (df < 0) {
          help = `Try to remove ${-df} equation(s) with at least one of these variables: ${problem.names.join(
            ", "
          )}`;
        } else {
          help = `Try to include ${df} equation(s) with at least one of these variables: ${problem.names.join(
            ", "
          )}`;
        }
        throw new laineError(
          "Degrees of freedom",
          `The problem has ${problem.names.length} variables and ${block.length} equations`,
          `Line(s) ${problem.numbers.join(", ")}`,
          help
        );
      } else {
        return block;
      }
    }
    problem.solve(options);
    // In Plots : break loop if y is already computed
    if (laineOptions.solveFor !== undefined) {
      if (parser.get(laineOptions.solveFor) !== undefined) {
        return [];
      }
    }
    // Loop with updated values if there is more equations to solve
    if (equations.length !== 0) {
      for (let equation of equations) {
        equation.updateComputedVars();
      }
    }
  }
  return [];
}

/**
 * Problem object
 * @class
 */
class Problem {
  /**
   * Creates a problem based on a series of equations
   * @param {Equations[]} equations - Array of equations
   */
  constructor(equations) {
    this.compiled = [];
    this.lhs = []; // include to determine the order of magnitude
    this.equations = equations;
    this.names = []; // simple to use a set
    this.numbers = [];
    this.jacAux = [];
    // Here we try to prepare somethings to make our solution faster.
    for (let i = 0; i < equations.length; i++) {
      // It is faster to compile only in the Problem
      this.compiled[i] = math.compile(equations[i].text());
      this.lhs[i] = math.compile(equations[i].lhs);
      this.numbers[i] = equations[i].number;
      this.jacAux.push([]);
      // Store variables names and the variables in each line
      for (let symbol of equations[i].vars) {
        if (!this.names.includes(symbol)) {
          this.names.push(symbol);
          this.jacAux[i].push(this.names.length - 1);
        } else {
          for (let z = 0; z < this.names.length; z++) {
            if (this.names[z] === symbol) {
              this.jacAux[i].push(z);
              break;
            }
          }
        }
      }
      this.jacAux[i].sort();
    }
    this.scope = parser.getAll(); // parser is a global var
  }

  /**
   * Solves the problem using numerical methods
   * @param {object} options - Solver options
   * @returns bool
   */
  solve(options) {
    const tStart = performance.now();
    const dimension = this.equations.length;
    const maxTimes = dimension > 1 ? 30 : 4;
    let results;
    // Main loop
    for (let count = 0; !results && count < maxTimes; ++count) {
      try {
        // Guesses
        let guessOptions;
        if (options.savedSolution === undefined) {
          guessOptions = find_guess(this, options);
        } else {
          let values = [];
          for (let name of this.names) {
            values.push(options.savedSolution[name]);
          }
          guessOptions = [new Guess(values, 0)];
        }
        // Solver
        results = solver(this, guessOptions, options);
      } catch {
        if (dimension === 1) {
          // Exclude saved solution
          count = options.savedSolution !== undefined ? 0 : count;
          options.savedSolution = undefined;
          // Use binary search
          options.binary = count === 1 ? true : false;
          // Try negative guesses
          options.negative = count === 2 ? true : false;
          // Try more if there is enough time
          if (count === 3 && (performance.now() - tStart < 3e3/2) ){
            count = 0;
          }
        } else {
          // Alter between pairSearch
          options.pairSearch =
            dimension == 2 && options.pairSearch ? false : true;
          // Negative guesses
          options.negative = count > 1 && count < 4 ? true : false;
          // Try all if nothing is working
          options.tryAll = count > maxTimes / 2 ? true : false;
        }
      }
      // Avoid large time consumption
      if (performance.now() - tStart > 3e3) {
        break;
      }
    }
    // Return value or give a error
    if (results) {
      if (options.returnValue) {
        return results;
      } else {
        for (let i = 0; i < dimension; i++) {
          parser.set(this.names[i], results.get([i, 0]));
        }
        return true;
      }
    } else {
      // Out of while loop is an error
      throw new laineError(
        "Difficult problem or there are no real solutions",
        "laine could not find a feasible solution",
        `Lines ${this.numbers.join(", ")}`,
        `1. Check if the problem is correct and there are real solutions <br>` +
          `2. Try to provide a guess for one (or more) of these variables:<br>` +
          `<b>${this.names.join(", ")}</b><br>` +
          `Input a guess by using a question mark (?):<br>` +
          `<b>variable = value ?</b><br>` +
          `3. Contact the developer`
      );
    }
  }
}

/**
 * Creates a default option object for solve function
 * @param {object} laineOptions - laine options
 * @returns object
 */
function solveOptions(laineOptions) {
  return {
    negative: false,
    binary: false,
    returnValue: false,
    pairSearch: false,
    savedSolution: laineOptions.savedSolution,
    userGuess: laineOptions.userGuess,
    tryAll: false,
  };
}

/*
  Guess search
*/

/**
 * Gets a default array of guesses
 * @param {object} options - solver options
 * @returns number[]
 */
function getGuessList(options) {
  let guessList = [0, 1e-3, 0.1, 1, 10, 200, 1e3, 1e5];
  // 150 was included because in some cases the temperature range is quite short (120-300K)
  if (options.negative) {
    for (let i = 0; i < guessList.length; i++) {
      guessList[i] *= -1;
    }
  }
  return guessList;
}

/**
 * A guess object
 * @class
 */
class Guess {
  /**
   * Creates a guess object
   * @param {number[]} array - Array of guess values
   * @param {number} error - Error for "expression(guess) = 0"
   */
  constructor(array, error) {
    this.value = array;
    this.error = error;
  }
}

/**
 * Returns an array of guesses
 * @param {Problem} problem - A problem object
 * @param {object} options - Solver optiosn
 * @returns Guess[]
 */
function find_guess(problem, options) {
  // Binary search - for one variable
  if (options.binary) {
    return binary_search(problem);
  }

  // Get guess list
  let guessList = getGuessList(options);
  let guesses = [];

  // Check if problem has two variables (better guesses):
  if (problem.names.length === 2 && options.pairSearch) {
    // Recursive search
    options.pairSearch = false;
    for (let name of problem.names) {
      if (options.userGuess[name] === undefined) {
        // Avoid overwrite the userGuess
        for (let guess of guessList) {
          options.userGuess[name] = guess;
          try {
            let result = find_guess(problem, options);
            if (result !== undefined && result.length !== 0) {
              guesses.push(result[0]);
            }
          } catch {
            continue;
          }
        }
        delete options.userGuess[name];
      } else {
        try {
          let result = find_guess(problem, options);
          if (result !== undefined && result.length !== 0) {
            guesses.push(result[0]);
          }
        } catch {
          continue;
        }
      }
    }
    if (guesses.length === 0) {
      throw new laineError(
        "Guess error [internal]",
        "Pair seach could not find a guess",
        problem.numbers
      );
    }
    options.pairSearch = true;
    guesses.sort((a, b) => a.error - b.error);
    // Check for diversity (simple) - loop array
    for (let i = 0; i < guesses.length - 1; ++i) {
      let ratio = guesses[i].value[0] / guesses[i + 1].value[0];
      if ((ratio >= 0.5 && ratio <= 2) || isNaN(ratio)) {
        ratio = guesses[i].value[1] / guesses[i + 1].value[1];
        if ((ratio >= 0.5 && ratio <= 2) || isNaN(ratio)) {
          guesses.splice(i + 1, 1);
          i--;
        }
      }
    }
    return guesses;
  }

  // Check a good guess
  let error;
  const names = problem.names;
  const compiled = problem.compiled;
  let scope = problem.scope;
  // Calculate for each guess
  equationLoop: for (let i = 0; i < guessList.length; i++) {
    let varsList = []; // not ideal, but fast
    // Update guess
    let flag = false;
    for (let name of names) {
      let value;
      if (options.userGuess[name] !== undefined) {
        value = options.userGuess[name];
      } else {
        value = guessList[i] * (1 + Math.random());
        flag = true;
      }
      scope[name] = value;
      varsList.push(value);
    }
    // Jump if there is no random guesses
    if (!flag) {
      i = guessList.length;
    }
    // Calculate
    error = 0;
    for (let compiledEq of compiled) {
      try {
        const aux = compiledEq.evaluate(scope);
        if (Math.abs(aux) !== Infinity && !isNaN(aux)) {
          error += Math.abs(aux);
        } else {
          continue equationLoop;
        }
      } catch {
        continue equationLoop; // does not include
      }
    }
    guesses.push(new Guess(varsList, error));
  }
  // Sort
  if (guesses.length !== 0) {
    guesses.sort((a, b) => a.error - b.error);
  } else {
    throw new laineError(
      "Guess error [internal]",
      "Random search could not find a guess",
      problem.numbers
    );
  }
  return guesses;
}

/**
 * Finds a guess using binary search (modified)
 * @param {Problem} problem - A problem object
 * @returns Guess
 */
function binary_search(problem) {
  // Inputs
  const name = problem.names[0];
  const compiled = problem.compiled[0];
  let scope = problem.scope;
  // Define variables : points respect the limits of thermodynamic functions
  const points = [
    1e6, 1e4, 6e3, 273.15, 2e2, 1e2, 1, 1e-2, 0, -1e-2, -1, -1e2, -1e4, -1e6,
  ];
  // First evaluation
  let sign, limits, mid;
  let ans = [];
  let lower = Infinity;
  for (let i = 0; i < points.length; i++) {
    // Try to evaluate guess
    scope[name] = points[i];
    try {
      ans[i] = compiled.evaluate(scope);
    } catch {
      ans[i] = undefined;
      sign = undefined;
      continue;
    }
    // If out of range
    if (isNaN(ans[i]) || typeof ans[i] !== "number") {
      sign = undefined;
      continue;
    }
    let thisSign = Math.sign(ans[i]);
    if (sign !== undefined && sign !== thisSign) {
      limits = [points[i - 1], points[i]];
      ans = [ans[i - 1], ans[i]];
      break;
    } else {
      sign = thisSign;
    }
    let absValue = Math.abs(ans[i]);
    if (absValue < lower) {
      lower = absValue;
    }
  }
  // If no range is found, return error
  if (limits === undefined) {
    throw new laineError(
      "Guess error [internal]",
      "Binary search could not find a guess",
      problem.numbers
    );
  }
  // Binary search
  let count = 0;
  let mid_ans = 2;
  while (Math.abs(mid_ans) > 1) {
    // Calculate midpoint
    mid = (limits[0] + limits[1]) / 2;
    scope[name] = mid;
    mid_ans = compiled.evaluate(scope);
    // Choose new brackets
    if (Math.sign(mid_ans) === Math.sign(ans[0])) {
      limits[0] = mid;
      ans[0] = mid_ans;
    } else {
      limits[1] = mid;
      ans[1] = mid_ans;
    }
    count++;
    if (count > 50) {
      break;
    }
  }
  return [new Guess([mid], 0)];
}

/*
  Numerical solver
*/

/**
 * A Newton-Raphson + Line search algorithm
 * @param {Problem} problem - A problem object
 * @param {object} options - Solver options
 * @returns bool|number
 */
function solver(problem, guessOptions, options) {
  let tStart = performance.now();
  // Create (possibly) large matrix
  let dimension = problem.equations.length;
  let answers = math.zeros(dimension, 1);
  let jac = math.zeros(dimension, dimension);
  // Set initial conditions
  let maxTries =
    guessOptions.length > 2 && !options.tryAll ? 3 : guessOptions.length; // Problema
  let converged = false;
  let guesses, dx;
  // Loop guess options
  guessLoop: for (let g = 0; !converged && g < maxTries; ++g) {
    // Guesses column
    guesses = math.matrix(guessOptions[g].value);
    guesses.resize([dimension, 1]);
    // First evaluation
    answers = calcFun(problem, guesses, answers);
    let diff = Math.abs(math.sum(answers));
    // Newton-Raphson loop
    for (let i = 0; !converged && i < 200; ++i) {
      jac = update_jac(problem, guesses, answers, jac);
      try {
        dx = math.lusolve(jac, answers);
      } catch {
        continue guessLoop;
      }
      // Line search loop
      let factor = 1;
      let Xguesses;
      let Xdiff = Infinity;
      linesearch: while (Xdiff > diff && factor > 1e-2) {
        Xguesses = math.subtract(guesses, math.multiply(dx, factor));
        answers = calcFun(problem, Xguesses, answers);
        factor /= 2;
        // Check if answer is a real number
        for (let i = 0; i < dimension; ++i) {
          if (
            isNaN(answers.get([i, 0])) ||
            !isFinite(answers.get([i,0])) ||
            typeof answers.get([i, 0]) !== "number"
          ) {
            continue linesearch;
          }
        }
        // Calculate and check errors
        Xdiff = Math.abs(math.sum(answers));
      }
      if (factor <= 1e-2) {
        // Dead end : Line search has not converged
        continue guessLoop;
      }
      // Store guess change
      let guessChange = Math.abs(1 - Xdiff / diff);
      // Overwrite guesses, store diff
      diff = Xdiff;
      guesses = Xguesses;
      let relError = calcError(problem,answers);

      // Check convergence criteria
      if (relError < 1e-3) {
        let test = 0;
        // Check if dx is little compared with guess
        for (let i = 0; i < dimension; ++i) {
          if (guesses.get([i, 0]) !== 0) {
            test += Math.abs(dx.get([i, 0]) / guesses.get([i, 0]));
          } else {
            test += Math.abs(dx.get([i, 0]));
          }
        }
        if (test < 5e-6) {
          converged = true;
        }
      } else if (isNaN(diff) || guessChange < 5e-2) {
        // Bad start : Initial guess was a failure
        continue guessLoop;
      }
      if (performance.now() - tStart > 3e3) {
        throw Error("time limit");
      }
    }
  }
  if (!converged) {
    throw Error("bad start");
  }
  return guesses;
}

/**
 * Calculate relative error
 * @param {Problem} problem - A problem object
 * @param {matrix} answers - Matrix of answers math.js
 * @returns errors
 */
function calcError(problem,answers){
  const lhs = problem.lhs;
  let error = 0;
  // Calculate all lines
  for (let i = 0; i < lhs.length; ++i) {
    let ansValue = Math.abs(answers.get([i, 0]));
    let lhsValue = Math.abs(lhs[i].evaluate(problem.scope));
    let rhsValue = Math.abs(lhsValue-ansValue);
    if (lhsValue !== 0 && rhsValue !== 0){
      error+= lhsValue > rhsValue ? ansValue/lhsValue : ansValue/rhsValue;
    } else {
      error+= ansValue;
    }
  }
  return error;
}

/**
 * Updates the value of answers for a new guess
 * @param {Problem} problem - A problem object
 * @param {matrix} guesses - a math.js matrix
 * @param {matrix} answers - Matrix of answers math.js
 * @returns answers
 */
function calcFun(problem, guesses, answers) {
  const compiled = problem.compiled;
  const names = problem.names;
  // Set all guesses
  for (let i = 0; i < names.length; ++i) {
    problem.scope[names[i]] = guesses.get([i, 0]);
  }
  // Calculate all lines
  for (let i = 0; i < compiled.length; ++i) {
    answers.set([i, 0], compiled[i].evaluate(problem.scope));
  }
  return answers;
}

/**
 * Updates the values of the jacobian for a new point
 * @param {Problem} problem - A problem object
 * @param {matrix} guesses - Math.js matrix
 * @param {matrix} answers - Math.js matrix
 * @param {matrix} jac - Math.js matrix
 * @returns jac
 */
function update_jac(problem, guesses, answers, jac) {
  const compiled = problem.compiled;
  const names = problem.names;
  let der, jacAux;
  for (let i = 0; i < names.length; ++i) {
    jacAux = problem.jacAux[i];
    for (let j = 0; j < jacAux.length; ++j) {
      der = derivative(
        problem.scope,
        compiled[i],
        names[jacAux[j]],
        answers.get([i, 0]),
        guesses.get([jacAux[j], 0])
      );
      jac.subset(math.index(i, jacAux[j]), der);
    }
  }
  return jac;
}

/**
 * Calculates the numerical derivative
 * @param {object} scope - Parser scope
 * @param {object} compiled - A compiled equation
 * @param {string} name - Var name
 * @param {number} f - Answer value
 * @param {number} x - Guess value
 * @returns number
 */
function derivative(scope, compiled, name, f, x) {
  // Determine x+dx
  let xNear;
  if (x === 0) {
    xNear = x + 1e-8;
  } else {
    xNear = x * (1 + 1e-6);
  }
  // Calculate derivative
  scope[name] = xNear;
  const fNear = compiled.evaluate(scope);
  scope[name] = x;
  // Change value back - parser scope
  return (fNear - f) / (xNear - x);
}
