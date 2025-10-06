import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const hours = value.getHours().toString().padStart(2, "0");
  const minutes = value.getMinutes().toString().padStart(2, "0");

  const handleTimeChange = (type: "hours" | "minutes", val: string) => {
    const newDate = new Date(value);
    
    if (type === "hours") {
      const h = parseInt(val) || 0;
      if (h >= 0 && h <= 23) {
        newDate.setHours(h);
      }
    } else {
      const m = parseInt(val) || 0;
      if (m >= 0 && m <= 59) {
        newDate.setMinutes(m);
      }
    }
    
    onChange(newDate);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Input
        type="number"
        min="0"
        max="23"
        value={hours}
        onChange={(e) => handleTimeChange("hours", e.target.value)}
        className="w-16 text-center"
        placeholder="HH"
      />
      <span className="text-muted-foreground">:</span>
      <Input
        type="number"
        min="0"
        max="59"
        value={minutes}
        onChange={(e) => handleTimeChange("minutes", e.target.value)}
        className="w-16 text-center"
        placeholder="mm"
      />
    </div>
  );
}
