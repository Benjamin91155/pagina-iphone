export function WhatsAppButton({ phone, message }: { phone: string; message?: string }) {
  const text = encodeURIComponent(message || "Hola, quiero mas info.");
  const href = `https://wa.me/${phone}?text=${text}`;

  return (
    <a className="whatsapp-float" href={href} target="_blank" rel="noreferrer">
      WhatsApp
    </a>
  );
}

