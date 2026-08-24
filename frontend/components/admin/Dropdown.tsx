'use client';

import { Transition } from '@headlessui/react';
import Link from 'next/link';
import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';

type DropdownContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
};

const DropDownContext = createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const context = useContext(DropDownContext);
  if (!context) {
    throw new Error('Dropdown components must be used within Dropdown');
  }
  return context;
}

function Dropdown({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => {
    setOpen((previousState) => !previousState);
  };

  return (
    <DropDownContext.Provider value={{ open, setOpen, toggleOpen }}>
      <div className="relative">{children}</div>
    </DropDownContext.Provider>
  );
}

function Trigger({ children }: { children: ReactNode }) {
  const { open, setOpen, toggleOpen } = useDropdown();

  return (
    <>
      <div onClick={toggleOpen}>{children}</div>

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </>
  );
}

function Content({
  align = 'right',
  width = '48',
  contentClasses = 'py-1 bg-edm-gradient ring-1 ring-black/20',
  children,
}: {
  align?: 'left' | 'right';
  width?: '48' | '56' | string;
  contentClasses?: string;
  children: ReactNode;
}) {
  const { open, setOpen } = useDropdown();

  let alignmentClasses = 'origin-top';

  if (align === 'left') {
    alignmentClasses = 'ltr:origin-top-left rtl:origin-top-right start-0';
  } else if (align === 'right') {
    alignmentClasses = 'ltr:origin-top-right rtl:origin-top-left end-0';
  }

  let widthClasses = '';

  if (width === '48') {
    widthClasses = 'w-48';
  } else if (width === '56') {
    widthClasses = 'w-56';
  }

  return (
    <Transition
      show={open}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 scale-95"
      enterTo="opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-95"
    >
      <div
        className={`absolute z-50 mt-2 rounded-md shadow-lg ${alignmentClasses} ${widthClasses}`}
        onClick={() => setOpen(false)}
      >
        <div className={`rounded-md ring-1 ring-black ring-opacity-5 ${contentClasses}`}>
          {children}
        </div>
      </div>
    </Transition>
  );
}

function DropdownLink({
  className = '',
  children,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={
        'block w-full px-4 py-2 text-start text-sm leading-5 text-edm-text transition duration-150 ease-in-out hover:bg-black/20 focus:bg-black/20 focus:outline-none ' +
        className
      }
    >
      {children}
    </Link>
  );
}

function DropdownButton({
  className = '',
  children,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'block w-full px-4 py-2 text-start text-sm leading-5 text-edm-text transition duration-150 ease-in-out hover:bg-black/20 focus:bg-black/20 focus:outline-none ' +
        className
      }
    >
      {children}
    </button>
  );
}

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;
Dropdown.Button = DropdownButton;

export default Dropdown;
