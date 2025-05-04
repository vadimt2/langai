import * as React from 'react';
import { cn } from '@/lib/utils';

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {}

/**
 * VisuallyHidden component for accessibility
 *
 * This component hides content visually while keeping it accessible to screen readers.
 * Use this to provide context or labels for screen readers without affecting visual layout.
 */
const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'absolute h-[1px] w-[1px] overflow-hidden whitespace-nowrap p-0 border-0',
          'clip-rect-0',
          className
        )}
        style={{
          clip: 'rect(0 0 0 0)',
          clipPath: 'inset(50%)',
          margin: '-1px',
        }}
        {...props}
      />
    );
  }
);

VisuallyHidden.displayName = 'VisuallyHidden';

export { VisuallyHidden };
