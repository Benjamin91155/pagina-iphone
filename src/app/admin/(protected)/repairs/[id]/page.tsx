import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { REPAIR_STATUS_LABELS } from "@/lib/repair";

async function updateRepair(repairId: string, formData: FormData) {
  "use server";

  const status = String(formData.get("status") || "INGRESADO");
  const diagnosticNotes = String(formData.get("diagnosticNotes") || "").trim();
  const repairNotes = String(formData.get("repairNotes") || "").trim();
  const partsCost = Number(formData.get("partsCost") || 0);
  const laborCost = Number(formData.get("laborCost") || 0);
  const finalPrice = Number(formData.get("finalPrice") || 0);
  const note = String(formData.get("note") || "").trim();
  const quoteApproved = formData.get("quoteApproved") === "on";
  const quoteNote = String(formData.get("quoteNote") || "").trim();
  const photoLines = String(formData.get("photos") || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const photoValue = photoLines.length ? photoLines.join("\n") : null;

  const current = await prisma.repairOrder.findUnique({
    where: { id: repairId },
    select: { quoteApproved: true, quoteApprovedAt: true }
  });

  const approvedAt =
    quoteApproved && !current?.quoteApproved ? new Date() : current?.quoteApprovedAt || null;

  await prisma.repairOrder.update({
    where: { id: repairId },
    data: {
      status,
      diagnosticNotes: diagnosticNotes || null,
      repairNotes: repairNotes || null,
      partsCost,
      laborCost,
      finalPrice,
      photos: photoValue,
      quoteApproved,
      quoteApprovedAt: quoteApproved ? approvedAt : null,
      quoteNote: quoteNote || null
    }
  });

  if (note || status || (quoteApproved && !current?.quoteApproved)) {
    const approvalNote = quoteApproved && !current?.quoteApproved ? "Presupuesto aprobado por el cliente." : "";
    await prisma.repairUpdate.create({
      data: {
        repairOrderId: repairId,
        status,
        note: note || approvalNote || null
      }
    });
  }

  redirect(`/admin/repairs/${repairId}`);
}

type PageProps = { params: { id: string } };

export default async function RepairDetailPage({ params }: PageProps) {
  const repair = await prisma.repairOrder.findUnique({
    where: { id: params.id },
    include: { updates: { orderBy: { createdAt: "desc" } } }
  });

  if (!repair) {
    redirect("/admin/repairs");
  }

  const photos = repair.photos
    ? repair.photos
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];
  const phoneDigits = repair.phone.replace(/\D/g, "");
  const statusLabel =
    REPAIR_STATUS_LABELS[repair.status as keyof typeof REPAIR_STATUS_LABELS] || "Sin estado";
  const notifyMessage = `Hola ${repair.customerName}, tu reparacion (${repair.trackingCode}) esta en estado "${statusLabel}".`;

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Reparacion {repair.trackingCode}</h2>
          <p className="muted">Estado actual: {REPAIR_STATUS_LABELS[repair.status]}</p>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <p><strong>Cliente:</strong> {repair.customerName} - {repair.phone}</p>
        <p><strong>Equipo:</strong> {repair.model}</p>
        <p><strong>Problema:</strong> {repair.issue}</p>
        <p><strong>Envio:</strong> {repair.shippingMethod}</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <a
            className="button secondary"
            href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(notifyMessage)}`}
            target="_blank"
            rel="noreferrer"
          >
            Enviar WhatsApp
          </a>
          <a className="button secondary" href={`sms:${phoneDigits}?body=${encodeURIComponent(notifyMessage)}`}>
            Enviar SMS
          </a>
        </div>
      </div>

      <form className="form-card" action={updateRepair.bind(null, repair.id)}>
        <div className="form-grid">
          <label>
            Estado
            <select name="status" defaultValue={repair.status}>
              {Object.keys(REPAIR_STATUS_LABELS).map((status) => {
                const key = status as keyof typeof REPAIR_STATUS_LABELS;
                return (
                  <option key={status} value={status}>
                    {REPAIR_STATUS_LABELS[key]}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            Costo repuestos
            <input name="partsCost" type="number" min="0" step="0.01" defaultValue={repair.partsCost || 0} />
          </label>
          <label>
            Mano de obra
            <input name="laborCost" type="number" min="0" step="0.01" defaultValue={repair.laborCost || 0} />
          </label>
          <label>
            Precio final
            <input name="finalPrice" type="number" min="0" step="0.01" defaultValue={repair.finalPrice || 0} />
          </label>
          <label>
            Presupuesto aprobado
            <input name="quoteApproved" type="checkbox" defaultChecked={repair.quoteApproved} />
          </label>
        </div>
        <label>
          Diagnostico
          <textarea name="diagnosticNotes" defaultValue={repair.diagnosticNotes || ""} />
        </label>
        <label>
          Reparacion realizada
          <textarea name="repairNotes" defaultValue={repair.repairNotes || ""} />
        </label>
        <label>
          Nota de presupuesto
          <textarea name="quoteNote" defaultValue={repair.quoteNote || ""} />
        </label>
        <label>
          Fotos (una URL por linea)
          <textarea name="photos" defaultValue={photos.join("\n")} />
        </label>
        <label>
          Nota para historial
          <textarea name="note" placeholder="Actualizar estado y notas para el cliente" />
        </label>
        <button className="button" type="submit">Guardar cambios</button>
      </form>

      {photos.length ? (
        <div className="section" style={{ paddingTop: 20 }}>
          <h3>Fotos del equipo</h3>
          <div className="gallery-thumbs">
            {photos.map((url) => (
              <div key={url} className="thumb">
                <img src={url} alt="Foto de reparacion" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="section" style={{ paddingTop: 20 }}>
        <h3>Historial</h3>
        <div className="card" style={{ padding: 16 }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {repair.updates.map((update) => (
              <li key={update.id} style={{ marginBottom: 12 }}>
                <strong>{REPAIR_STATUS_LABELS[update.status]}</strong>
                <div className="muted">{update.note || "Sin nota"}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
