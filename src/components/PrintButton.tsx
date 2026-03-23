"use client";

export function PrintButton({ label = "Imprimir / Guardar PDF" }: { label?: string }) {
  return (
    <button className="button secondary" type="button" onClick={() => window.print()}>
      {label}
    </button>
  );
}
