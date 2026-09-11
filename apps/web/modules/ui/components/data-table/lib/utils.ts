/**
 * Computes CSSProperties for a pinned table column — sets position sticky, left offset,
 * and z-index so pinned columns remain visible during horizontal scroll.
 */
import { Column } from "@tanstack/react-table";
import { CSSProperties } from "react";

export const getCommonPinningStyles = <T>(column: Column<T>): CSSProperties => {
  return {
    left: `${column.getStart("left") - 1}px`,
    position: "sticky",
    width: column.getSize(),
    zIndex: 1,
  };
};
