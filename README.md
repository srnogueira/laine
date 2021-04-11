# laine
laine is designed to solve nonlinear systems of equations using the simultaneous solution approach. It is meant to be very intuitive and requires no background in computer programming. [Try it here!](https://srnogueira.github.io/laine).

## Quick start
1. Write a set of **equations** which represents the problem. For instance: 

        x*y=3 
        x^2+y^2 = 10

2. Click in **Solve**.
3. The solution should appear on the screen.

        x = 1
        y = 3

That's it. You just have to write equations and laine should be able to solve it for you.

## Syntax rules
An equation should be written as: **left expression = right expression**. For example:

    T = 25+273.15

is a very simple equation, which states a constant. The same equation could have been written as:

    25+273.15 = T

Although you should not write in this way, laine can understand it if necessary. This means that you can just write equations in the most convenient way for you.

### Some conventions:
- Simple math operations are described by \+ (sum), \- (subtraction), \/ (division), \* (multiplication), \^ (power).
- laine uses '.' as a decimal separator.
- Strings (not variables) should be input between pairs of " or '. For example:
 
        Variable = "word"

- If you want to insert more than one equation in a line, just separate them by using a ';'. E.g. T = 300 ; P = 101325


## Using functions 

laine has some thermodynamic functions that you can access these by clicking in **Functions**:

- Pure substances (PropsSI): a function to estimate thermodynamic properties for
  pure substances using the [CoolProp library](http://www.coolprop.org/).  

- Humid air (HAPropsSI): a function to estimate humid air properties also using
  the [CoolProp library](http://www.coolprop.org/).

- Reactions (NasaSI): a function to estimate properties of some species in the
  standard state using [Nasa Gleen coefficients](https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20020085330.pdf). Ideal to estimate
  enthalpy of combustion, reactions and chemical equilibrium.

- Lee-Kesler (LeeKesler): a function to estimate the deviation from ideal gas
  properties for simple fluids. Based on the [original publication by
  Lee and Kesler (1975)](https://aiche.onlinelibrary.wiley.com/doi/10.1002/aic.690210313).

laine also has some math functions inherited from [math.js](https://mathjs.org/docs/reference/functions.html)
(e.g. abs(),sin(),cos()).

### User-defined functions
laine also supports user-defined functions by using the syntax: **function(var1,var2,...) = expression**. For example:

    Tkelvin(Tcelsius) = Tcelsius+273.15

creates a function Tkelvin, which accepts one variable and returns the its sum with 273.15. 

## Comments

Since it is easy forget what an equation means, you can input a comment by inserting '#'.

    P = 101325 # Environmental pressure in Pa (this is a comment) 

## User guesses

laine uses a Newton-Raphson algorithm to solve nonlinear systems of equations. This process requires a initial guess, which is generated internally by laine. However, some difficult problem or some specific solutions may require that you hard code a guess for some specific variables. Initial guesses can be declared like equations but ending with a question mark (?). For example:

        x = 3 ?

sets the initial guess for x as 3. This can help laine to converge faster and to a specific solution.

## Problems vs. plots
A problem consists in a set of equations, which can only be solved for a unique solution if **the number of equations is equal to the number of variables**.

Differently from solving a problem, a Parametric Analysis requires that the set of equations has **one degree of freedom**. For instance:

    y = 2*x

In this problem, there are 2 variables (y,x) and one equation. Then you can vary one of the two variables (e.g. x) and plot the results (e.g. y vs. x).

Another type of plot is called Property Plot. In this option, laine scans the code for calls of the function PropsSI and returns a list of states that can be plotted in different diagrams (e.g. T-s, P-h, P-v).
