import { createBrowserRouter } from "react-router";
import { App } from "./App";

// React Router v7, Data Mode. Feature slices add their routes here.
export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
]);
