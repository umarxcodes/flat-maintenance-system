// =====================  TANSTACK QUERY PROVIDER  =============
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/query/query-client.js";

export const AppQueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default AppQueryProvider;
