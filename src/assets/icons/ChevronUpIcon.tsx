import type { SVGProps } from 'react';

export const ChevronUpIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="m4.5 15.75 7.5-7.5 7.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
