"use-strict";

/*global Module, math*/

/**
 * A generic root-finding algorithm
 * @param {function} fun - function to find roots
 * @param {number} guess0 - a guess for the root
 */
function rootFind(fun, guess0) {
  // Setup default conditions
  let guess = [guess0, 0];
  let ans = [fun(guess0), 0];
  // Root-finding loop
  let count = 0;
  const tol = 1e-6;
  const maxCount = 100;
  const maxDivisions = 10;
  let deriv, count2, factor, change;
  do {
    // Determine derivative
    deriv = numericDerivative(fun, ans[0], guess[0]);
    // Second loop - Line search
    count2 = 0;
    factor = 2;
    do {
      factor /= 2; // Try again with smaller step
      // Test new guess
      change = (ans[0] / deriv) * factor;
      guess[1] = guess[0] - change;
      ans[1] = fun(guess[1]);
      // Max iterations condition
      count2++;
      if (count2 > maxDivisions) {
        break; // Prevent infinity loops
      }
    } while (Math.abs(ans[1]) > Math.abs(ans[0]));
    ans[0] = ans[1];
    guess[0] = guess[1];

    // Max iterations conditions
    count++;
    if (count > maxCount) {
      throw Error("Max. number of iterations");
    }
  } while (Math.abs(ans[0]) > tol && Math.abs(change) > tol);
  return guess[0];
}

/**
 * Calculates derivative using previous calculations
 * @param {function} fun - function to calculate derivative
 * @param {number} f - answer of function for x
 * @param {number} x - a value for function which were already calculated
 * @returns number
 */
function numericDerivative(fun, f, x) {
  const absDelta = 1e-4;
  const relDelta = 1e-4; // Change to avoid zeros
  let xNear, fNear, dfdx;

  // Check if x is zero
  xNear = x * (1 + relDelta);
  if (xNear - x === 0) {
    xNear = x + absDelta;
  }

  // Calculate derivative
  fNear = fun(xNear);
  dfdx = (fNear - f) / (xNear - x);

  return dfdx;
}

/*
  Nasa Glenn properties
*/

/**
 * Class to hold Nasa Gleen data
 * @class
 */
class NasaData {
  /**
   * Creates the data structure
   * @param {[number[]]} coeffs - Array of possible coefficients
   * @param {number[]} rangeT - Temperature limits
   * @param {number} MW - Molecular weight
   * @param {number} hf - Heat of formation
   */
  constructor(coeffs, rangeT, MW, hf) {
    this.coeffs = coeffs;
    this.rangeT = rangeT;
    this.MW = MW;
    this.hf = hf;
  }

  /**
   * Gets the coefficient for a temperature
   * @param {number} T - temperature
   * @returns - coefficient
   */
  getCoefs(T) {
    if (T < this.rangeT[0]) {
      throw Error(`Temperature out of the range ${this.rangeT}`);
    }
    for (let i = 1; i < this.rangeT.length; i++) {
      if (T <= this.rangeT[i]) {
        return this.coeffs[i - 1];
      }
    }
    throw Error(`Temperature out of the range ${this.rangeT}`);
  }
}

/**
 * Creates a default database for Nasa Glenn functions
 * @returns object
 */
function defaultDatabase() {
  const speciesNasa = {
    N2: new NasaData(
      [
        [
          2.210371497e4, -3.81846182e2, 6.08273836, -8.53091441e-3,
          1.384646189e-5, -9.62579362e-9, 2.519705809e-12, 7.10846086e2,
          -1.076003744e1,
        ],
        [
          5.87712406e5, -2.239249073e3, 6.06694922, -6.1396855e-4,
          1.491806679e-7, -1.923105485e-11, 1.061954386e-15, 1.283210415e4,
          -1.586640027e1,
        ],
      ],
      [200, 1e3, 6e3],
      28.0134,
      0
    ),
    O2: new NasaData(
      [
        [
          -3.42556342e4, 4.84700097e2, 1.119010961, 4.29388924e-3,
          -6.83630052e-7, -2.0233727e-9, 1.039040018e-12, -3.39145487e3,
          1.84969947e1,
        ],
        [
          -1.037939022e6, 2.344830282e3, 1.819732036, 1.267847582e-3,
          -2.188067988e-7, 2.053719572e-11, -8.19346705e-16, -1.689010929e4,
          1.738716506e1,
        ],
      ],
      [200, 1e3, 6e3],
      31.9988,
      0
    ),
    CO2: new NasaData(
      [
        [
          4.94365054e4, -6.26411601e2, 5.30172524, 2.503813816e-3,
          -2.127308728e-7, -7.68998878e-10, 2.849677801e-13, -4.52819846e4,
          -7.04827944,
        ],
        [
          1.176962419e5, -1.788791477e3, 8.29152319, -9.22315678e-5,
          4.86367688e-9, -1.891053312e-12, 6.33003659e-16, -3.90835059e4,
          -2.652669281e1,
        ],
      ],
      [200, 1e3, 6e3],
      44.0095,
      -393510
    ),
    CO: new NasaData(
      [
        [
          1.489045326e4, -2.922285939e2, 5.72452717, -8.17623503e-3,
          1.456903469e-5, -1.087746302e-8, 3.027941827e-12, -1.303131878e4,
          -7.85924135,
        ],
        [
          4.61919725e5, -1.944704863e3, 5.91671418, -5.66428283e-4,
          1.39881454e-7, -1.787680361e-11, 9.62093557e-16, -2.466261084e3,
          -1.387413108e1,
        ],
      ],
      [200, 1e3, 6e3],
      28.0101,
      -110535
    ),
    H2O: new NasaData(
      [
        [
          -3.94796083e4, 5.75573102e2, 9.31782653e-1, 7.22271286e-3,
          -7.34255737e-6, 4.95504349e-9, -1.336933246e-12, -3.30397431e4,
          1.724205775e1,
        ],
        [
          1.034972096e6, -2.412698562e3, 4.64611078, 2.291998307e-3,
          -6.83683048e-7, 9.42646893e-11, -4.82238053e-15, -1.384286509e4,
          -7.97814851,
        ],
      ],
      [200, 1e3, 6e3],
      18.01528,
      -241826
    ),
    OH: new NasaData(
      [
        [
          -1.99885899e3, 9.30013616e1, 3.050854229, 1.529529288e-3,
          -3.157890998e-6, 3.31544618e-9, -1.138762683e-12, 2.991214235e3,
          4.67411079,
        ],
        [
          1.017393379e6, -2.509957276e3, 5.11654786, 1.30529993e-4,
          -8.28432226e-8, 2.006475941e-11, -1.556993656e-15, 2.019640206e4,
          -1.101282337e1,
        ],
      ],
      [200, 1e3, 6e3],
      17.00734,
      37278
    ),
    H2: new NasaData(
      [
        [
          4.07832321e4, -8.00918604e2, 8.21470201, -1.269714457e-2,
          1.753605076e-5, -1.20286027e-8, 3.36809349e-12, 2.682484665e3,
          -3.043788844e1,
        ],
        [
          5.60812801e5, -8.37150474e2, 2.975364532, 1.252249124e-3,
          -3.74071619e-7, 5.9366252e-11, -3.6069941e-15, 5.33982441e3,
          -2.202774769,
        ],
      ],
      [200, 1e3, 6e3],
      2.01588,
      0
    ),
    H: new NasaData(
      [
        [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, 2.547370801e4, -4.46682853e-1],
        [
          6.07877425e1, -1.819354417e-1, 2.500211817, -1.226512864e-7,
          3.73287633e-11, -5.68774456e-15, 3.410210197e-19, 2.547486398e4,
          -4.48191777e-1,
        ],
      ],
      [200, 1e3, 6e3],
      1.00794,
      217999
    ),
    NO: new NasaData(
      [
        [
          -1.143916503e4, 1.536467592e2, 3.43146873, -2.668592368e-3,
          8.48139912e-6, -7.68511105e-9, 2.386797655e-12, 9.09821441e3,
          6.72872549,
        ],
        [
          2.239018716e5, -1.289651623e3, 5.43393603, -3.6560349e-4,
          9.88096645e-8, -1.416076856e-11, 9.38018462e-16, 1.750317656e4,
          -8.50166909,
        ],
      ],
      [200, 1e3, 6e3],
      30.0061,
      91271
    ),
    NO2: new NasaData(
      [
        [
          -5.64203878e4, 9.63308572e2, -2.434510974, 1.927760886e-2,
          -1.874559328e-5, 9.14549773e-9, -1.777647635e-12, -1.547925037e3,
          4.06785121e1,
        ],
        [
          7.21300157e5, -3.8326152e3, 1.113963285e1, -2.238062246e-3,
          6.54772343e-7, -7.6113359e-11, 3.32836105e-15, 2.502497403e4,
          -4.30513004e1,
        ],
      ],
      [200, 1e3, 6e3],
      46.0055,
      34193
    ),
    N: new NasaData(
      [
        [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, 5.61046378e4, 4.193905036],
        [
          8.87650138e4, -1.0712315e2, 2.362188287, 2.916720081e-4,
          -1.7295151e-7, 4.01265788e-11, -2.677227571e-15, 5.69735133e4,
          4.865231506,
        ],
      ],
      [200, 1e3, 6e3],
      14.0067,
      472680
    ),
    O: new NasaData(
      [
        [
          -7.9536113e3, 1.607177787e2, 1.966226438, 1.01367031e-3,
          -1.110415423e-6, 6.5175075e-10, -1.584779251e-13, 2.840362437e4,
          8.40424182,
        ],
        [
          2.619020262e5, -7.29872203e2, 3.31717727, -4.28133436e-4,
          1.036104594e-7, -9.43830433e-12, 2.725038297e-16, 3.39242806e4,
          -6.67958535e-1,
        ],
      ],
      [200, 1e3, 6e3],
      15.9994,
      249175
    ),
    CH4: new NasaData(
      [
        [
          -1.766850998e5, 2.78618102e3, -1.20257785e1, 3.91761929e-2,
          -3.61905443e-5, 2.026853043e-8, -4.97670549e-12, -2.33131436e4,
          8.90432275e1,
        ],
        [
          3.73004276e6, -1.383501485e4, 2.049107091e1, -1.961974759e-3,
          4.72731304e-7, -3.72881469e-11, 1.623737207e-15, 7.53206691e4,
          -1.219124889e2,
        ],
      ],
      [200, 1e3, 6e3],
      16.04246,
      -74600
    ),
    C2H4: new NasaData(
      [
        [
          -1.163605836e5, 2.55485151e3, -1.609746428e1, 6.62577932e-2,
          -7.88508186e-5, 5.12522482e-8, -1.370340031e-11, -6.17619107e3,
          1.093338343e2,
        ],
        [
          3.40876367e6, -1.374847903e4, 2.365898074e1, -2.423804419e-3,
          4.43139566e-7, -4.35268339e-11, 1.775410633e-15, 8.82042938e4,
          -1.371278108e2,
        ],
      ],
      [200, 1e3, 6e3],
      28.05316,
      52500
    ),
    C2H6: new NasaData(
      [
        [
          -1.862044161e5, 3.40619186e3, -1.951705092e1, 7.56583559e-2,
          -8.20417322e-5, 5.0611358e-8, -1.319281992e-11, -2.70293289e4,
          1.298140496e2,
        ],
        [
          5.02578213e6, -2.033022397e4, 3.32255293e1, -3.83670341e-3,
          7.23840586e-7, -7.3191825e-11, 3.065468699e-15, 1.11596395e5,
          -2.039410584e2,
        ],
      ],
      [200, 1e3, 6e3],
      30.06904,
      -83852
    ),
    C3H8: new NasaData(
      [
        [
          -2.433144337e5, 4.65627081e3, -2.939466091e1, 1.188952745e-1,
          -1.376308269e-4, 8.81482391e-8, -2.342987994e-11, -3.54033527e4,
          1.841749277e2,
        ],
        [
          6.42073168e6, -2.659791134e4, 4.53435684e1, -5.02066392e-3,
          9.47121694e-7, -9.57540523e-11, 4.00967288e-15, 1.455582459e5,
          -2.818374734e2,
        ],
      ],
      [200, 1e3, 6e3],
      44.09562,
      -104680
    ),
    C4H10: new NasaData(
      [
        [
          -3.17587254e5, 6.17633182e3, -3.89156212e1, 1.584654284e-1,
          -1.860050159e-4, 1.199676349e-7, -3.20167055e-11, -4.54036339e4,
          2.379488665e2,
        ],
        [
          7.68232245e6, -3.25605151e4, 5.73673275e1, -6.19791681e-3,
          1.180186048e-6, -1.221893698e-10, 5.25063525e-15, 1.77452656e5,
          -3.58791876e2,
        ],
      ],
      [200, 1e3, 6e3],
      58.1222,
      -125790
    ),
    C5H12: new NasaData(
      [
        [
          -2.768894625e5, 5.83428347e3, -3.61754148e1, 1.533339707e-1,
          -1.528395882e-4, 8.191092e-8, -1.792327902e-11, -4.66537525e4,
          2.265544053e2,
        ],
        [
          -2.530779286e6, -8.97259326e3, 4.53622326e1, -2.626989916e-3,
          3.135136419e-6, -5.31872894e-10, 2.886896868e-14, 1.484616529e4,
          -2.516550384e2,
        ],
      ],
      [200, 1e3, 6e3],
      72.14878,
      -146760
    ),
    C6H14: new NasaData(
      [
        [
          -5.8159267e5, 1.079097724e4, -6.63394703e1, 2.523715155e-1,
          -2.904344705e-4, 1.802201514e-7, -4.61722368e-11, -7.27154457e4,
          3.93828354e2,
        ],
        [
          -3.106625684e6, -7.34608792e3, 4.69413176e1, 1.693963977e-3,
          2.068996667e-6, -4.21214168e-10, 2.452345845e-14, 5.23750312e2,
          -2.549967718e2,
        ],
      ],
      [200, 1e3, 6e3],
      86.17536,
      -166920
    ),
    C7H16: new NasaData(
      [
        [
          -6.12743289e5, 1.184085437e4, -7.4871886e1, 2.918466052e-1,
          -3.41679549e-4, 2.159285269e-7, -5.65585273e-11, -8.01340894e4,
          4.40721332e2,
        ],
        [
          9.13563247e6, -3.92331969e4, 7.88978085e1, -4.65425193e-3,
          2.071774142e-6, -3.4425393e-10, 1.976834775e-14, 2.050708295e5,
          -4.85110402e2,
        ],
      ],
      [200, 1e3, 6e3],
      100.20194,
      -187780
    ),
    C8H18: new NasaData(
      [
        [
          -6.98664715e5, 1.338501096e4, -8.41516592e1, 3.27193666e-1,
          -3.77720959e-4, 2.339836988e-7, -6.01089265e-11, -9.02622325e4,
          4.93922214e2,
        ],
        [
          6.36540695e6, -3.105364657e4, 6.96916234e1, 1.048059637e-2,
          -4.12962195e-6, 5.54322632e-10, -2.651436499e-14, 1.500968785e5,
          -4.16989565e2,
        ],
      ],
      [200, 1e3, 6e3],
      114.22852,
      -208750
    ),
    C_s: new NasaData(
      [
        [
          1.13285676e5, -1.980421677e3, 1.365384188e1, -4.63609644e-2,
          1.021333011e-4, -1.082893179e-7, 4.47225886e-11, 8.94385976e3,
          -7.29582474e1,
        ],
        [
          3.35600441e5, -2.596528368e3, 6.94884191, -3.48483609e-3,
          1.844192445e-6, -5.05520596e-10, 5.75063901e-14, 1.398412456e4,
          -4.47718304e1,
        ],
        [
          2.023105106e5, -1.138235908e3, 3.7002795, -1.833807727e-4,
          6.34368325e-8, -7.06858948e-12, 3.33543598e-16, 5.84813485e3,
          -2.350925275e1,
        ],
      ],
      [200, 600, 2e3, 6e3],
      12.0107,
      0
    ),
    H2O_l: new NasaData(
      [
        [
          1.326371304e9, -2.448295388e7, 1.879428776e5, -7.67899505e2,
          1.761556813, -2.151167128e-3, 1.092570813e-6, 1.101760476e8,
          -9.77970097e5,
        ],
        [
          1.263631001e9, -1.680380249e7, 9.27823479e4, -2.72237395e2,
          4.47924376e-1, -3.91939743e-4, 1.425743266e-7, 8.11317688e7,
          -5.13441808e5,
        ],
      ],
      [273.15, 373.1507, 600],
      18.01528,
      -285830
    ),
    Ar: new NasaData(
      [
        [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, -7.45375e2, 4.37967491],
        [
          2.010538475e1, -5.99266107e-2, 2.500069401, -3.99214116e-8,
          1.20527214e-11, -1.819015576e-15, 1.078576636e-19, -7.44993961e2,
          4.37918011,
        ],
      ],
      [200, 1000, 6000],
      39.948,
      0
    ),
    Air: new NasaData(
      [
        [
          1.00995016e4, -1.96827561e2, 5.00915511, -5.76101373e-3,
          1.06685993e-5, -7.94029797e-9, 2.18523191e-12, -1.76796731e2,
          -3.921504225,
        ],
        [
          2.41521443e5, -1.2578746e3, 5.14455867, -2.13854179e-4, 7.06522784e-8,
          -1.07148349e-11, 6.57780015e-16, 6.46226319e3, -8.147411905,
        ],
      ],
      [200, 1000, 6000],
      28.9651159,
      -126
    ),
    C8H18_l: new NasaData(
      [
        [
          -1.683314826e7, 3.53261508e5, -2.967857531e3, 1.316703807e1,
          -3.18682241e-2, 4.07574801e-5, -2.153277285e-8, -1.588494258e6,
          1.521639569e4,
        ],
      ],
      [216.37, 400.0007],
      114.22852,
      -250260
    ),
    C7H16_l: new NasaData([], [297, 299], 100.20194, -224350),
    C5H12_l: new NasaData([], [297, 299], 72.14878, -173490),
    C4H10_l: new NasaData([], [297, 299], 58.1222, -150664),
    C3H8_l: new NasaData([], [297, 299], 44.09562, -128228),
  };
  return speciesNasa;
}
const speciesNasa = defaultDatabase();

/**
 * Specific molar enthalpy - Nasa Glenn
 * @param {number} T - Temperature
 * @param {number[]} a - Coefficients for T and substance
 * @returns number
 */
function nasaH(T, a) {
  const R = 8.31451;
  let h =
    R *
    T *
    (-a[0] / (T * T) +
      (a[1] * Math.log(T)) / T +
      a[2] +
      (a[3] * T) / 2 +
      (a[4] * (T * T)) / 3 +
      (a[5] * (T * T * T)) / 4 +
      (a[6] * (T * T * T * T)) / 5 +
      a[7] / T);
  return h;
}

/**
 * Specific molar entropy - Nasa Glenn
 * @param {number} T - Temperature
 * @param {number[]} a - Coefficients for T and substance
 * @returns number
 */
function nasaS(T, a) {
  const R = 8.31451;
  let s =
    R *
    (-a[0] / (T * T) / 2 +
      -a[1] / T +
      a[2] * Math.log(T) +
      a[3] * T +
      (a[4] * (T * T)) / 2 +
      (a[5] * (T * T * T)) / 3 +
      (a[6] * (T * T * T * T)) / 4 +
      a[8]);
  return s;
}

/**
 * Specific heat capacity at constant pressure - Nasa Glenn
 * @param {number} T - Temperature
 * @param {number[]} a - Coefficients for T and substance
 * @returns number
 */
function nasaCp(T, a) {
  const R = 8.31451;
  let cp =
    R *
    (a[0] / (T * T) +
      a[1] / T +
      a[2] +
      a[3] * T +
      a[4] * T * T +
      a[5] * T * T * T +
      a[6] * T * T * T * T);
  return cp;
}

/**
 * Nasa Gleen functions for temperature
 * @param {string} prop - output property (e.g., MW, H0molar,etc.)
 * @param {number} T - temperature in Kelvin
 * @param {string} subs - name of the substance in the database
 * @returns number
 */
function nasaFun(prop, xType, x, subs) {
  // Constants
  const MW = speciesNasa[subs].MW;
  let a, T;
  if (xType !== "T") {
    // Find T
    let fun = (i) => nasaFun(xType, "T", i, subs) - x;
    T = rootFind(fun, 500.0); // This guess may not be the best
    if (prop === "T") {
      return T;
    }
  } else {
    T = x;
  }

  try {
    a = speciesNasa[subs].getCoefs(T);
  } catch {
    return NaN;
  }

  switch (prop) {
    case "H0molar":
      if (a == undefined) {
        // For liquids on reference
        return speciesNasa[subs].hf;
      } else {
        return nasaH(T, a);
      }

    case "S0molar":
      return nasaS(T, a); 

    case "Cp0molar":
      return nasaCp(T, a);

    case "H0":
      if (a == undefined) {
        // For liquids on reference
        return (speciesNasa[subs].hf / MW) * 1e3;
      } else {
        return (nasaH(T, a) / MW) * 1e3;
      }

    case "S0":
      return (nasaS(T, a) / MW) * 1e3;

    case "Cp0":
      return (nasaCp(T, a) / MW) * 1e3;

    case "G0molar":
      return nasaH(T, a) - T * nasaS(T, a);

    case "G0":
      return ((nasaH(T, a) - T * nasaS(T, a)) / MW) * 1e3;

    default:
      throw "Undefined property";
  }
}

function nasa1Fun(prop, subs) {
  // Constants
  const MW = speciesNasa[subs].MW;
  const hf = speciesNasa[subs].hf;

  switch (prop) {
    case "M":
      return MW / 1e3;

    case "Rbar":
      return 8.31451 / MW;

    case "Hfmolar":
      return hf;

    case "Hf":
      return (hf / MW) * 1e3;

    default:
      throw "Undefined property";
  }
}

/**
 * Compressible flow - isentropic functions wrapper
 */
 function comp1D_fun(prop, xType, x, yType, y, subs) {
  // Select T and M from inputs
  let inputs = new Object(); // Empty object
  inputs[xType] = x;
  inputs[yType] = y;

  if (inputs["gamma"] == undefined){
    if (inputs["T"] == undefined){
      throw "T or gamma should be an input"
    } else {
      const R = 8.31451;
      const cp = nasaFun("Cp0molar","T",inputs["T"],subs);
      inputs["gamma"] = cp/(cp-R);
    }
  } 

  const gamma = inputs["gamma"];

  if (inputs["M"] == undefined){
    let isX = (xType != "T" && xType != "gamma") ? true : false;
    let given = isX ? xType : yType;
    let value = isX ? x : y;
    // Find T
    let fun = (i) => comp1D_fun(given, "M", i, "gamma", gamma, subs) - value;
    let guess;
    if (given == "A/A*(sub)"){
      guess = 0.1;
    } else if (guess == "A/A*(sup)"){
      guess = 2;
    } else{
      guess = 1;
    }
    inputs["M"] = rootFind(fun, guess); // This guess may not be the best
  }
  const M = inputs["M"];

  // Find property
  switch (prop) {
    case "gamma":
      return gamma;
    case "M":
      return M;
    case "T/T0":
      return Math.pow(1+(gamma-1)/2*(M*M),-1);
    case "P/P0":
      return Math.pow(1+(gamma-1)/2*(M*M),-gamma/(gamma-1));
    case "rho/rho0":
      return Math.pow(1+(gamma-1)/2*(M*M),-1/(gamma-1));
    case "T/T*":
      return (gamma+1)/(2+(gamma-1)*M*M)
    case "P/P*":
      return Math.pow((2+(gamma-1)*M*M)/(gamma+1),-gamma/(gamma-1));
    case "rho/rho*":
      return Math.pow((2+(gamma-1)*M*M)/(gamma+1),-1/(gamma-1));
    case "T*/T0":
      return 2/(gamma+1);
    case "P*/P0":
      return Math.pow(2/(gamma+1),gamma/(gamma-1));
    case "rho*/rho0":
      return Math.pow(2/(gamma+1),1/(gamma-1));
    case "A/A*":
    case "A/A*(sub)":
    case "A/A*(sup)":
          return 1/M*Math.pow(2/(gamma+1)*(1+(gamma-1)/2*(M*M)),(gamma+1)/(2*(gamma-1)));
    case "PA/P0A*":
      {
        let PP0 = Math.pow(1+(gamma-1)/2*(M*M),-gamma/(gamma-1));
        let AAx = 1/M*Math.pow(2/(gamma+1)*(1+(gamma-1)/2*(M*M)),(gamma+1)/(2*(gamma-1)));
        return PP0*AAx;
      }
    default:
      throw "Undefined property";
  }
}

/*
  Lee-Kesler equation of state
*/

/**
 * Lee-Kesler constants
 * @returns object
 */
function lkConstants() {
  const lk = {
    b: [0.1181193, 0.265728, 0.15479, 0.030323],
    c: [0.0236744, 0.0186984, 0.0, 0.042724],
    d: [0.155488e-4, 0.623689e-4],
    beta: 0.65392,
    gamma: 0.060167,
  };
  return lk;
}

/**
 * Reduced pressure for saturation state
 * @param {number} Tr - Reduced temperature
 * @returns number
 */
function Pr_sat(Tr) {
  const omega = 0; // Simple fluid
  const ans =
    5.92714 -
    6.09648 / Tr -
    1.28862 * Math.log(Tr) +
    0.169347 * Tr * Tr * Tr * Tr * Tr * Tr +
    omega *
      (15.2518 -
        15.6875 / Tr -
        13.4721 * Math.log(Tr) +
        0.43577 * Tr * Tr * Tr * Tr * Tr * Tr);
  return Math.exp(ans);
}

/**
 * Compressibility factor for Tr and Vr
 * @param {number} Tr - Reduced temperature
 * @param {number} Vr - Reduced volume
 * @returns number
 */
function Z_TrVr(Tr, Vr) {
  // Constants
  const lk = lkConstants();

  // Auxiliary
  const B =
    lk.b[0] - lk.b[1] / Tr - lk.b[2] / (Tr * Tr) - lk.b[3] / (Tr * Tr * Tr);
  const C = lk.c[0] - lk.c[1] / Tr + lk.c[2] / (Tr * Tr * Tr);
  const D = lk.d[0] + lk.d[1] / Tr;

  // Function
  const Z =
    1 +
    B / Vr +
    C / (Vr * Vr) +
    D / (Vr * Vr * Vr * Vr * Vr) +
    (lk.c[3] / (Tr * Tr * Tr * Vr * Vr)) *
      (lk.beta + lk.gamma / (Vr * Vr)) *
      Math.exp(-lk.gamma / (Vr * Vr));
  return Z;
}

/**
 * Enthalpy of departure for Tr and Vr
 * @param {number} Tr - Reduced pressure
 * @param {number} Vr - Reduced volume
 * @returns number
 */
function deltaH_TrVr(Tr, Vr) {
  // Constants
  const lk = lkConstants();
  const Z = Z_TrVr(Tr, Vr);
  const E =
    (lk.c[3] / (2 * Tr * Tr * Tr * lk.gamma)) *
    (lk.beta +
      1 -
      (lk.beta + 1 + lk.gamma / (Vr * Vr)) * Math.exp(-lk.gamma / (Vr * Vr)));

  const deltaH =
    Tr *
    (Z -
      1 -
      (lk.b[1] + (2 * lk.b[2]) / Tr + (3 * lk.b[3]) / (Tr * Tr)) / (Tr * Vr) -
      (lk.c[1] - (3 * lk.c[2]) / (Tr * Tr)) / (2 * Tr * Vr * Vr) +
      lk.d[1] / (5 * Tr * Vr * Vr * Vr * Vr * Vr) +
      3 * E);
  return -deltaH;
}

/**
 * Entropy of departure for Tr and Vr
 * @param {number} Tr - Reduced temperature
 * @param {number} Vr - Reduced volume
 * @returns number
 */
function deltaSt_TrVr(Tr, Vr) {
  // Constants
  const lk = lkConstants();
  const Z = Z_TrVr(Tr, Vr);
  const E =
    (lk.c[3] / (2 * Tr * Tr * Tr * lk.gamma)) *
    (lk.beta +
      1 -
      (lk.beta + 1 + lk.gamma / (Vr * Vr)) * Math.exp(-lk.gamma / (Vr * Vr)));

  const deltaSt =
    Math.log(Z) -
    (lk.b[0] + lk.b[2] / (Tr * Tr) + (2 * lk.b[3]) / (Tr * Tr * Tr)) / Vr -
    (lk.c[0] - (2 * lk.c[2]) / (Tr * Tr * Tr)) / (2 * Vr * Vr) -
    lk.d[0] / (5 * Vr * Vr * Vr * Vr * Vr) +
    2 * E;
  return -deltaSt;
}

/**
 * Fugacity for Tr and Vr
 * @param {number} Tr - Reduced temperature
 * @param {number} Vr - Reduced volume
 * @returns number
 */
function fP_TrVr(Tr, Vr) {
  // Constants
  const lk = lkConstants();
  const Z = Z_TrVr(Tr, Vr);
  const B =
    lk.b[0] - lk.b[1] / Tr - lk.b[2] / (Tr * Tr) - lk.b[3] / (Tr * Tr * Tr);
  const C = lk.c[0] - lk.c[1] / Tr + lk.c[2] / (Tr * Tr * Tr);
  const D = lk.d[0] + lk.d[1] / Tr;
  const E =
    (lk.c[3] / (2 * Tr * Tr * Tr * lk.gamma)) *
    (lk.beta +
      1 -
      (lk.beta + 1 + lk.gamma / (Vr * Vr)) * Math.exp(-lk.gamma / (Vr * Vr)));

  const lnfP =
    Z - 1 - Math.log(Z) + B / Vr + C / (2 * Vr * Vr) + D / (5 * Vr ** 5) + E;
  return Math.exp(lnfP);
}

/**
 * Calculates a Z for Tr,Vr,Pr or Q pairs
 * @param {string} xType - Input x type
 * @param {number} x - Value of input x
 * @param {string} yType - Input y type
 * @param {number} y - Value of input y
 * @returns number
 */
function lkWrapper(prop, xType, x, yType, y) {
  // Type of inputs
  let Tr, Vr, Pr, Q, ans;
  let types = [xType, yType];
  let values = [x, y];
  for (let i = 0; i < 2; i++) {
    switch (types[i]) {
      case "Tr":
        Tr = values[i];
        break;
      case "Pr":
        Pr = values[i];
        break;
      case "Vr":
        Vr = values[i];
        break;
      case "Q":
        Q = values[i];
        break;
      default:
        throw Error("Invalid parameter on function Z");
    }
  }

  // Find property function which uses Tr and Vr
  let propFun;
  switch (prop) {
    case "Z":
      propFun = Z_TrVr;
      break;
    case "dh":
      propFun = deltaH_TrVr;
      break;
    case "ds":
      propFun = deltaSt_TrVr;
      break;
    case "fP":
      propFun = fP_TrVr;
      break;
    case "Pr":
      propFun = (Tr, Vr) => (Z_TrVr(Tr, Vr) * Tr) / Vr;
      break;
    case "Vr":
      if (Vr !== undefined) {
        return Vr;
      } else {
        propFun = (Tr, Vr) => Vr;
      }
      break;
    case "Tr":
      if (Tr !== undefined) {
        return Tr;
      } else {
        propFun = (Tr) => Tr; // removed
      }
      break;
    default:
      throw Error("Property not found");
  }

  // Calculate property
  let fun;
  if (Tr !== undefined) {
    // Domain 0.3<Tr<4
    if (Vr) {
      ans = propFun(Tr, Vr);
    } else if (Pr !== undefined) {
      // Z(Tr,Vr)-Pr*Vr/Tr = 0
      fun = (x) => Z_TrVr(Tr, x) - (Pr * x) / Tr;
      let Psat = Pr_sat(Tr);
      let first_guess;
      if (Pr <= Psat) {
        first_guess = Tr / Pr;
      } else {
        first_guess = 0.1;
      }
      Vr = rootFind(fun, first_guess);
      ans = propFun(Tr, Vr);
    } else if (Q !== undefined) {
      Pr = Pr_sat(Tr);
      if (Q === 1) {
        ans = lkWrapper(prop, "Tr", Tr, "Pr", Pr);
      } else if (Q === 0) {
        ans = lkWrapper(prop, "Tr", Tr, "Pr", Pr + 1e-5);
      } else {
        ans =
          lkWrapper(prop, "Tr", Tr, "Pr", Pr) * Q +
          lkWrapper(prop, "Tr", Tr, "Pr", Pr + 1e-5) * (1 - Q);
      }
    }
  } else if (Pr !== undefined) {
    // Domain 0.01<Pr<10
    if (Vr !== undefined) {
      // Zr(x,Vr) - Pr*Vr/x = 0
      fun = (x) => Z_TrVr(x, Vr) - (Pr * Vr) / x;
      Tr = rootFind(fun, 1.0); // Not tested
      ans = propFun(Tr, Vr);
    } else if (Q !== undefined) {
      fun = (x) => Pr_sat(x) - Pr;
      Tr = rootFind(fun, 1.0);
      if (Q === 1) {
        ans = lkWrapper(prop, "Tr", Tr, "Pr", Pr);
      } else if (Q === 0) {
        ans = lkWrapper(prop, "Tr", Tr, "Pr", Pr + 1e-5);
      } else {
        ans =
          lkWrapper(prop, "Tr", Tr, "Pr", Pr) * Q +
          lkWrapper(prop, "Tr", Tr, "Pr", Pr + 1e-5) * (1 - Q);
      }
    }
  } else if (Vr !== undefined) {
    if (Q !== undefined) {
      // f(Tr,Q) - sat(Tr)*Vr/Tr = 0
      fun = (x) => lkWrapper("Z", "Tr", x, "Q", Q) - (Pr_sat(x) * Vr) / x;
      Tr = rootFind(fun, 1.0);
      ans = lkWrapper(Tr, Vr);
    }
  }
  return ans;
}

// Wrapping CoolProp functions
function w_Props1SI(prop, subs) {
  // Adding a Rbar property
  if (prop == "Rbar") {
    return 8.314462618 / (Module.Props1SI("M", subs) * 1e3);
  } else {
    return Module.Props1SI(prop, subs);
  }
}

// Saturation pressures - ASHRAE
function ASHRAE_Psat(T) {
  let C;
  if (T < 273.15) {
    C = [
      -5.6745359e3, 6.3925247, -9.677843e-3, 6.2215701e-7, 2.0747825e-9,
      -9.484024e-13, 4.1635019,
    ];
  } else {
    C = [
      -5.8002206e3, 1.3914993, -4.8640239e-2, 4.1764768e-5, -1.4452093e-8, 0,
      6.5459673,
    ];
  }
  let lnP =
    C[0] / T +
    C[1] +
    C[2] * T +
    C[3] * T ** 2 +
    C[4] * T ** 3 +
    C[5] * T ** 4 +
    C[6] * math.log(T);
  return math.exp(lnP);
}

// Wrapping HAPropsSI
function w_HAPropsSI(prop, xType, x, yType, y, zType, z) {
  // Create a object to verify inputs
  let inputs = {};
  inputs[xType] = x;
  inputs[yType] = y;
  inputs[zType] = z;

  // Use special routines to bypass CoolProp issue
  if (inputs["R"]) {
    if (inputs["W"] && inputs["P"]) {
      let MW_water = 0.018015268;
      let MW_air = 0.02896546;
      let Y = 1 / (MW_water / MW_air / inputs["W"] + 1);
      return Module.HAPropsSI(prop, "R", inputs["R"], "P", inputs["P"], "Y", Y);
    } else if (inputs["D"] && inputs["P"]) {
      // Here we approximate the P_sat in air as P_sat of pure water (very close, but not the same)
      let P_h2o = ASHRAE_Psat(inputs["D"]); // because PropsSI does not work below 0°C
      let Y = P_h2o / inputs["P"];
      return Module.HAPropsSI(prop, "R", inputs["R"], "P", inputs["P"], "Y", Y);
    }
  }

  // Esle return normal HAPropsSI
  return Module.HAPropsSI(prop, xType, x, yType, y, zType, z);
}

// Import functions to math.js parser
math.import({
  // PropsSI
  PropsSI: function (prop, xType, x, yType, y, subs) {
    return Module.PropsSI(prop, xType, x, yType, y, subs);
  },
  Props1SI: function (prop, subs) {
    return w_Props1SI(prop, subs);
  },
  // HAPropsSI
  HAPropsSI: function (prop, xType, x, yType, y, zType, z) {
    return w_HAPropsSI(prop, xType, x, yType, y, zType, z);
  },
  // Nasa Glenn
  NasaSI: function (prop, xType, x, subs) {
    return nasaFun(prop, xType, x, subs);
  },
  // Nasa Glenn trivials
  Nasa1SI: function (prop, subs) {
    return nasa1Fun(prop, subs);
  },
  // Compressible flow
  Comp1D: function (prop,xType,x,yType,y,subs) {
    return comp1D_fun(prop, xType, x, yType, y, subs);
  },
  // LeeKesler
  LeeKesler: function (prop, xType, x, yType, y) {
    return lkWrapper(prop, xType, x, yType, y);
  },
});
