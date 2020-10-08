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
  Wrapper
*/

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
