import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameInput,
  FrameReducer,
  NextServerPageProps,
  getFrameMessage,
  getPreviousFrame,
  useFramesReducer,
} from "frames.js/next/server";
import Link from "next/link";
import { DEFAULT_DEBUGGER_HUB_URL, createDebugUrl } from "./debug";
import { currentURL } from "./utils";
import axios from "axios";
import { ethers } from "ethers";

type State = {
  active: string;
  total_button_presses: number;
};

const initialState = { active: "1", total_button_presses: 0 };

const reducer: FrameReducer<State> = (state, action) => {
  return {
    total_button_presses: state.total_button_presses + 1,
    active: action.postBody?.untrustedData.buttonIndex
      ? String(action.postBody?.untrustedData.buttonIndex)
      : "1",
  };
};

const getData = async (guess: string) => {
  const wallet = ethers.Wallet.createRandom();

  const data = {
    type: guess,
  };

  const sign = await wallet.signTypedData(
    {
      name: "Stackr MVP v0",
      version: "1",
      chainId: 1,
      verifyingContract: "0xff014cf7dcf3cbc63b84c83b974c5972ebae83cf",
      salt: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    },
    {
      "update-counter": [
        {
          name: "type",
          type: "string",
        },
      ],
    },
    data,
  );

  const payload = JSON.stringify({
    msgSender: wallet.address,
    signature: sign,
    payload: data,
  });

  const res = await fetch("http://localhost:3002/", {
    method: "POST",
    body: payload,
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  return res
};

// This is a react server component only
export default async function Home({ searchParams }: NextServerPageProps) {
  const url = currentURL("/");
  const previousFrame = getPreviousFrame<State>(searchParams);

  const frameMessage = await getFrameMessage(previousFrame.postBody, {
    hubHttpUrl: DEFAULT_DEBUGGER_HUB_URL,
  });

  if (frameMessage && !frameMessage?.isValid) {
    throw new Error("Invalid frame payload");
  }

  const [state, dispatch] = useFramesReducer<State>(
    reducer,
    initialState,
    previousFrame,
  );
  
  const submitguessInput = await getData(frameMessage.inputText);
  
  console.log(submitguessInput)

  const res = await axios.get("http://localhost:3002");

  // then, when done, return next frame
  return (
    <div className="p-4">
      <FrameContainer
        postUrl="/frames"
        pathname="/"
        state={state}
        previousFrame={previousFrame}
      >
        {/* <FrameImage src="https://framesjs.org/og.png" /> */}
        <FrameImage aspectRatio="1.91:1">
          <div tw="w-full h-full bg-slate-700 text-white justify-center items-center flex flex-col">
            <div>Result :</div>
            <div tw="flex flex-row">{res.data.currentCount}</div>
          </div>
        </FrameImage>
        <FrameInput text="put some text here" />
        <FrameButton>Submit Guess</FrameButton>
        <FrameButton>Refresh Result</FrameButton>
      </FrameContainer>
    </div>
  );
}
