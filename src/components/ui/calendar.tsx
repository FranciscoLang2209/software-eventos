"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { es } from "react-day-picker/locale";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export type CalendarProps = DayPickerProps;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={es}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "w-fit",
        months: "flex flex-col gap-4",
        month: "space-y-4",
        month_caption: "relative flex items-center justify-center pt-1",
        caption_label: "text-sm font-semibold text-slate-950",
        nav: "absolute inset-x-0 top-1 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "xs" }),
          "h-7 w-7 p-0 text-slate-500 hover:text-slate-950",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "xs" }),
          "h-7 w-7 p-0 text-slate-500 hover:text-slate-950",
        ),
        chevron: "h-4 w-4",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "w-9 rounded-md text-center text-[0.8rem] font-medium text-slate-500",
        week: "mt-2 flex w-full",
        day: "relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "xs" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground [&>button]:focus:bg-primary [&>button]:focus:text-primary-foreground",
        today: "[&>button]:border [&>button]:border-teal-200 [&>button]:text-teal-800",
        outside: "text-slate-400 opacity-50",
        disabled: "text-slate-400 opacity-50",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeft {...chevronProps} className="h-4 w-4" />
          ) : (
            <ChevronRight {...chevronProps} className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
