import { useState, forwardRef } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { calculatePasswordStrength } from "@/utils/passwordStrength";

interface PasswordInputProps extends React.ComponentPropsWithoutRef<typeof Input> {
  showStrengthIndicator?: boolean;
  onStrengthChange?: (score: number) => void;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrengthIndicator = false, onStrengthChange, value, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const password = (value as string) || "";
    const strength = calculatePasswordStrength(password);

    // Notifica il parent del cambio di forza
    if (onStrengthChange && password) {
      onStrengthChange(strength.score);
    }

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={cn(
              "pr-10",
              password && strength.score >= 2 && "border-green-500 focus-visible:ring-green-500",
              password && strength.score < 2 && strength.score > 0 && "border-yellow-500",
              className
            )}
            value={value}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          
          {/* Icona di validazione */}
          {password && !showStrengthIndicator && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              {strength.score >= 2 ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-destructive" />
              )}
            </div>
          )}
        </div>

        {/* Indicatore di forza password */}
        {showStrengthIndicator && password && (
          <div className="space-y-1 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Forza password:</span>
              <span className="font-medium" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 ease-out rounded-full"
                style={{
                  width: `${strength.percentage}%`,
                  backgroundColor: strength.color,
                }}
              />
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 mt-2">
              <li className={cn("flex items-center gap-1", password.length >= 8 && "text-green-600")}>
                {password.length >= 8 ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                Almeno 8 caratteri
              </li>
              <li className={cn("flex items-center gap-1", /[A-Z]/.test(password) && "text-green-600")}>
                {/[A-Z]/.test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                Almeno una maiuscola
              </li>
              <li className={cn("flex items-center gap-1", /[0-9]/.test(password) && "text-green-600")}>
                {/[0-9]/.test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                Almeno un numero
              </li>
              <li className={cn("flex items-center gap-1", /[^a-zA-Z0-9]/.test(password) && "text-green-600")}>
                {/[^a-zA-Z0-9]/.test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                Almeno un carattere speciale
              </li>
            </ul>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
