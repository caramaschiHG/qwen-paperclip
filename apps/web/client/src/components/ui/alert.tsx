import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/* ─────────────────────────────────────────────────────
   Alert — Untitled UI style (floating + full-width)
   Variants: info, success, warning, error
   Sizes: sm (compact), md (default)
   ───────────────────────────────────────────────────── */

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default:
          "bg-background text-foreground border-border",
        info:
          "bg-blue-500/10 border-blue-500/20 text-blue-300 [&>svg]:text-blue-400",
        success:
          "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 [&>svg]:text-emerald-400",
        warning:
          "bg-amber-500/10 border-amber-500/20 text-amber-300 [&>svg]:text-amber-400",
        error:
          "bg-red-500/10 border-red-500/20 text-red-300 [&>svg]:text-red-400",
        neutral:
          "bg-card border-border text-muted-foreground [&>svg]:text-muted-foreground",
      },
      size: {
        sm: "p-3 text-sm [&>svg]:size-4 [&>svg~*]:pl-6",
        md: "p-4 text-sm [&>svg]:size-[18px] [&>svg~*]:pl-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant = "default", size = "md", ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    data-slot="alert"
    data-variant={variant}
    data-size={size}
    className={cn(alertVariants({ variant, size }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    data-slot="alert-title"
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="alert-description"
    className={cn("text-sm [&_p]:leading-relaxed opacity-90", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription, alertVariants }
