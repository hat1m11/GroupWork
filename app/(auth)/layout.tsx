export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "var(--ct-bg)",
        backgroundImage: `
          radial-gradient(ellipse 80% 55% at 50% -5%, rgba(59,130,246,0.07) 0%, transparent 65%),
          radial-gradient(ellipse 50% 40% at 90% 100%, rgba(99,102,241,0.05) 0%, transparent 55%)
        `,
      }}
    >
      {children}
    </div>
  );
}
