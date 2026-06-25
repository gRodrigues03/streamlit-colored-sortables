import React, {StrictMode} from 'react';
import SortableComponentWrapper from "./SortableComponent";
import {createRoot} from "react-dom/client";

// Handle the possibility of multiple instances of the component to keep track
// of the React roots for each component instance.
const reactRoots = new WeakMap();

const MyComponentRoot = (args: { data: any; parentElement: any; setStateValue: any; }) => {
  const {data, parentElement, setStateValue} = args;

  // Get the react-root div from the parentElement that we defined in our
  // `st.components.v2.component` call in Python.
  // const rootElement = parentElement.querySelector(".react-root");
  //
  // if (!rootElement) {
  //   throw new Error("Unexpected: React root element not found");
  // }

  // Check to see if we already have a React root for this component instance.
  let reactRoot = reactRoots.get(parentElement);
  if (!reactRoot) {
    // If we don't, create a new root for the React application using the React
    // DOM API.
    // @see https://react.dev/reference/react-dom/client/createRoot
    reactRoot = createRoot(parentElement);
    reactRoots.set(parentElement, reactRoot);
  }

  // Render/re-render the React application into the root using the React DOM
  // API.
  reactRoot.render(
    <StrictMode>
      <SortableComponentWrapper setStateValue={setStateValue} data={data}/>
    </StrictMode>,
  );

  // Return a function to cleanup the React application in the Streamlit
  // component lifecycle.
  return () => {
    const reactRoot = reactRoots.get(parentElement);

    if (reactRoot) {
      reactRoot.unmount();
      reactRoots.delete(parentElement);
    }
  };
};

export default MyComponentRoot;