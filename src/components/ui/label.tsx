import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Field labels are 12px uppercase (CLAUDE.md). A <Label> that names an
// OPTION (it follows, or wraps, a radio or checkbox) is running text: it
// drops to sentence-case DM Sans so option names and their descriptions
// read as prose, not as Ship's Voice caps. Fixed here once rather than in
// every worksheet.
const OPTION_LABEL =
  "[[role=radio]~&]:normal-case [[role=radio]~&]:tracking-normal [[role=radio]~&]:leading-snug [[role=radio]~&]:text-t1 " +
  "[[role=checkbox]~&]:normal-case [[role=checkbox]~&]:tracking-normal [[role=checkbox]~&]:leading-snug [[role=checkbox]~&]:text-t1 " +
  "[&:has([role=radio])]:normal-case [&:has([role=radio])]:tracking-normal [&:has([role=radio])]:leading-snug " +
  "[&:has([role=checkbox])]:normal-case [&:has([role=checkbox])]:tracking-normal [&:has([role=checkbox])]:leading-snug";

const labelVariants = cva(
  `text-[12px] font-sans font-medium uppercase tracking-[1.5px] leading-none text-t3 peer-disabled:cursor-not-allowed peer-disabled:text-sf-disabled-text ${OPTION_LABEL}`,
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
