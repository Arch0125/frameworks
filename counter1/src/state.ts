import {RollupState, STF} from "@stackr/stackr-js/execution";
import {ethers} from "ethers";

export type StateVariable = string;

interface StateTransport {
    currentCount: StateVariable;
}

export interface CounterActionInput {
    type: string;
}

const targetWord = "idcrefent";
let attempts = 0;
const maxAttempts = 6;

function checkGuess(guess:string) {
    if (guess.length !== targetWord.length) {
        return { valid: false, feedback: "Guess must be 5 letters." };
    }

    let feedback = '';
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === targetWord[i]) {
            feedback += `[${guess[i]}]`; // Correct position
        } else if (targetWord.includes(guess[i])) {
            feedback += `(${guess[i]})`; // Wrong position
        } else {
            feedback += guess[i]; // Not in word
        }
    }

    if(feedback == targetWord){
        return "Wordle Completed"
    }else{
        return feedback;
    }
}

export class CounterRollup extends RollupState<StateVariable, StateTransport> {
    constructor(count: StateVariable) {
        super(count);
    }

    createTransport(state: StateVariable): StateTransport {
        return {currentCount: state};
    }

    getState(): StateVariable {
        return this.transport.currentCount;
    }

    calculateRoot(): ethers.BytesLike {
        return ethers.solidityPackedKeccak256(
            ["string"],
            [this.transport.currentCount]
        );
    }
}

export const counterSTF: STF<CounterRollup, CounterActionInput> = {
    identifier: "counterSTF",

    apply(inputs: CounterActionInput, state: CounterRollup): void {
        let newState = state.getState();
        newState = checkGuess(inputs.type);
        state.transport.currentCount = newState;
    },
};
