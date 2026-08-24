export default function Button({
  children,
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} {...props}>
      {children}
    </button>
  );
}
