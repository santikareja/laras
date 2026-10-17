// Area seret setinggi toolbar (DESIGN 5) karena title bar memakai gaya Overlay.
export function App() {
  return (
    <>
      <div data-tauri-drag-region className="h-11" />
      <main />
    </>
  );
}
