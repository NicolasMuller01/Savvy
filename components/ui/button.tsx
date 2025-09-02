import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-base font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-primary focus-visible:ring-primary/60 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "text-white shadow-md",
        destructive:
          "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md hover:from-red-600 hover:to-pink-600 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-2 text-white shadow-md",
        secondary:
          "text-white shadow-md",
        ghost:
          "hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  style,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  // Apply dynamic styles based on variant
  const getDynamicStyle = () => {
    const baseStyle = style || {}
    
    switch (variant) {
      case "default":
        return {
          ...baseStyle,
          background: 'linear-gradient(to right, var(--primary), var(--primary-dark))',
          borderColor: 'var(--primary-border)',
          border: '1px solid'
        }
      case "outline":
        return {
          ...baseStyle,
          borderColor: 'var(--primary)',
          color: 'var(--primary)',
          backgroundColor: 'transparent'
        }
      case "secondary":
        return {
          ...baseStyle,
          background: 'linear-gradient(to right, var(--primary), var(--primary-light))',
          borderColor: 'var(--primary-border)',
          border: '1px solid'
        }
      case "ghost":
        return baseStyle
      default:
        return baseStyle
    }
  }

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      style={getDynamicStyle()}
      onMouseEnter={(e) => {
        if (variant === "default" || variant === "secondary") {
          e.currentTarget.style.background = 'linear-gradient(to right, var(--primary-dark), var(--primary))'
        }
        if (variant === "outline") {
          e.currentTarget.style.backgroundColor = 'var(--primary-hover)'
        }
      }}
      onMouseLeave={(e) => {
        if (variant === "default") {
          e.currentTarget.style.background = 'linear-gradient(to right, var(--primary), var(--primary-dark))'
        }
        if (variant === "secondary") {
          e.currentTarget.style.background = 'linear-gradient(to right, var(--primary), var(--primary-light))'
        }
        if (variant === "outline") {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
      {...props}
    />
  )
}

export { Button, buttonVariants }
