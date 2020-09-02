# About laine
laine is a web app to solve non-linear equation systems with thermodynamic properties in a friendly way. A problem can be written as a set of equations in any order, just following the simple structure : **left = right**. If the problem has the same number of equations and variables, the solver should be able to give **a real solution** for the problem. The user can also include the functions for **thermodynamic properties** of pure fluids and humid air of CoolProp.

## Try laine
You can try the web app in: https://srnogueira.github.io/laine.

## Main features
1. Integrated parser from math.js : you can input equations in convenient ways;
2. Thermodynamic properties : you can use functions from CoolProp to solve problems;
3. Solver for non-linear system of equations : the problems should be solved just pressing a button;

## Limitations
1. There is no error messages (yet);
2. Problems including variables of different orders of magnitude or discontinuities may not convert;
3. Only one solution is displayed (which usually is fine for thermodynamic problems);
