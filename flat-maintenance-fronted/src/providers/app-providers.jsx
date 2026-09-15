// =====================  ROOT APP PROVIDERS  ===================
import React from "react";
import { AppThemeProvider } from "./theme-provider.jsx";
import { AppQueryProvider } from "./query-provider.jsx";
import { AuthProvider } from "./auth-provider.jsx";

export const AppProviders = ({ children }) => {
  return (
    <AppQueryProvider>
      <AppThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </AppThemeProvider>
    </AppQueryProvider>
  );
};

export default AppProviders;
