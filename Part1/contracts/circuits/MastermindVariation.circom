pragma circom 2.0.0;

// [assignment] implement a variation of mastermind from https://en.wikipedia.org/wiki/Mastermind_(board_game)#Variation as a circuit

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";
include "./RangeProof.circom";

// Number Mastermind
/*
    The code-maker thinks of a n (n < 6) digit number which must be discovered by the code-breaker using
    hints such as number of hits, blows and sum of the digits. There may be duplicate digits.
*/
template MastermindVariation(n) {
    assert(n < 6);
    
    // Public inputs
    signal input pubGuess[n];
    signal input pubNumHit;
    signal input pubNumBlow;
    signal input pubSolnSum;
    signal input pubSolnHash;

    // Private inputs
    signal input privSoln[n];
    signal input privSalt;

    // Output
    signal output solnHashOut;

    var i, j, k;

    // Create a constraint that the solution and guess are n digit numbers
    component guessRange[n];
    component solnRange[n];
    
    for (i = 0; i < n; i++) {
        guessRange[i] = RangeProof(32);
        if(i == 0) {
            guessRange[i].range[0] <== 1;
        }
        else {
            guessRange[i].range[0] <== 0;
        }
        guessRange[i].range[1] <== 9;
        guessRange[i].in <== pubGuess[i];
        guessRange[i].out === 1;

        solnRange[i] = RangeProof(32);
        if(i == 0) {
            solnRange[i].range[0] <== 1;
        }
        else {
            solnRange[i].range[0] <== 0;
        }
        solnRange[i].range[1] <== 9;
        solnRange[i].in <== privSoln[i];
        solnRange[i].out === 1;
    }

    // Create constraint around the sum of digits of soln
    var solnDigitSum = 0;
    for (i = 0; i < n; i++) {
        solnDigitSum += privSoln[i];
    }

    component equalSum = IsEqual();
    equalSum.in[0] <== pubSolnSum;
    equalSum.in[1] <== solnDigitSum;
    equalSum.out === 1;

    // Count hit
    var hit = 0;
    component equalH[n];

    for (i = 0; i < n; i++) {
        equalH[i] = IsEqual();
        equalH[i].in[0] <== privSoln[i];
        equalH[i].in[1] <== pubGuess[i];
        hit += equalH[i].out;
    }

    // Count blow
    component equalB[n * n];
    signal _equalB[n * n];
    var blow = 0;

    for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
            k = n * i + j;
            equalB[k] = IsEqual();
            equalB[k].in[0] <== pubGuess[i];
            equalB[k].in[1] <== privSoln[j];
            _equalB[k] <== (1 - equalH[i].out) * equalB[k].out;
            blow += _equalB[k];
        }
    }

    // Create a constraint around the number of hit
    component equalHit = IsEqual();
    equalHit.in[0] <== pubNumHit;
    equalHit.in[1] <== hit;
    equalHit.out === 1;
    
    // Create a constraint around the number of blow
    component equalBlow = IsEqual();
    equalBlow.in[0] <== pubNumBlow;
    equalBlow.in[1] <== blow;
    equalBlow.out === 1;

    // Verify that the hash of the private solution matches pubSolnHash
    component poseidon = Poseidon(n + 1);
    poseidon.inputs[0] <== privSalt;
    for(i = 0; i < n; i++) {
        poseidon.inputs[i + 1] <== privSoln[i];
    }

    solnHashOut <== poseidon.out;
    pubSolnHash === solnHashOut;
}

component main = MastermindVariation(4);