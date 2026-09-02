import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DataTable, bridge-console table primitive. April 2026 handoff §09.
 *
 * - 1px borders throughout, no alt-row shading.
 * - Header uses mono eyebrow styling (11px, 0.18em, uppercase, t4).
 * - Body uses small sans (13px, t2).
 * - Zero radius everywhere.
 * - No hover-highlight by default; pass `hover` on rows for interactivity.
 *
 * Structure mirrors native HTML; consumers compose it like any table.
 *
 * Usage:
 *   <DataTable>
 *     <DataTable.Header>
 *       <DataTable.HeaderCell>NAME</DataTable.HeaderCell>
 *       <DataTable.HeaderCell align="right">MASS (M☉)</DataTable.HeaderCell>
 *     </DataTable.Header>
 *     <DataTable.Body>
 *       <DataTable.Row>
 *         <DataTable.Cell>Proxima Centauri</DataTable.Cell>
 *         <DataTable.Cell align="right" mono>0.123</DataTable.Cell>
 *       </DataTable.Row>
 *     </DataTable.Body>
 *   </DataTable>
 */
const DataTableRoot = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto sf-sb border border-sf-line">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm border-collapse", className)}
        {...props}
      />
    </div>
  ),
);
DataTableRoot.displayName = "DataTable";

const Header = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("border-b border-sf-line", className)} {...props} />
  ),
);
Header.displayName = "DataTable.Header";

const Body = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("divide-y divide-sf-border", className)} {...props} />
  ),
);
Body.displayName = "DataTable.Body";

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  hover?: boolean;
}
const Row = React.forwardRef<HTMLTableRowElement, RowProps>(
  ({ className, hover, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        hover && "cursor-pointer transition-colors duration-base hover:bg-sf-primary/[0.06]",
        className,
      )}
      {...props}
    />
  ),
);
Row.displayName = "DataTable.Row";

interface CellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "right" | "center";
  mono?: boolean;
}
const Cell = React.forwardRef<HTMLTableCellElement, CellProps>(
  ({ className, align = "left", mono = false, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "px-4 py-3 text-[13px] leading-snug text-t2 align-middle",
        align === "right" && "text-right",
        align === "center" && "text-center",
        mono && "font-mono text-[13px] tabular-nums tracking-[0.08em]",
        className,
      )}
      {...props}
    />
  ),
);
Cell.displayName = "DataTable.Cell";

interface HeaderCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "right" | "center";
}
const HeaderCell = React.forwardRef<HTMLTableCellElement, HeaderCellProps>(
  ({ className, align = "left", ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "px-4 py-3 font-mono text-[12px] font-medium tracking-[0.18em] uppercase text-t4",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
      {...props}
    />
  ),
);
HeaderCell.displayName = "DataTable.HeaderCell";

export const DataTable = Object.assign(DataTableRoot, {
  Header,
  Body,
  Row,
  Cell,
  HeaderCell,
});
