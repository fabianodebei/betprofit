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
  
  const hoursRef = React.useRef<HTMLInputElement>(null);
  const minutesRef = React.useRef<HTMLInputElement>(null);

  const handleTimeChange = (type: "hours" | "minutes", val: string) => {
    const newDate = new Date(value);
    
    if (type === "hours") {
      const h = parseInt(val) || 0;
      if (h >= 0 && h <= 23) {
        newDate.setHours(h);
        // Se ha inserito 2 cifre, passa ai minuti
        if (val.length === 2) {
          minutesRef.current?.focus();
          minutesRef.current?.select();
        }
      }
    } else {
      const m = parseInt(val) || 0;
      if (m >= 0 && m <= 59) {
        newDate.setMinutes(m);
      }
    }
    
    onChange(newDate);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Input
        ref={hoursRef}
        type="number"
        min="0"
        max="23"
        value={hours}
        onChange={(e) => handleTimeChange("hours", e.target.value)}
        onFocus={handleFocus}
        className="w-16 text-center"
        placeholder="HH"
      />
      <span className="text-muted-foreground">:</span>
      <Input
        ref={minutesRef}
        type="number"
        min="0"
        max="59"
        value={minutes}
        onChange={(e) => handleTimeChange("minutes", e.target.value)}
        onFocus={handleFocus}
        className="w-16 text-center"
        placeholder="mm"
      />
    </div>
  );
}
