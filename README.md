# laine
laine is a web app to solve equations with thermodynamic properties in a friendly way. [Try it here!](https://srnogueira.github.io/laine)

## How to use it
- A problem can be written as a set of equations in **any order**, just following the simple structure : *left = right*;
- If the problem has the same number of equations and variables, the solver should be able to give *a real solution* for the problem;

## Main features
1. You can input equations in convenient ways and in any order;
2. You can also include *thermodynamic properties* using some special functions;
3. It solves most non-linear system of equations without needing extra inputs;
4. The results are shown in pretty report.

## Dependencies
1. mathjs: for math functions, parser, evaluation and conversion to TeX;
2. CoolProp: for thermodynamic functions of pure fluids and humid air;
3. MathJax: for rendering equations;
4. Google fonts: for 'Quicksand' font; 

## Limitations
1. Problems including variables of different orders of magnitude, discontinuities and lots of inversions may not convert;
2. Only one solution is displayed and the user can not specify guesses or bounds for solutions.
