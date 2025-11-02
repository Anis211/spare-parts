import { cn } from '@/lib/utils';
import * as React from 'react';

/**
 * A circular progress indicator component that visualizes completion percentage.
 *
 * @component
 * @example
 * ```tsx
 * <ProgressCircle progress={75} />
 * <ProgressCircle progress={50} size={64} strokeWidth={6} />
 * ```
 */
const ProgressCircle = React.forwardRef(({ progress, size = 48, strokeWidth = 4, className, ...props }, ref) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      ref={ref}
      className={cn('relative flex flex-col items-center justify-center text-white', className)}
      style={{
        width: size,
        height: size,
      }}
      {...props}>
      <svg
        // Position SVG centered relative to the div
        className="absolute"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        // Start from top
        style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-gray-500" />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-white"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          // Smooth transition
          style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
      </svg>
      {/* Progress Percentage Text (centered visually) */}
      <div className="z-10 text-xs font-medium">{Math.round(progress)}%</div>
    </div>
  );
});
ProgressCircle.displayName = 'ProgressCircle';

export { ProgressCircle };
