# laine
laine solves nonlinear equations using the simultaneous solution approach. It is meant to be intuitive and requires no background in computer programming. [Try it here!](https://laine.com.br).

## Quick start
1. Write a set of **equations** which represents the problem. For instance: 

        x*y=3 
        x^2+y^2 = 10

2. Click **Solve**.
3. The solution should appear on the screen.

        x = 1
        y = 3

That's it. You just have to write equations and laine should be able to solve them for you.

## Syntax rules
An equation should be written as: **left expression = right expression**. For example:

    T = 25+273.15

The same equation could have been written as:

    25+273.15 = T

Thus, you can write equations in the most convenient way for you.

### Operation symbols
Operation | Symbol
------------ | -------------
Sum | +
Subtraction | -
Multiplication | *
Division | /
Power | ^

### Some conventions:
- laine uses dot ( . ) as a decimal separator.

        half  = 0.5

- Strings should be input between pairs of quotation marks ( " or ' ).
 
        Variable = "word"

- If you want to insert more than one equation in a line, just separate them by using a semicolon ( ; ).

        T = 300 # K ; P = 101325 # Pa

- (In Reports) Variables with Greek letters can be inserted with an dollar sign ($).

        $DeltaV = 30 # m³

- (In Reports) If is just a Greek letter, than it is not necessary to put a dollar sign:

        rho_water = 999 # kg/m³

## Using functions 

laine uses [math.js](https://mathjs.org/) to parse equations, therefore it inherited the math function of this library. In the following table there are some examples, the complete list can be seen [here](https://mathjs.org/docs/reference/functions.html).

Function | Syntax
------------ | -------------
exponent | exp(x)
logarithm (base e) | log(x)
logarithm (base 10) | log10(x)
cosine | cos(x)
sine | sin(x)
tangent | tan(x)

Furthermore, laine also has some thermodynamic functions that you can access in **Functions**:

- Pure substances (PropsSI): thermodynamic properties for pure substances using the [CoolProp library](http://www.coolprop.org/).

- Humid air (HAPropsSI): humid air properties also using the [CoolProp library](http://www.coolprop.org/).

- Reactions (NasaSI): properties of some species in the standard state using [Nasa Gleen coefficients](https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20020085330.pdf).

- Lee-Kesler (LeeKesler): the deviation from ideal gas properties for simple fluids. Based on the original publication by
  [Lee and Kesler (1975)](https://aiche.onlinelibrary.wiley.com/doi/10.1002/aic.690210313).

### User-defined functions
laine also supports user-defined functions by using the syntax: **function(var1,var2,...) = expression**. For example:

    T_kelvin(T_celsius) = T_celsius+273.15

## Comments

Since it is easy forget what an equation means, you can input a comment by inserting '#'. Unfortunately laine does not have a multiline comment option (yet).
    
    # Environmental pressure
    P = 101325 # Pa 

In the 'Report' mode, laine renders the comments and equations as markdown and Latex using [showdown](http://showdownjs.com/) and [MathJax](https://www.mathjax.org/), respectivelly. Thus, you can write sections, emphasis and LaTeX (equations) if necessary. 

        ## Header 1
        ### Header 2
        # This is an inline LaTeX equation \(W = \int P dv \), here markdown is disabled
        # $$ a^2 = b^2 + c^2 $$
        # Here is a _markdown emphasis_

However, we disabled markdown rendering in lines that you use equations to avoid errors.

## User guesses

In some cases, laine requires that the user provides an initial guess for a certain variable. An initial guess can be declared like equations but ending with a question mark (?). For example:

        x = 3 ?

This helps laine to converge faster or to find a specific solution.

## Parametric analysis
A problem consists in a set of equations, which can only be solved for a unique solution if **the number of equations is equal to the number of variables**.

Differently from solving a problem, a Parametric Analysis varies a certain variable (x), records the solution for another variable (y) and plot the results. Thus, a Parametric analysis requires that the set of equations has **one degree of freedom**. For instance:

    y = 2*x

In this problem, there are 2 variables (y,x) and one equation. Then you can vary one of the two variables (e.g., x) and plot the results (e.g., y vs. x).

## Property plots
In this option, laine scans the code for calls of the function PropsSI and returns a list of states that can be plotted in a diagram of thermodynamic properties (e.g., T-s, P-h, P-v).

laine automatically checks if sequential states have a certain property in common and draws the process accordingly. For instance, an isentropic process in a P-v diagram is represented by a curve of isentropic points and not a simple straight line. 
