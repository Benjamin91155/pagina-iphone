import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

async function updateSettings(formData: FormData) {
  "use server";

  const exchangeRateMode = String(formData.get("exchangeRateMode") || "manual");
  const exchangeRate = Number(formData.get("exchangeRate") || 0);
  const profitMarginPercent = Number(formData.get("profitMarginPercent") || 0);
  const installmentsFeePercent = Number(formData.get("installmentsFeePercent") || 0);
  const installmentsCount = Number(formData.get("installmentsCount") || 3);
  const whatsappNumber = String(formData.get("whatsappNumber") || "").trim();
  const shopName = String(formData.get("shopName") || "").trim();
  const exchangeRateApiUrl = String(formData.get("exchangeRateApiUrl") || "").trim();
  const exchangeRateApiField = String(formData.get("exchangeRateApiField") || "").trim();

  const existing = await prisma.setting.findFirst();
  if (existing) {
    await prisma.setting.update({
      where: { id: existing.id },
      data: {
        exchangeRateMode,
        exchangeRate,
        profitMarginPercent,
        installmentsFeePercent,
        installmentsCount,
        whatsappNumber,
        shopName,
        exchangeRateApiUrl: exchangeRateApiUrl || null,
        exchangeRateApiField: exchangeRateApiField || null
      }
    });
  } else {
    await prisma.setting.create({
      data: {
        exchangeRateMode,
        exchangeRate,
        profitMarginPercent,
        installmentsFeePercent,
        installmentsCount,
        whatsappNumber,
        shopName,
        exchangeRateApiUrl: exchangeRateApiUrl || null,
        exchangeRateApiField: exchangeRateApiField || null
      }
    });
  }

  redirect("/admin/settings");
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <section>
      <div className="admin-header">
        <div>
          <h2>Precios y configuracion</h2>
          <p className="muted">Tipo de cambio, margen y cuotas.</p>
        </div>
      </div>

      <form className="form-card" action={updateSettings}>
        <div className="form-grid">
          <label>
            Nombre del negocio
            <input name="shopName" defaultValue={settings.shopName} />
          </label>
          <label>
            WhatsApp
            <input name="whatsappNumber" defaultValue={settings.whatsappNumber} />
          </label>
          <label>
            Modo de cambio
            <select name="exchangeRateMode" defaultValue={settings.exchangeRateMode}>
              <option value="manual">Manual</option>
              <option value="auto">Automatico (API)</option>
            </select>
          </label>
          <label>
            Tipo de cambio ARS
            <input name="exchangeRate" type="number" step="0.01" defaultValue={settings.exchangeRate} />
          </label>
          <label>
            Margen de ganancia (%)
            <input name="profitMarginPercent" type="number" step="0.1" defaultValue={settings.profitMarginPercent} />
          </label>
          <label>
            Recargo cuotas (%)
            <input name="installmentsFeePercent" type="number" step="0.1" defaultValue={settings.installmentsFeePercent} />
          </label>
          <label>
            Cantidad de cuotas
            <input name="installmentsCount" type="number" step="1" defaultValue={settings.installmentsCount} />
          </label>
        </div>
        <label>
          API cambio (URL)
          <input name="exchangeRateApiUrl" defaultValue={settings.exchangeRateApiUrl || ""} />
        </label>
        <label>
          API campo (ruta JSON, ej: blue.value_sell)
          <input name="exchangeRateApiField" defaultValue={settings.exchangeRateApiField || ""} />
        </label>
        <button className="button" type="submit">Guardar ajustes</button>
      </form>
    </section>
  );
}

