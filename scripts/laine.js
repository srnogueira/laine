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
  equations = solve1D2D(equations, laineOptions);
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

  // Sort substitutions
  simpleEquations.sort((a, b) => a.vars.length - b.vars.length); // sorting
  // Activate simple evaluation mode - It will try to evaluated first, usually works and is faster
  laineOptions.simples = true;

  // Solves 1-2D problems in substitutions
  simpleEquations = solve1D2D(simpleEquations, laineOptions);
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
    let allEqs = equations.concat(simpleEquations);
    return allEqs;
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
    lines[i] = lines[i].trim();
    // Check if is an equation
    if (checkLine(lines[i], i + 1)) {
      // Break multi-lines
      const aux = lines[i].split(";");
      for (let subLine of aux) {
        // Check each subline
        subLine = subLine.trim();
        if (checkLine(subLine, i + 1)) {
          // Break into sides
          let sides = subLine.split("=");
          // Check if is a guess
          if (subLine.endsWith("?")) {
            // Check if line is valid
            let value;
            sides[1] = sides[1].trim().slice(0, -1);
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
            let name = sides[0].trim();
            options.userGuess[name] = value;
            continue;
          }
          // Check if is a single variable
          if (singleVar(sides[0], sides[1])) {
            // Check if is already computed
            if (parser.get(sides[0].trim()) !== undefined) {
              // Try to evaluate
              try {
                parser.evaluate(subLine);
                throw new laineError(
                  "Redefined variable",
                  `Variable ${sides[0].trim()} has been redefined`,
                  `Line ${i + 1}`,
                  `Remove or correct line ${i + 1}`
                );
              } catch (e) {
                if (e.name === "Redefined variable") {
                  throw e;
                }
              }
            }
            // Check if is a function erasing a variable
            if (sides[0].endsWith(")")) {
              let name = sides[0].split("(");
              if (parser.get(name[0].trim()) !== undefined) {
                throw new laineError(
                  "Redefined variable with a function",
                  `Variable ${name[0].trim()} has been redefined with a function`,
                  `Line ${i + 1}`,
                  `Remove or correct line ${i + 1}`
                );
              }
            }
            // Try to simply evaluate the expression;
            try {
              const ans = parser.evaluate(subLine);
              // Check if the parser did not mistaked as "unit"
              if (ans.type === "Unit") {
                // Remove object from parser scope
                const lhs = sides[0].trim();
                parser.remove(lhs);
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
              //console.error(e);
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
    let equationText = line.split("#")[0];
    // line number
    this.number = number;
    // Equation sides
    let sides = equationText.split("=");
    this.lhs = sides[0].trim();
    this.rhs = sides[1].trim();
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
      const regex = new RegExp("\\b" + name + "\\b", "g");
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
    for (let i = 0; i < namesLength; i++) {
      if (scope[names[i]] !== undefined) {
        names.splice(i, 1);
        i--;
        namesLength--;
      }
    }
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
  // Check if has a number or operation
  if (numb.test(lhs[0]) || op.test(lhs)) {
    return false;
  }
  let name = new RegExp(lhs.trim() + "[s|(\\*|\\+|\\-|\\/)]");
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
    let name = equations[i].lhs.trim();
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
    let changeLine = true;
    let maxTimes = 0;
    substitutions: while (changeLine) {
      for (let i = 0; i < simpleEquations.length; i++) {
        changeLine = false;
        let name = simpleEquations[i].vars;
        for (let k = 0; k < name.length; k++) {
          for (let j = 0; j < simpleEquations.length; j++) {
            if (j === i) {
              continue;
            }
            if (name[k] === simpleEquations[j].lhs) {
              simpleEquations[i].update(name[k], simpleEquations[j].rhs);
              changeLine = true;
            }
          }
        }
        // Check max number of substitutions
        if (changeLine) {
          maxTimes++;
        }
        if (maxTimes === simpleEquations.length - 1) {
          break substitutions;
        }
      }
    }
    // Substitute in equations
    for (let simpleEquation of simpleEquations) {
      let subs = simpleEquation.lhs.trim();
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
function solve1D2D(equations, laineOptions) {
  let name, scope;
  let t1 = performance.now();
  loop1D_2D: while (equations.length > 0) {
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
            continue loop1D_2D;
          }
        } catch (e) {
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
      // (1) Remove vars that already have been computed
      let loop1D = false; // flag
      scope = parser.getAll();
      for (let i = 0; i < equations.length; i++) {
        name = equations[i].vars;
        for (let j = 0; j < name.length; j++) {
          if (scope[name[j]] !== undefined) {
            equations[i].updateComputedVars();
            loop1D = true; // flag
            break;
          }
        }
      }
      equations.sort((a, b) => a.vars.length - b.vars.length);
      // If no variables were removed than:
      if (!loop1D) {
        if (equations[0].vars.length !== 1) {
          // TRY TO FIND 2D PROBLEMS AND SOLVE
          let changed = false;
          let varsA, varsB;
          loop2D: for (let i = 0; i < equations.length; i++) {
            if (equations[i].vars.length === 2) {
              for (let j = i + 1; j < equations.length; j++) {
                if (equations[j].vars.length === 2) {
                  varsA = equations[i].vars;
                  varsB = equations[j].vars;
                  if (
                    (varsA[0] === varsB[0] && varsA[1] === varsB[1]) ||
                    (varsA[1] === varsB[0] && varsA[0] === varsB[1])
                  ) {
                    let options2D = solveOptions(laineOptions);
                    let problem = new Problem([equations[i], equations[j]]);
                    problem.solve(options2D);
                    equations.splice(i, 1);
                    equations.splice(j - 1, 1);
                    changed = true;
                    break loop2D;
                  }
                } else {
                  continue loop2D;
                }
              }
            } else {
              break loop2D;
            }
          }
          // If sucessfull, update equations and loop; else, break the loop.
          if (changed) {
            for (let i = 0; i < equations.length; i++) {
              let varsEquation = equations[i].vars;
              if (
                varsEquation.includes(varsA[0]) ||
                varsEquation.includes(varsA[1])
              ) {
                equations[i].updateComputedVars();
              }
            }
            equations.sort((a, b) => a.vars.length - b.vars.length);
          } else {
            break loop1D_2D;
          }
        }
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
          `Line(s) ${problem.numbers}`,
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
    this.equations = equations;
    this.names = []; // simple to use a set
    this.numbers = [];
    this.jacAux = [];
    // Here we try to prepare somethings to make our solution faster.
    for (let i = 0; i < equations.length; i++) {
      // It is faster to compile only in the Problem
      this.compiled[i] = math.compile(equations[i].text());
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
    let count = 0;
    const dimension = this.equations.length;
    const maxTimes = dimension > 1 ? 20 : 5;
    while (performance.now() - tStart < 3e3 && count < maxTimes) {
      count++;
      try {
        return solver(this, options);
      } catch {
        // Seems random, but it tries to cover all possibilities
        if (dimension === 1) {
          count = options.savedSolution !== undefined ? 0 : count;
          options.savedSolution = undefined;
          options.excludedList = count === 1 ? true : false;
          options.binary = count === 2 ? true : false;
          options.negative = count === 3 ? true : false;
        } else {
          options.excludedList = options.excludedList ? false : true;
          if (count === 2 || count === 3 || count === 6 || count === 7) {
            options.pairSearch = true;
          } else {
            options.pairSearch = false;
          }
          if (count > 3 && count < 8) {
            options.negative = true;
          } else {
            options.negative = false;
          }
        }
      }
    }
    // Out of while loop is an error
    throw new laineError(
      "Difficult problem or there are no real solutions",
      "laine could not find a feasible solution",
      `Lines ${this.numbers.join(", ")}`,
      `1. Check if the problem is correct and there are real solutions <br>`+
      `2. Try to provide a guess for one (or more) of these variables:<br>`+
      `<b>${this.names.join(", ")}</b><br>`+
      `Input a guess by using a question mark (?):<br>`+
      `<b>variable = value ?</b><br>`+
      `3. Contact the developer`
    );
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
    excludedList: false,
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
  let guessList = options.excludedList
    ? [0, 1e-4, 1e-2, 1, 100, 1e4, 1e6]
    : [0, 1e-5, 1e-3, 0.1, 10, 150, 1e3, 1e5];
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
      for (let guess of guessList) {
        options.userGuess[name.trim()] = guess;
        try {
          let result = find_guess(problem, options);
          if (result !== undefined && result.length !== 0) {
            guesses.push(result[0]);
          }
        } catch {
          continue;
        }
      }
      delete options.userGuess[name.trim()];
    }
    if (guesses.length === 0) {
      throw laineError(
        "Guess error [internal]",
        "Pair seach could not find a guess",
        problem.numbers
      );
    }
    options.pairSearch = true;
    guesses.sort((a, b) => a.error - b.error);
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
    for (let name of names) {
      let value;
      if (options.userGuess[name] !== undefined) {
        value = options.userGuess[name];
      } else {
        value = guessList[i] * (1 + Math.random());
      }
      scope[name] = value;
      varsList.push(value);
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
    1e6,
    1e4,
    6e3,
    273.15,
    2e2,
    1e2,
    1,
    1e-2,
    0,
    -1e-2,
    -1,
    -1e2,
    -1e4,
    -1e6,
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
    } catch (e) {
      //console.error(e);
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
function solver(problem, options) {
  const names = problem.names;
  const namesLength = names.length;
  // First guess and evaluation
  let guesses;
  let Xguesses = math.zeros(namesLength, 1);
  let answers = math.zeros(namesLength, 1);
  let guessOptions, guessTry;
  if (options.savedSolution === undefined) {
    guessOptions = find_guess(problem, options);
  } else {
    let values = [];
    for (let name of names) {
      values.push(options.savedSolution[name]);
    }
    guessOptions = [new Guess(values, 0)];
  }
  let jac = math.zeros(namesLength, namesLength, "sparse");
  let diff, jacInv, dx, Xdiff, factor, count, count2, guessChange;
  let countOptions = 0;
  let tStart = performance.now();
  let tol = 1e-6;
  guessLoop: while (countOptions < 3 && guessOptions.length > 0) {
    if (performance.now() - tStart > 3e3) {
      throw new laineError(
        "Max. Time [internal]",
        "Max. evaluation time on solver",
        this.numbers
      );
    }
    guessTry = guessOptions[0];
    guesses = math.zeros(namesLength, 1);
    for (let i = 0; i < namesLength; i++) {
      guesses.set([i, 0], guessTry.value[i]);
    }
    answers = calcFun(problem, guesses, answers);
    diff = Math.abs(math.sum(answers));
    count = 0;
    // Newton-Raphson
    while (count < 200) {
      jac = update_jac(problem, guesses, answers, jac); // this could be optimized
      jacInv = math.inv(jac);
      dx = math.multiply(jacInv, answers); // this could be optimized
      // Line search loop
      count2 = 0;
      factor = 1;
      lineSearch: while (count2 < 20) {
        // Try updated guess
        Xguesses = math.subtract(guesses, math.multiply(dx, factor));
        answers = calcFun(problem, Xguesses, answers);
        // Check if answer is a real number, continue if otherwise
        for (let i = 0; i < namesLength; i++) {
          if (
            isNaN(answers.get([i, 0])) ||
            typeof answers.get([i, 0]) !== "number"
          ) {
            factor /= 2;
            count2++;
            continue lineSearch;
          }
        }
        // Calculate and check errors
        Xdiff = Math.abs(math.sum(answers));
        if (Xdiff > diff) {
          factor /= 2;
          count2++;
          continue lineSearch;
        } else {
          guessChange = Math.abs(1 - Xdiff / diff);
          diff = Xdiff;
          guesses = Xguesses;
          break lineSearch;
        }
      }
      if (count2 === 20) {
        // Dead end : Line search has not converged
        guessOptions.shift();
        countOptions++;
        continue guessLoop;
      }
      // Check convergence
      if (diff < tol) {
        // Check if dx is little compared with guess
        let test = 0;
        for (let i = 0; i < namesLength; i++) {
          if (guesses.get([i, 0]) !== 0) {
            test += Math.abs(dx.get([i, 0]) / guesses.get([i, 0]));
          } else {
            test += Math.abs(dx.get([i, 0]));
          }
        }
        if (test < tol) {
          break guessLoop;
        } else {
          count++;
        }
      } else if (guessChange === 0 && diff > tol) {
        // Bad start : Initial guess was a failure
        guessOptions.shift();
        countOptions++;
        continue guessLoop;
      } else {
        count++;
      }
      if (performance.now() - tStart > 3e3) {
        throw new laineError(
          "Max. Time [internal]",
          "Max. evaluation time on solver",
          this.numbers
        );
      }
      // Break long iterations
      if (count === 199) {
        // Max. iterations : Exceeded the iteration limit',problem.numbers
        guessOptions.shift();
        countOptions++;
        continue guessLoop;
      }
    }
  }
  if (guessOptions.length === 0 || countOptions === 3) {
    throw new laineError(
      "Bad start [internal]",
      "Initial guess was a failure",
      problem.numbers
    );
  }
  // Update on parser
  if (options.returnValue) {
    return guesses;
  } else {
    for (let i = 0; i < namesLength; i++) {
      parser.set(names[i], guesses.get([i, 0]));
    }
    return true;
  }
}

/**
 * Updates the value of answers for a new guess
 * @param {Problem} problem - A problem object
 * @param {matrix} guesses - a math.js matrix
 * @param {matrix} answers - Matrix of answers math.js
 * @returns anwers
 */
function calcFun(problem, guesses, answers) {
  let scope = problem.scope;
  const compiled = problem.compiled;
  const names = problem.names;
  // Set all guesses
  for (let i = 0; i < names.length; i++) {
    scope[names[i]] = guesses.get([i, 0]);
  }
  // Calculate all lines
  for (let i = 0; i < compiled.length; i++) {
    answers.set([i, 0], compiled[i].evaluate(scope));
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
  for (let i = 0; i < names.length; i++) {
    jacAux = problem.jacAux[i];
    for (let j = 0; j < jacAux.length; j++) {
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
  const absDelta = 1e-8;
  const relDelta = 1e-6;
  let xNear;
  if (x === 0) {
    xNear = x + absDelta;
  } else {
    xNear = x * (1 + relDelta);
  }
  // Calculate derivative
  scope[name] = xNear;
  const fNear = compiled.evaluate(scope);
  const dfdx = (fNear - f) / (xNear - x);
  // Change value back - parser scope
  scope[name] = x;
  return dfdx;
}
