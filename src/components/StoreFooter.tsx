export function StoreFooter({ shopName }: { shopName: string }) {
  return (
    <footer className="store-footer">
      <div className="container footer-inner">
        <div>
          <strong>{shopName}</strong>
          <p>Ventas y reparaciones con garantia escrita.</p>
        </div>
        <div>
          <p>Horarios: Lun a Sab 10:00 - 19:00</p>
          <p>Envios a todo el pais o retiro en persona.</p>
        </div>
      </div>
    </footer>
  );
}

