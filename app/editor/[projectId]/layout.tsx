export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-0 bg-bg">{children}</div>;
}
