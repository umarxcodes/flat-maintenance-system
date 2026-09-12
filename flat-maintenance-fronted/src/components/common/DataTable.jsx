// =====================  REUSABLE DATA TABLE COMPONENT  =======
import React from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { TableLoadingSkeleton } from "./LoadingSkeleton.jsx";
import { EmptyState } from "./EmptyState.jsx";

export const DataTable = ({
  columns = [],
  rows = [],
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription = "There are currently no items to display in this table.",
  emptyAction = null,
  totalCount = 0,
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
  keyExtractor = (row, index) => row.id || row._id || index,
}) => {
  const handlePageChange = (_, newPage) => {
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  const handleRowsPerPageChange = (event) => {
    if (onRowsPerPageChange) {
      onRowsPerPageChange(parseInt(event.target.value, 10));
    }
  };

  if (isLoading) {
    return (
      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        <TableLoadingSkeleton rows={5} columns={columns.length || 4} />
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer sx={{ maxHeight: 680 }}>
        <Table stickyHeader aria-label="data table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || "left"}
                  sx={{
                    minWidth: column.minWidth,
                    bgcolor: "background.paper",
                    fontWeight: 700,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length || 1} sx={{ p: 0 }}>
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => {
                const rowKey = keyExtractor(row, index);
                return (
                  <TableRow
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(row)}
                    sx={{
                      cursor: onRowClick ? "pointer" : "default",
                      "&:last-child td, &:last-child th": { border: 0 },
                    }}
                  >
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align || "left"}>
                          {column.render ? column.render(value, row) : (value ?? "-")}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {onPageChange && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          sx={{ borderTop: 1, borderColor: "divider" }}
        />
      )}
    </Paper>
  );
};

export default DataTable;
