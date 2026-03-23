import { prisma } from "@/lib/db";
import { REPAIR_STATUS_LABELS } from "@/lib/repair";
import { formatArs } from "@/lib/format";

type PageProps = { searchParams?: { code?: string } };

export default async function TrackingPage({ searchParams }: PageProps) {
  const code = String(searchParams?.code || "").trim().toUpperCase();
  const repair = code
    ? await prisma.repairOrder.findUnique({
        where: { trackingCode: code },
        include: { updates: { orderBy: { createdAt: "desc" } } }
      })
    : null;

  const photos = repair?.photos
    ? repair.photos
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return (
    <section className="section container">
      <div className="admin-header">
        <div>
          <h2>Seguimiento de reparacion</h2>
          <p className="muted">Ingresa tu codigo y revisa el estado.</p>
        </div>
      </div>

      <form className="form-card" method="get">
        <div className="form-grid">
          <label>
            Codigo
            <input name="code" placeholder="REP-XXXXXX" defaultValue={code} />
          </label>
        </div>
        <button className="button" type="submit">Buscar</button>
      </form>

      {code && !repair ? (
        <p className="muted">No se encontro una reparacion con ese codigo.</p>
      ) : null}

      {repair ? (
        <div className="section" style={{ paddingTop: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3>Estado actual: {REPAIR_STATUS_LABELS[repair.status]}</h3>
            <p className="muted">Equipo: {repair.model}</p>
            <p className="muted">Problema: {repair.issue}</p>
            <div className="info-panel" style={{ marginTop: 16 }}>
              <p>Envio: {repair.shippingMethod}</p>
              <p>Presupuesto: {repair.quoteApproved ? "Aprobado" : "Pendiente"}</p>
              {repair.finalPrice ? <p>Precio final: {formatArs(repair.finalPrice)}</p> : null}
              {repair.quoteNote ? <p>Nota: {repair.quoteNote}</p> : null}
            </div>
            <div className="info-panel" style={{ marginTop: 16 }}>
              <strong>Historial</strong>
              <ul className="timeline">
                {repair.updates.map((update) => (
                  <li key={update.id}>
                    <strong>{REPAIR_STATUS_LABELS[update.status]}</strong>
                    <span>{update.note || "Sin nota"}</span>
                  </li>
                ))}
              </ul>
            </div>
            {photos.length ? (
              <div className="section" style={{ paddingBottom: 0 }}>
                <h4>Fotos</h4>
                <div className="gallery-thumbs">
                  {photos.map((url) => (
                    <div key={url} className="thumb">
                      <img src={url} alt="Foto de reparacion" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

