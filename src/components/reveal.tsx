import { Children, type CSSProperties, type ReactNode } from "react";

/** CSS entrances finish even when JavaScript is disabled or hydration fails. */
export function Reveal({ children, delay = 0, className }: {
  children: ReactNode;
  delay?: number;
  className?: string;
  onMount?: boolean;
}) {
  return (
    <div className={`reveal-enter ${className ?? ""}`} style={{ "--reveal-delay": `${delay}s` } as CSSProperties}>
      {children}
    </div>
  );
}

export function RevealGroup({ children, className, stagger = 0.08 }: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <div className={className}>
      {Children.toArray(children).map((child, index) => (
        <div key={index} style={{ "--reveal-delay": `${index * stagger}s` } as CSSProperties}>{child}</div>
      ))}
    </div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`reveal-enter ${className ?? ""}`}>{children}</div>;
}
