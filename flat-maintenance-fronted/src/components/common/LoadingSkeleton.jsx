// =====================  LOADING SKELETON COMPONENT  ==========
import React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

export const TableLoadingSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <Stack spacing={1.5} sx={{ p: 2, width: "100%" }}>
      <Skeleton variant="rounded" height={40} />
      {Array.from({ length: rows }).map((_, idx) => (
        <Box
          key={idx}
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 2,
            py: 1,
          }}
        >
          {Array.from({ length: columns }).map((_, cIdx) => (
            <Skeleton key={cIdx} variant="text" height={28} />
          ))}
        </Box>
      ))}
    </Stack>
  );
};

export const CardLoadingSkeleton = ({ count = 3 }) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
        gap: 3,
      }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <Skeleton key={idx} variant="rounded" height={160} />
      ))}
    </Box>
  );
};

export default TableLoadingSkeleton;
