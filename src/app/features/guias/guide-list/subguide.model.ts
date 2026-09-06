import { GuideDetailResponse } from '../../../core/models/guide.model';

/**
 * Subguía: las líneas de una guía que van al mismo puesto.
 *
 * No es una entidad de la base. `GuideDetail` ya lleva `DestinationStallId`, así
 * que la subguía es ese agrupamiento con nombre y totales propios — un camión
 * lleva una guía y descarga una subguía en cada puesto.
 */
export interface Subguide {
  stallId: number;
  /** `G-2026-000002-P01` */
  number: string;
  stallNumber: string;
  pavilionName: string;
  lines: GuideDetailResponse[];
  /** Suma de cantidades, en bultos. */
  totalQuantity: number;
  /** Peso en kg de las líneas cuya unidad lo tiene definido. */
  totalKg: number;
  /** Líneas cuya unidad no tiene peso: el total de la subguía se queda corto. */
  linesWithoutWeight: number;
  totalTransport: number;
}

/**
 * Agrupa las líneas de una guía en subguías.
 *
 * El orden y la numeración salen de la primera línea que estrenó cada puesto
 * (`Id` más bajo), no del nombre del puesto: así, añadir un puesto nuevo lo pone
 * al final y **nunca renumera** los que ya estaban. Si se ordenara por nombre,
 * un puesto «A-001» añadido al final se colaría en el primer sitio y todas las
 * subguías impresas antes dejarían de coincidir.
 */
export function buildSubguides(
  guideNumber: string,
  details: GuideDetailResponse[],
  weightOf: (logisticUnitId: number) => number | null
): Subguide[] {
  const byStall = new Map<number, GuideDetailResponse[]>();
  for (const line of details) {
    const group = byStall.get(line.destinationStallId);
    if (group) group.push(line);
    else byStall.set(line.destinationStallId, [line]);
  }

  const groups = Array.from(byStall.entries()).sort(
    (a, b) => Math.min(...a[1].map((l) => l.id)) - Math.min(...b[1].map((l) => l.id))
  );

  return groups.map(([stallId, lines], index) => {
    const first = lines[0];
    let totalKg = 0;
    let linesWithoutWeight = 0;

    for (const line of lines) {
      const w = weightOf(line.logisticUnitId);
      if (w) totalKg += w * line.quantity;
      else linesWithoutWeight++;
    }

    return {
      stallId,
      number: `${guideNumber}-P${String(index + 1).padStart(2, '0')}`,
      stallNumber: first.stallNumber,
      pavilionName: first.pavilionName,
      lines,
      totalQuantity: lines.reduce((acc, l) => acc + l.quantity, 0),
      totalKg,
      linesWithoutWeight,
      totalTransport: lines.reduce((acc, l) => acc + l.transportSubtotal, 0)
    };
  });
}
