import type { PropsWithChildren } from 'hono/jsx';
import type { JSX } from 'hono/jsx/jsx-runtime';
import { cn } from '@/lib/utils';

export type ButtonProps = JSX.IntrinsicElements['button'] & {
  isSelected?: boolean;
};

export function Button({
  children,
  className,
  isSelected,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      type="button"
      className={cn(
        `border rounded-lg w-full p-4 mb-6 shadow-sm cursor-pointer ${
          isSelected ? 'bg-blue-100 border-blue-500' : 'bg-white'
        }`,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
