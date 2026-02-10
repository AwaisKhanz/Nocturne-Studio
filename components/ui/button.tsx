import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "theme-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 theme-ring disabled:pointer-events-none disabled:opacity-50 transition-transform hover:-translate-y-0.5 active:translate-y-0 theme-transition-colors",
  {
    variants: {
      variant: {
        default:
          "theme-accent shadow-[0_0_20px_var(--glow-indigo)] hover:shadow-[0_0_30px_var(--glow-purple)]",
        ghost:
          "bg-transparent theme-text-muted hover:bg-[color:var(--surface-ghost)]",
        outline:
          "theme-surface-ghost theme-text-muted hover:bg-[color:var(--surface-chip)]",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
