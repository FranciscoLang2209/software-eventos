export const EVENT_TYPES = ["Social", "Corporativo"] as const;

export type EventoTipo = (typeof EVENT_TYPES)[number];

export const EVENT_SUBTYPES = {
  Social: [
    "Casamiento",
    "Fiesta de XV",
    "Cumpleaños",
    "Bat Mitzvah",
    "Bar Mitzvah",
    "Gala",
    "Aniversario",
    "Graduación",
  ],
  Corporativo: [
    "Corporativo",
    "Fundación",
    "Fiesta fin de año",
    "Jornada",
    "Presentación",
  ],
} as const satisfies Record<EventoTipo, readonly string[]>;

const EVENT_TYPE_CODES: Record<EventoTipo, string> = {
  Social: "SOC",
  Corporativo: "CORPO",
};

const EVENT_SUBTYPE_CODES: Record<string, string> = {
  Casamiento: "CAS",
  "Fiesta de XV": "XV",
  Cumpleaños: "CUM",
  "Bat Mitzvah": "BAT",
  "Bar Mitzvah": "BAR",
  Gala: "GAL",
  Aniversario: "ANI",
  Graduación: "GRA",
  Corporativo: "COR",
  Fundación: "FUN",
  "Fiesta fin de año": "FFA",
  Jornada: "JOR",
  Presentación: "PRE",
};

export function isEventoTipo(value: string): value is EventoTipo {
  return EVENT_TYPES.includes(value as EventoTipo);
}

export function isEventoSubtipoForTipo(
  tipo: string,
  subtipo: string,
) {
  return (
    isEventoTipo(tipo) &&
    (EVENT_SUBTYPES[tipo] as readonly string[]).includes(subtipo)
  );
}

export function getEventoCode(tipo: string, subtipo?: string | null) {
  if (!isEventoTipo(tipo)) {
    return "";
  }

  const typeCode = EVENT_TYPE_CODES[tipo];

  if (subtipo && EVENT_SUBTYPE_CODES[subtipo]) {
    return `${typeCode} - ${EVENT_SUBTYPE_CODES[subtipo]}`;
  }

  return typeCode;
}

export function generateEventoName({
  fechaEvento,
  salonNombre,
  subtipoEvento,
  tipoEvento,
}: {
  fechaEvento: string;
  salonNombre: string;
  subtipoEvento?: string | null;
  tipoEvento: string;
}) {
  const code = getEventoCode(tipoEvento, subtipoEvento);

  if (!fechaEvento || !code || !salonNombre) {
    return "";
  }

  return `${fechaEvento} - ${code} - ${salonNombre}`;
}
