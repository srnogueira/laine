# Description
laine is a web app designed to model thermodynamic problems and solve equations using the simultaneous solution approach.


It is meant to be very intuitive and requires no background in computer programming. [Try it here!](https://srnogueira.github.io/laine).


## Basics
1. In the text box, write a set of equations which represents the problem to be model.
2. Click in "Solve (F2)" or press F2.
3. The solution (or a error message) should appear on the screen.


That's it. You just have to write equations and laine should be able to solve it for you.


## Writing equations
An equation follows the simple structure: **"left expression = right expression"**. For example:


    T = 25+273.15


is a very simple equation, which states some constant (e.g. temperature). The same equation could be input as:


    25+273.15 = T


Although you probably will not write in this way, laine would
understand it if necessary. This means that you can just write
equations in the most convenient way and not in a specific manner
(e.g. "expression = 0").

Some conventions:
- The math operations are probably the same as the ones in your computer calculator (\+,\-,\/,\*,\^).
- laine uses '.' as decimal separator.
- Strings (not variables) should be input between pairs of " or '. E.g. Variable = "word".
- If you want to insert more than one equation in a line, just separate them by using a ';'. E.g. T = 300 ; P = 101325


## Using functions 


laine has some thermodynamic functions to help you to model your
problem. You can access these functions by clicking in "Functions" in
the menu and selecting one option:

- Pure substances: a function to estimate thermodynamic properties for
  pure substances using the CoolProp library.  

- Humid air: a function to estimate humid air properties also using
  the CoolProp library.

- Reactions: a function to estimate properties of some species in the
  standard state using Nasa Gleen coefficients. Ideal to estimate
  enthalpy of combustion, reactions and chemical equilibrium.

- Lee-Kesler: a function to estimate the deviation from ideal gas
  properties for simple fluids. Based on the original publication by
  Lee and Kesler in 1975.


If necessary, laine has some math functions inherited from math.js
(e.g. abs(),sin(),cos()) or you can create user-defined functions. For example:


    Tkelvin(Tcelsius) = Tcelsius+273.15


The structure is similar to equations, but differs in the declaration
of variables between parenthesis.


## Writing and solving problems


A problem consists in a set of equations, which can only be solved for
a unique solution if **the number of equations is equal to the
number of variables**.


Since it is easy forget what an equation means, you can input a comment by inserting '#'.


    P = 101325 # Environmental pressure in Pa (this is a comment) 


To solve a problem, just click the "Solve (F2)" buttom or press F2,
the solution should appear at the right side or below the text box.


laine has also an option to render the equations and solution for a
report, just click "Report (F4)" or F4 to see the pretty results.


## Plotting


Differently from solving a problem, plotting requires that the set of
equations have one degree of freedom. For instance:


    y = 2*x


In this problem, there are 2 variables (y,x) and one equation. Then
you can vary one of the two variables (e.g. x) and plot the results
(e.g. y vs. x)


The simplest way to change between a problem and a plot is to
(un)comment an equation.
