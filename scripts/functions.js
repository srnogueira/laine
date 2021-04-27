/*
  Properties for selected species
  Reference: NASA Glenn
*/

// Selected species: 200-1E3K ; 1E3-6E3K 
const nasaGlenn = {
    N2:[[2.210371497E+04,-3.818461820E+02,6.082738360E+00,
         -8.530914410E-03,1.384646189E-05,-9.625793620E-09,
         2.519705809E-12,7.108460860E+02,-1.076003744E+01],
	[5.877124060E+05,-2.239249073E+03,6.066949220E+00,
	 -6.139685500E-04,1.491806679E-07,-1.923105485E-11,
	 1.061954386E-15,1.283210415E+04,-1.586640027E+01]],
    O2:[[-3.425563420E+04,4.847000970E+02,1.119010961E+00,
         4.293889240E-03,-6.836300520E-07,-2.023372700E-09,
         1.039040018E-12,-3.391454870E+03,1.849699470E+01],
	[-1.037939022E+06,2.344830282E+03,1.819732036E+00,
	 1.267847582E-03,-2.188067988E-07,2.053719572E-11,
	 -8.193467050E-16,-1.689010929E+04,1.738716506E+01]],
    CO2:[[4.943650540E+04,-6.264116010E+02,5.301725240E+00,
	  2.503813816E-03,-2.127308728E-07,-7.689988780E-10,
	  2.849677801E-13,-4.528198460E+04,-7.048279440E+00],
	 [1.176962419E+05,-1.788791477E+03,8.291523190E+00,
	  -9.223156780E-05,4.863676880E-09,-1.891053312E-12,
	  6.330036590E-16,-3.908350590E+04,-2.652669281E+01]],
    CO:[[1.489045326E+04,-2.922285939E+02,5.724527170E+00,
	 -8.176235030E-03,1.456903469E-05,-1.087746302E-08,
	 3.027941827E-12,-1.303131878E+04,-7.859241350E+00],
	[4.619197250E+05,-1.944704863E+03,5.916714180E+00,
	 -5.664282830E-04,1.398814540E-07,-1.787680361E-11,
	 9.620935570E-16,-2.466261084E+03,-1.387413108E+01]],
    H2O:[[-3.947960830E+04,5.755731020E+02,9.317826530E-01,
	  7.222712860E-03,-7.342557370E-06,4.955043490E-09,
	  -1.336933246E-12,-3.303974310E+04,1.724205775E+01],
	 [1.034972096E+06,-2.412698562E+03,4.646110780E+00,
	  2.291998307E-03,-6.836830480E-07,9.426468930E-11,
	  -4.822380530E-15,-1.384286509E+04,-7.978148510E+00]],
    OH:[[-1.998858990E+03,9.300136160E+01,3.050854229E+00,
	 1.529529288E-03,-3.157890998E-06,3.315446180E-09,
	 -1.138762683E-12,2.991214235E+03,4.674110790E+00],
	[1.017393379E+06,-2.509957276E+03,5.116547860E+00,
	 1.305299930E-04,-8.284322260E-08,2.006475941E-11,
	 -1.556993656E-15,2.019640206E+04,-1.101282337E+01]],
    H2:[[4.078323210E+04,-8.009186040E+02,8.214702010E+00,
	 -1.269714457E-02,1.753605076E-05,-1.202860270E-08,
	 3.368093490E-12,2.682484665E+03,-3.043788844E+01],
	[5.608128010E+05,-8.371504740E+02,2.975364532E+00,
	 1.252249124E-03,-3.740716190E-07,5.936625200E-11,
	 -3.606994100E-15,5.339824410E+03,-2.202774769E+00]],
    H:[[0.000000000E+00,0.000000000E+00,2.500000000E+00,
	0.000000000E+00,0.000000000E+00,0.000000000E+00,
	0.000000000E+00,2.547370801E+04,-4.466828530E-01],
       [6.078774250E+01,-1.819354417E-01,2.500211817E+00,
	-1.226512864E-07,3.732876330E-11,-5.687744560E-15,
	3.410210197E-19,2.547486398E+04,-4.481917770E-01]],
    NO:[[-1.143916503E+04,1.536467592E+02,3.431468730E+00,
	 -2.668592368E-03,8.481399120E-06,-7.685111050E-09,
	 2.386797655E-12,9.098214410E+03,6.728725490E+00],
	[2.239018716E+05,-1.289651623E+03,5.433936030E+00,
	 -3.656034900E-04,9.880966450E-08,-1.416076856E-11,
	 9.380184620E-16,1.750317656E+04,-8.501669090E+00]],
    NO2:[[-5.642038780E+04,9.633085720E+02,-2.434510974E+00,
	  1.927760886E-02,-1.874559328E-05,9.145497730E-09,
	  -1.777647635E-12,-1.547925037E+03,4.067851210E+01],
	 [7.213001570E+05,-3.832615200E+03,1.113963285E+01,
	  -2.238062246E-03,6.547723430E-07,-7.611335900E-11,
	  3.328361050E-15,2.502497403E+04,-4.305130040E+01]],
    N:[[0.000000000E+00,0.000000000E+00,2.500000000E+00,
	0.000000000E+00,0.000000000E+00,0.000000000E+00,
	0.000000000E+00,5.610463780E+04,4.193905036E+00],
       [8.876501380E+04,-1.071231500E+02,2.362188287E+00,
	2.916720081E-04,-1.729515100E-07,4.012657880E-11,
	-2.677227571E-15,5.697351330E+04,4.865231506E+00]],
    O:[[-7.953611300E+03,1.607177787E+02,1.966226438E+00,
	1.013670310E-03,-1.110415423E-06,6.517507500E-10,
	-1.584779251E-13,2.840362437E+04,8.404241820E+00],
       [2.619020262E+05,-7.298722030E+02,3.317177270E+00,
	-4.281334360E-04,1.036104594E-07,-9.438304330E-12,
	2.725038297E-16,3.392428060E+04,-6.679585350E-01]],
    CH4:[[-1.766850998E+05,2.786181020E+03,-1.202577850E+01,
	  3.917619290E-02,-3.619054430E-05,2.026853043E-08,
	  -4.976705490E-12,-2.331314360E+04,8.904322750E+01],
	 [3.730042760E+06,-1.383501485E+04,2.049107091E+01,
	  -1.961974759E-03,4.727313040E-07,-3.728814690E-11,
	  1.623737207E-15,7.532066910E+04,-1.219124889E+02]],
    C2H4:[[-1.163605836E+05,2.554851510E+03,-1.609746428E+01,
	  6.625779320E-02,-7.885081860E-05,5.125224820E-08,
	  -1.370340031E-11,-6.176191070E+03,1.093338343E+02],
	 [3.408763670E+06,-1.374847903E+04,2.365898074E+01,
	  -2.423804419E-03,4.431395660E-07,-4.352683390E-11,
	  1.775410633E-15,8.820429380E+04,-1.371278108E+02]],
    C2H6:[[-1.862044161E+05, 3.406191860E+03, -1.951705092E+01,
	   7.565835590E-02,-8.204173220E-05,5.061135800E-08,
	   -1.319281992E-11,-2.702932890E+04, 1.298140496E+02],
	  [5.025782130E+06,-2.033022397E+04,3.322552930E+01,
	   -3.836703410E-03,7.238405860E-07,-7.319182500E-11,
	   3.065468699E-15,1.115963950E+05,-2.039410584E+02]],
    C3H8:[[-2.433144337E+05, 4.656270810E+03, -2.939466091E+01,
	   1.188952745E-01, -1.376308269E-04, 8.814823910E-08,
	   -2.342987994E-11, -3.540335270E+04, 1.841749277E+02],
	  [6.420731680E+06, -2.659791134E+04, 4.534356840E+01,
	   -5.020663920E-03, 9.471216940E-07, -9.575405230E-11,
	   4.009672880E-15, 1.455582459E+05, -2.818374734E+02]],
    C4H10:[[-3.175872540E+05, 6.176331820E+03, -3.891562120E+01,
	    1.584654284E-01, -1.860050159E-04, 1.199676349E-07,
	    -3.201670550E-11, -4.540363390E+04, 2.379488665E+02],
	   [7.682322450E+06, -3.256051510E+04, 5.736732750E+01,
	    -6.197916810E-03, 1.180186048E-06, -1.221893698E-10,
	    5.250635250E-15, 1.774526560E+05, -3.587918760E+02]],
    C5H12:[[-2.768894625E+05, 5.834283470E+03, -3.617541480E+01,
	    1.533339707E-01, -1.528395882E-04, 8.191092000E-08,
	    -1.792327902E-11, -4.665375250E+04, 2.265544053E+02],
	   [-2.530779286E+06, -8.972593260E+03, 4.536223260E+01,
	    -2.626989916E-03, 3.135136419E-06, -5.318728940E-10,
	    2.886896868E-14, 1.484616529E+04, -2.516550384E+02]],
    C6H14:[[-5.815926700E+05, 1.079097724E+04, -6.633947030E+01,
	    2.523715155E-01, -2.904344705E-04, 1.802201514E-07,
	    -4.617223680E-11, -7.271544570E+04, 3.938283540E+02],
	   [-3.106625684E+06, -7.346087920E+03, 4.694131760E+01,
	    1.693963977E-03, 2.068996667E-06, -4.212141680E-10,
	    2.452345845E-14, 5.237503120E+02, -2.549967718E+02]],
    C7H16:[[-6.127432890E+05, 1.184085437E+04, -7.487188600E+01,
	    2.918466052E-01, -3.416795490E-04, 2.159285269E-07,
	    -5.655852730E-11, -8.013408940E+04, 4.407213320E+02],
	   [9.135632470E+06, -3.923319690E+04, 7.889780850E+01,
	    -4.654251930E-03, 2.071774142E-06, -3.442539300E-10,
	    1.976834775E-14, 2.050708295E+05, -4.851104020E+02]],
    C8H18:[[-6.986647150E+05, 1.338501096E+04, -8.415165920E+01,
	    3.271936660E-01, -3.777209590E-04, 2.339836988E-07,
	    -6.010892650E-11, -9.026223250E+04, 4.939222140E+02],
	   [6.365406950E+06, -3.105364657E+04, 6.969162340E+01,
	    1.048059637E-02, -4.129621950E-06, 5.543226320E-10,
	    -2.651436499E-14, 1.500968785E+05, -4.169895650E+02]],
    // Other species 200-600 ; 600-2000 ; 2000-6000
    C_s:[[1.132856760E+05,-1.980421677E+03, 1.365384188E+01,
	   -4.636096440E-02, 1.021333011E-04,-1.082893179E-07,
	   4.472258860E-11,8.943859760E+03,-7.295824740E+01],
	  [3.356004410E+05,-2.596528368E+03,6.948841910E+00,
	   -3.484836090E-03,1.844192445E-06,-5.055205960E-10,
	   5.750639010E-14,1.398412456E+04,-4.477183040E+01],
	  [2.023105106E+05,-1.138235908E+03,3.700279500E+00,
	   -1.833807727E-04,6.343683250E-08,-7.068589480E-12,
	   3.335435980E-16,5.848134850E+03,-2.350925275E+01]],
    // Liquid water : 273.15-373.1507 ; 373.150-600.00
    H2O_l:[[1.326371304E+09,-2.448295388E+07,1.879428776E+05,
	     -7.678995050E+02,1.761556813E+00,-2.151167128E-03,
	     1.092570813E-06,1.101760476E+08,-9.779700970E+05],
	    [1.263631001E+09,-1.680380249E+07,9.278234790E+04,
	     -2.722373950E+02, 4.479243760E-01,-3.919397430E-04,
	     1.425743266E-07, 8.113176880E+07,-5.134418080E+05]]
}

const nasaMW={
    N2:28.01340,
    O2:31.99880,
    CO2:44.00950,
    CO:28.01010,
    H2O:18.01528,
    OH:17.00734,
    H2:2.01588,
    H:1.00794,
    NO:30.00610,
    NO2:46.00550,
    N:14.00670,
    O:15.99940,
    CH4:16.0424600,
    C2H6:30.0690400,
    C3H8:44.0956200,
    C4H10:58.1222000,
    C5H12:72.1487800,
    C6H14:86.1753600,
    C7H16:100.2019400,
    C8H18:114.2285200,
    C_s:12.0107000,
    H2O_l:18.0152800
}

// Get correct glenn parameters
function glennP(specie,T){
    if (specie==="C_s"){
	if (T<=600 && T>=200){
	    return nasaGlenn[specie][0];
	}
	else if (T>600 && T<=2E3){
	    return nasaGlenn[specie][1];
	}
	else if (T>2E3 && T<=6E3) {
	    return nasaGlenn[specie][2];
	}
	else{
	    throw 'Out';
	}
    }
    else if (specie==="H2O_l"){
	if (T>=200 && T<=373.15){
	    return nasaGlenn[specie][0];
	}
	else if (T>373.15 && T<=600){
	    return nasaGlenn[specie][1];
	}
	else {
	    throw 'Out';
	}
    }
    else{
	if (T>=200 && T<=1E3){
	    return nasaGlenn[specie][0];
	}
	else if (T>1E3 && T<=6E3){
	    return nasaGlenn[specie][1];
	}
	else{
	    throw 'Out';
	}
    }
}

/* 
   Thermodynamic functions
*/
function nasaFun(prop,T,specie){
    'use strict';
    // Constants
    let R=8.314510;
    let ans,a;

    // Properties
    if (specie === 'C(s)'){
	specie = 'C_s';
    }
    if (specie === "H2O(l)"){
	specie = "H2O_l";
    }

    try {
	a=glennP(specie,T);
    }
    catch{
	return NaN;
    }
        
    switch (prop){
    case 'MW':
	return nasaMW[specie]/1E3;
	break;
	
    case 'H0molar':
	ans=R*T*(-a[0]/(T*T)+a[1]*Math.log(T)/T+a[2]+a[3]*T/2+a[4]*(T*T)/3+a[5]*(T*T*T)/4+a[6]*(T*T*T*T)/5+a[7]/T);
	return ans;
	break;
		
    case 'S0molar':
	ans=R*(-a[0]/(T*T)/2-a[1]/T+a[2]*Math.log(T)+a[3]*T+a[4]*(T*T)/2+a[5]*(T*T*T)/3+a[6]*(T*T*T*T)/4+a[8]);
	return ans;
	break;

    case 'Cp0molar':
	ans=R*(a[0]/(T*T)+a[1]/T+a[2]+a[3]*T+a[4]*T*T+a[5]*T*T*T+a[6]*T*T*T*T);
	return ans;
	break;

    case 'H0':
	return nasaFun('H0molar',T,specie)/nasaMW[specie]*1E3;
	break;
	
    case 'S0':
	return nasaFun('S0molar',T,specie)/nasaMW[specie]*1E3;
	break;
	
    case 'Cp0':
	return nasaFun('Cp0molar',T,specie)/nasaMW[specie]*1E3;
	break;
	
    case 'G0molar':
	return nasaFun('H0molar',T,specie)-T*nasaFun('S0molar',T,specie);
	break;

    case 'G0':
	return nasaFun('G0molar',T,specie)/nasaMW[specie]*1E3;
	break;
	
    case 'F0molar':
	return nasaFun('U0molar',T,specie)-T*nasaFun('S0molar',T,specie);
	break;

    case 'F0':
	return nasaFun('F0molar',T,specie)/nasaMW[specie]*1E3;
	break;

    default:
	throw 'Undefined property';
	break;
    }	
}

/*
  LEE
*/
/*
  Saturated state
*/

function Pr_sat(Tr){
    let ans;
    let omega=0;
    ans = 5.92714-6.09648/Tr-1.28862*Math.log(Tr)+0.169347*Tr*Tr*Tr*Tr*Tr*Tr+omega*(15.2518-15.6875/Tr-13.4721*Math.log(Tr)+0.43577*Tr*Tr*Tr*Tr*Tr*Tr);
    return Math.exp(ans);
}

/*
  Compressibility
*/

function Z_Vr(Tr,Vr){
    // Constants
    let b=[0.1181193,0.265728,0.154790,0.030323];
    let c=[0.0236744,0.0186984,0.0,0.042724];
    let d=[0.155488E-4,0.623689E-4];
    let beta=0.65392;
    let gamma=0.060167;

    // Auxiliary
    B=b[0]-b[1]/Tr-b[2]/(Tr*Tr)-b[3]/(Tr*Tr*Tr);
    C=c[0]-c[1]/Tr+c[2]/(Tr*Tr*Tr);
    D=d[0]+d[1]/Tr;

    // Function
    let Z;
    Z=1+B/Vr+C/(Vr*Vr)+D/(Vr*Vr*Vr*Vr*Vr)+c[3]/(Tr*Tr*Tr*Vr*Vr)*(beta+gamma/(Vr*Vr))*Math.exp(-gamma/(Vr*Vr));
    return Z;
}

function dZdV(Tr,Pr,f,x){
    let absDelta=1E-4;
    let relDelta=1E-4; // Change to avoid zeros
    let xNear,fNear,dfdx;

    // Check if x is zero
    if(x==0){
    	xNear = x+absDelta;
    }
    else{
	xNear = x*(1+relDelta);
    }

    // Calculate derivative
    fNear=Z_Vr(Tr,xNear)-Pr*xNear/Tr;
    dfdx=(fNear-f)/(xNear-x);

    return dfdx;
}

function Z_Pr(Tr,Pr){
    // Calculate the saturated pressure and find a suitable guess
    Psat=Pr_sat(Tr);
    if (Pr<=Psat){
	first_guess=Tr/Pr;
    }
    else{
	first_guess=0.1;
    }

    // Setup default conditions
    let ans=[1,1];
    let guess=[first_guess,1];

    // First eval
    ans[0]=Z_Vr(Tr,guess[0])-Pr*guess[0]/Tr;

    // Root-finding loop
    let count=0;
    let converged=false;
    let deriv,count2,factor,converged2;
    while (!converged){
	// Determine derivative
	deriv=dZdV(Tr,Pr,ans[0],guess[0])
	// Second loop - Line search
	count2=0;
	factor=1;
	converged2=false;
	while (!converged2){
	    // Test new guess
	    guess[1]=guess[0]-(ans[0]/deriv)*factor;
	    ans[1]=Z_Vr(Tr,guess[1])-Pr*guess[1]/Tr;

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
	if (Math.abs(ans[0])<1E-4){
	    converged=true;
	}
	
        // Max iterations conditions
	count++;
	if (count>30){
	    console.log('Fail: OneNR not converged');
	    break;
	}
    }
    return Z_Vr(Tr,guess[0]);
}

/*
  Enthalpy departure
*/

function deltaH_Vr(Tr,Vr){
    // Constants
    let b=[0.1181193,0.265728,0.154790,0.030323];
    let c=[0.0236744,0.0186984,0.0,0.042724];
    let d=[0.155488E-4,0.623689E-4];
    let beta=0.65392;
    let gamma=0.060167;

    let deltaH;
    let Z=Z_Vr(Tr,Vr);
    let E = c[3]/(2*Tr*Tr*Tr*gamma)*(beta+1-(beta+1+gamma/(Vr*Vr))*Math.exp(-gamma/(Vr*Vr)));
    
    deltaH=Tr*(Z-1-(b[1]+2*b[2]/Tr+3*b[3]/(Tr*Tr))/(Tr*Vr)-(c[1]-3*c[2]/(Tr*Tr))/(2*Tr*Vr*Vr)+d[1]/(5*Tr*Vr*Vr*Vr*Vr*Vr)+3*E);
    return -deltaH;
}

function deltaH_Pr(Tr,Pr){
    let Z=Z_Pr(Tr,Pr);
    let Vr=Z*Tr/Pr;
    return deltaH_Vr(Tr,Vr);
}

/*
  Entropy departure
*/

function deltaSt_Vr(Tr,Vr){
    // Constants
    let b=[0.1181193,0.265728,0.154790,0.030323];
    let c=[0.0236744,0.0186984,0.0,0.042724];
    let d=[0.155488E-4,0.623689E-4];
    let beta=0.65392;
    let gamma=0.060167;

    let deltaH;
    let Z=Z_Vr(Tr,Vr);
    let E = c[3]/(2*Tr*Tr*Tr*gamma)*(beta+1-(beta+1+gamma/(Vr*Vr))*Math.exp(-gamma/(Vr*Vr)));

    let deltaSt;
    deltaSt=Math.log(Z)-(b[0]+b[2]/(Tr*Tr)+2*b[3]/(Tr*Tr*Tr))/Vr-(c[0]-2*c[2]/(Tr*Tr*Tr))/(2*Vr*Vr)-d[0]/(5*Vr*Vr*Vr*Vr*Vr)+2*E;
    return -deltaSt;
}

function deltaSt_Pr(Tr,Pr){
    let Z=Z_Pr(Tr,Pr);
    let Vr=Z*Tr/Pr;
    return deltaSt_Vr(Tr,Vr);
}

/*
  Wrapper
*/

function leeKesler_Z(Tr,inputX){
    switch (inputX){
    case 'f':
	return Z_Pr(Tr,Pr_sat(Tr)+1E-5); // Force to treat as liquid
	break;
    case 'g':
	return Z_Pr(Tr,Pr_sat(Tr));
	break;
    default:
	return Z_Pr(Tr,inputX);
	break;
    }
}

function leeKesler_h(Tr,inputX){
    switch (inputX){
    case 'f':
	return deltaH_Pr(Tr,Pr_sat(Tr)+1E-5); // Force to treat as liquid
	break;
    case 'g':
	return deltaH_Pr(Tr,Pr_sat(Tr));
	break;
    default:
	return deltaH_Pr(Tr,inputX);
	break;
    }
}

function leeKesler_st(Tr,inputX){
    switch (inputX){
    case 'f':
	return deltaSt_Pr(Tr,Pr_sat(Tr)+1E-5); // Force to treat as liquid
	break;
    case 'g':
	return deltaSt_Pr(Tr,Pr_sat(Tr));
	break;
    default:
	return deltaSt_Pr(Tr,inputX);
	break;
    }
}

function lkFun(prop,Tr,inputX){
    // Limits
    if (Tr < 0.3 || Tr > 4){
	return NaN;
    }
    
    if (typeof(inputX) == 'number'){
	if (inputX <0.01 || inputX>10){
	    return NaN;
	}
    }
    else{
	if (inputX != 'f' && inputX!= 'g'){
	    return NaN;
	}
    }

    switch (prop){
    case 'Z':
	return leeKesler_Z(Tr,inputX);
	break;
    case 'dh':
	return leeKesler_h(Tr,inputX);
	break;
    case 'dst':
	return leeKesler_st(Tr,inputX);
	break;
    case 'Prsat':
	return Pr_sat(Tr);
    default:
	return 0;
    }
}


/*
  AUXILIARY FUNCTIONS
*/

//  Import functions to math.js parser
math.import(
    {
	// PropsSI
	PropsSI:function (n,x,xx,y,yy,f){
	    return Module.PropsSI(n,x,xx,y,yy,f)
	},
	Props1SI:function (n,f){
	    return Module.Props1SI(n,f)
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
    }
);
