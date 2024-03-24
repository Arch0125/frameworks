import { StateVariable, CounterActionInput, CounterRollup, counterSTF } from "./state";
import { StateMachine } from "@stackr/stackr-js/execution";

const run = (prevState: StateVariable, actions: any[]) => {
    const counterRollupObject = new CounterRollup(prevState);
    const fsm = new StateMachine({
      state: counterRollupObject,
      stf: counterSTF,
    });

    actions.forEach((action: any) => {
      fsm.apply(action);
    });

    return fsm.state.getState();
};


  // Execution step
  // Read inputs from stdin
  const stfInputs = readInput();
  var newState = run(stfInputs.currentState, stfInputs.actions);
  // Write the result to stdout
  writeOutput(newState);
  
  // Read input from stdin
  function readInput() {
    const chunkSize = 1024;
    const inputChunks = [];
    let totalBytes = 0;
  
    // Read all the available bytes
    while (1) {
      const buffer = new Uint8Array(chunkSize);
      // Stdin file descriptor
      const fd = 0;
      const bytesRead = Javy.IO.readSync(fd, buffer);
  
      totalBytes += bytesRead;
      if (bytesRead === 0) {
        break;
      }
      inputChunks.push(buffer.subarray(0, bytesRead));
    }
  
    // Assemble input into a single Uint8Array
    const { finalBuffer } = inputChunks.reduce(
      (context, chunk) => {
        context.finalBuffer.set(chunk, context.bufferOffset);
        context.bufferOffset += chunk.length;
        return context;
      },
      { bufferOffset: 0, finalBuffer: new Uint8Array(totalBytes) },
    );
  
    return JSON.parse(new TextDecoder().decode(finalBuffer));
  }
  
  function writeOutput(output) {
    const encodedOutput = new TextEncoder().encode(JSON.stringify(output));
    const buffer = new Uint8Array(encodedOutput);
    // Stdout file descriptor
    const fd = 1;
    Javy.IO.writeSync(fd, buffer);
  }