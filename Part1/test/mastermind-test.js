//[assignment] write your own unit test to show that your Mastermind variation circuit is working as expected
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const wasm_tester = require("circom_tester").wasm;
const buildPoseidon = require("circomlibjs").buildPoseidon;
const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;

exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

function sum(arr) {
    return arr.reduce((a, b) => a + b, 0)
}

describe("MastermindVariation", function () {
    this.timeout(100000000);

    const SOL = [1, 5, 1, 7];
    const digitSum = sum(SOL)
    const SALT = [352352];
    let solHash;

    let poseidonJs;

    beforeEach(async function () {
        poseidonJs = await buildPoseidon();
    });

    it("Should run without errors on correct input", async function () {
        const circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");

        solHash = ethers.BigNumber.from(poseidonJs.F.toObject(poseidonJs(SALT.concat(SOL))))

        const input = {
            "pubGuess": [1, 0, 0, 0],
            "pubNumHit": 1,
            "pubNumBlow": 0,
            "pubSolnSum": digitSum,
            "pubSolnHash": solHash,
            "privSoln": SOL,
            "privSalt": SALT[0]
        }

        await circuit.calculateWitness(input, true);
    });

    it("Should throw error when solution is not n digit numbers", async function () {
        const circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");

        const WRONG_SOL = [0, 55, 6, 7]

        solHash = ethers.BigNumber.from(poseidonJs.F.toObject(poseidonJs(SALT.concat(WRONG_SOL))))

        let input = {
            "pubGuess": [1, 0, 0, 5],
            "pubNumHit": 0,
            "pubNumBlow": 2,
            "pubSolnSum": sum(WRONG_SOL),
            "pubSolnHash": solHash,
            "privSoln": WRONG_SOL,
            "privSalt": SALT[0]
        }

        let err = null;
        try {
            await circuit.calculateWitness(input, true)
        }
        catch (e) {
            err = e;
        }
        expect(err.toString().search("line: 59")).not.to.be.equal(-1);
    });

    it("Should throw error when guess is not n digit numbers", async function () {
        const circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");

        solHash = ethers.BigNumber.from(poseidonJs.F.toObject(poseidonJs(SALT.concat(SOL))))

        let input = {
            "pubGuess": [57, 0, 0, 5],
            "pubNumHit": 0,
            "pubNumBlow": 2,
            "pubSolnSum": digitSum,
            "pubSolnHash": solHash,
            "privSoln": SOL,
            "privSalt": SALT[0]
        }

        let err = null;
        try {
            await circuit.calculateWitness(input, true)
        }
        catch (e) {
            err = e;
        }
        expect(err.toString().search("line: 48")).not.to.be.equal(-1);
    });

    it("Should throw error when pubSolnSum is incorrect", async function () {
        const circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");

        solHash = ethers.BigNumber.from(poseidonJs.F.toObject(poseidonJs(SALT.concat(SOL))))

        const input = {
            "pubGuess": [1, 0, 0, 0],
            "pubNumHit": 1,
            "pubNumBlow": 0,
            "pubSolnSum": 4,
            "pubSolnHash": solHash,
            "privSoln": SOL,
            "privSalt": SALT[0]
        }

        let err = null;
        try {
            await circuit.calculateWitness(input, true)
        }
        catch (e) {
            err = e;
        }
        expect(err.toString().search("line: 71")).not.to.be.equal(-1);
    });

    it("Should throw error when pubNumHit is incorrect", async function () {
        const circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");

        solHash = ethers.BigNumber.from(poseidonJs.F.toObject(poseidonJs(SALT.concat(SOL))))

        const input = {
            "pubGuess": [1, 0, 0, 0],
            "pubNumHit": 2,
            "pubNumBlow": 0,
            "pubSolnSum": digitSum,
            "pubSolnHash": solHash,
            "privSoln": SOL,
            "privSalt": SALT[0]
        }

        let err = null;
        try {
            await circuit.calculateWitness(input, true)
        }
        catch (e) {
            err = e;
        }
        expect(err.toString().search("line: 104")).not.to.be.equal(-1);
    });

    it("Should throw error when pubNumBlow is incorrect", async function () {
        const circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");

        solHash = ethers.BigNumber.from(poseidonJs.F.toObject(poseidonJs(SALT.concat(SOL))))

        const input = {
            "pubGuess": [1, 0, 0, 0],
            "pubNumHit": 1,
            "pubNumBlow": 5,
            "pubSolnSum": digitSum,
            "pubSolnHash": solHash,
            "privSoln": SOL,
            "privSalt": SALT[0]
        }

        let err = null;
        try {
            await circuit.calculateWitness(input, true)
        }
        catch (e) {
            err = e;
        }
        expect(err.toString().search("line: 110")).not.to.be.equal(-1);
    });

    it("Should throw error when solution hash is different from the one publicly published", async function () {
        const circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");

        solHash = ethers.BigNumber.from(poseidonJs.F.toObject(poseidonJs(SALT.concat([1, 6, 4]))))

        const input = {
            "pubGuess": [1, 0, 0, 0],
            "pubNumHit": 1,
            "pubNumBlow": 0,
            "pubSolnSum": digitSum,
            "pubSolnHash": solHash,
            "privSoln": SOL,
            "privSalt": SALT[0]
        }

        let err = null;
        try {
            await circuit.calculateWitness(input, true)
        }
        catch (e) {
            err = e;
        }
        expect(err.toString().search("line: 120")).not.to.be.equal(-1);
    });
});
