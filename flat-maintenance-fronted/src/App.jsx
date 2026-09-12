// =====================  ROOT APPLICATION COMPONENT  =========
import React from "react";
import { RouterProvider } from "react-router-dom";
import { AppProviders } from "./providers/app-providers.jsx";
import { router } from "./router/index.jsx";

export const App = () => {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
};

export default App;
