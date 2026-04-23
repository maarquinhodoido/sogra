"use client";

import { useMemo, useState } from "react";

type AgendaAppointment = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceName: string;
  serviceId: string;
  professionalId: string;
  professionalName: string;
  status: string;
  startAt: string;
  endAt: string;
  internalNotes?: string;
  clientNotes?: string;
};

type AgendaTimeOff = {
  id: string;
  title: string;
  reason?: string;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  professionalId?: string;
};

type AgendaProfessional = {
  id: string;
  name: string;
};

type AgendaService = {
  id: string;
  name: string;
};

type AgendaBoardProps = {
  appointments: AgendaAppointment[];
  timeOffs: AgendaTimeOff[];
  professionals: AgendaProfessional[];
  services: AgendaService[];
  saveTimeOffAction: (formData: FormData) => Promise<void>;
  createAppointmentAction: (formData: FormData) => Promise<void>;
  cancelAppointmentAction: (formData: FormData) => Promise<void>;
};

type RecordsFilterStatus = "ALL" | "ACTIVE" | "CANCELED";

type SelectedItem =
  | {
      type: "appointment";
      payload: AgendaAppointment;
    }
  | {
      type: "timeoff";
      payload: AgendaTimeOff;
    }
  | null;

type AgendaCell =
  | { kind: "empty" }
  | { kind: "skip" }
  | { kind: "appointment"; appointment: AgendaAppointment; rowSpan: number }
  | { kind: "timeoff"; timeOff: AgendaTimeOff; rowSpan: number };

type AgendaActionModal = "appointment" | "timeoff" | "dayoff" | null;

type CancelModalState = {
  appointment: AgendaAppointment;
} | null;

const AGENDA_START_MINUTES = 9 * 60 + 30;
const AGENDA_END_MINUTES = 22 * 60 + 30;
const AGENDA_SLOT_MINUTES = 30;
const AGENDA_ROW_HEIGHT = 20;

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function toInputDateTimeLocal(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

function combineDateAndSlot(date: Date, slot: string) {
  const [hours, minutes] = slot.split(":").map(Number);
  const value = new Date(date);
  value.setHours(hours, minutes, 0, 0);
  return value;
}

function formatSlotLabel(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function toAppointmentDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toAppointmentTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AppointmentsAgendaBoard({
  appointments,
  timeOffs,
  professionals,
  services,
  saveTimeOffAction,
  createAppointmentAction,
  cancelAppointmentAction,
}: AgendaBoardProps) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [activeModal, setActiveModal] = useState<AgendaActionModal>(null);
  const [cancelModal, setCancelModal] = useState<CancelModalState>(null);
  const [recordsModalOpen, setRecordsModalOpen] = useState(false);
  const [recordsQuery, setRecordsQuery] = useState("");
  const [recordsDate, setRecordsDate] = useState("");
  const [recordsTime, setRecordsTime] = useState("");
  const [recordsProfessionalId, setRecordsProfessionalId] = useState("");
  const [recordsServiceId, setRecordsServiceId] = useState("");
  const [recordsStatus, setRecordsStatus] = useState<RecordsFilterStatus>("ALL");
  const [recordsPage, setRecordsPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string>(toDateInputValue(new Date()));
  const [dayOffDate, setDayOffDate] = useState<string>(toDateInputValue(new Date()));

  const selectedDateObject = useMemo(() => new Date(`${selectedDate}T00:00:00`), [selectedDate]);

  const defaultTimeOffStart = useMemo(
    () => toInputDateTimeLocal(combineDateAndSlot(selectedDateObject, "13:00")),
    [selectedDateObject],
  );
  const defaultTimeOffEnd = useMemo(
    () => toInputDateTimeLocal(combineDateAndSlot(selectedDateObject, "14:00")),
    [selectedDateObject],
  );

  const timeRows = useMemo(() => {
    const rows: string[] = [];
    for (let cursor = AGENDA_START_MINUTES; cursor < AGENDA_END_MINUTES; cursor += AGENDA_SLOT_MINUTES) {
      rows.push(formatSlotLabel(cursor));
    }
    return rows;
  }, []);

  const activeAppointments = useMemo(
    () => appointments.filter((item) => item.status !== "CANCELED" && item.status !== "NO_SHOW"),
    [appointments],
  );

  const filteredRecords = useMemo(() => {
    const term = recordsQuery.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const isCanceled = appointment.status === "CANCELED";
      const matchesStatus =
        recordsStatus === "ALL"
          ? true
          : recordsStatus === "CANCELED"
            ? isCanceled
            : !isCanceled && appointment.status !== "NO_SHOW";
      const matchesQuery = term
        ? [appointment.customerName, appointment.customerEmail ?? "", appointment.customerPhone, appointment.serviceName, appointment.professionalName, appointment.internalNotes ?? "", appointment.clientNotes ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(term)
        : true;
      const matchesDate = recordsDate ? toDateInputValue(new Date(appointment.startAt)) === recordsDate : true;
      const matchesTime = recordsTime ? toAppointmentTime(appointment.startAt) === recordsTime : true;
      const matchesProfessional = recordsProfessionalId ? appointment.professionalId === recordsProfessionalId : true;
      const matchesService = recordsServiceId ? (appointment as AgendaAppointment & { serviceId?: string }).serviceId === recordsServiceId : true;

      return matchesStatus && matchesQuery && matchesDate && matchesTime && matchesProfessional && matchesService;
    });
  }, [appointments, recordsDate, recordsProfessionalId, recordsQuery, recordsServiceId, recordsStatus, recordsTime]);

  const recordsPerPage = 20;
  const recordsTotalPages = Math.max(1, Math.ceil(filteredRecords.length / recordsPerPage));
  const recordsCurrentPage = Math.min(recordsPage, recordsTotalPages);
  const recordsOffset = (recordsCurrentPage - 1) * recordsPerPage;
  const recordsPageItems = filteredRecords.slice(recordsOffset, recordsOffset + recordsPerPage);

  const recordsSummary = useMemo(() => {
    return filteredRecords.reduce(
      (accumulator, appointment) => {
        if (appointment.status === "CANCELED") {
          accumulator.canceled += 1;
        } else {
          accumulator.active += 1;
        }
        return accumulator;
      },
      { active: 0, canceled: 0 },
    );
  }, [filteredRecords]);

  function resetRecordsFilters() {
    setRecordsQuery("");
    setRecordsDate("");
    setRecordsTime("");
    setRecordsProfessionalId("");
    setRecordsServiceId("");
    setRecordsStatus("ALL");
    setRecordsPage(1);
  }

  const dayAppointments = useMemo(
    () => activeAppointments.filter((item) => isSameDay(new Date(item.startAt), selectedDateObject)),
    [activeAppointments, selectedDateObject],
  );

  const dayTimeOffs = useMemo(() => {
    const dayStart = startOfDay(selectedDateObject);
    const dayEnd = endOfDay(selectedDateObject);
    return timeOffs.filter((item) => overlaps(new Date(item.startsAt), new Date(item.endsAt), dayStart, dayEnd));
  }, [selectedDateObject, timeOffs]);

  function shiftDay(amount: number) {
    const shifted = addDays(selectedDateObject, amount);
    setSelectedDate(toDateInputValue(shifted));
  }

  const computedDayOff = useMemo(() => {
    if (!dayOffDate) {
      return { start: "", end: "" };
    }

    const startDate = new Date(`${dayOffDate}T00:00:00`);
    const endDate = new Date(`${dayOffDate}T23:59:00`);

    return {
      start: toInputDateTimeLocal(startDate),
      end: toInputDateTimeLocal(endDate),
    };
  }, [dayOffDate]);

  const agendaCells = useMemo(() => {
    const slotBounds = timeRows.map((slot) => {
      const start = combineDateAndSlot(selectedDateObject, slot);
      const end = new Date(start);
      end.setMinutes(start.getMinutes() + AGENDA_SLOT_MINUTES);
      return { start, end };
    });

    const cellsByProfessional: Record<string, AgendaCell[]> = {};

    for (const professional of professionals) {
      const cells: AgendaCell[] = Array.from({ length: timeRows.length }, () => ({ kind: "empty" }));

      const professionalAppointments = dayAppointments
        .filter((item) => item.professionalId === professional.id)
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

      for (const appointment of professionalAppointments) {
        const appointmentStart = new Date(appointment.startAt);
        const appointmentEnd = new Date(appointment.endAt);
        const startIndex = slotBounds.findIndex((slot) => overlaps(appointmentStart, appointmentEnd, slot.start, slot.end));

        if (startIndex < 0 || cells[startIndex]?.kind !== "empty") {
          continue;
        }

        let rowSpan = 1;
        for (let index = startIndex + 1; index < slotBounds.length; index += 1) {
          if (!overlaps(appointmentStart, appointmentEnd, slotBounds[index].start, slotBounds[index].end)) {
            break;
          }
          rowSpan += 1;
        }

        cells[startIndex] = { kind: "appointment", appointment, rowSpan };
        for (let index = startIndex + 1; index < startIndex + rowSpan; index += 1) {
          if (cells[index]) {
            cells[index] = { kind: "skip" };
          }
        }
      }

      const professionalTimeOffs = dayTimeOffs
        .filter((item) => !item.professionalId || item.professionalId === professional.id)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

      for (const timeOff of professionalTimeOffs) {
        const timeOffStart = new Date(timeOff.startsAt);
        const timeOffEnd = new Date(timeOff.endsAt);
        const startIndex = slotBounds.findIndex((slot) => overlaps(timeOffStart, timeOffEnd, slot.start, slot.end));

        if (startIndex < 0 || cells[startIndex]?.kind !== "empty") {
          continue;
        }

        let rowSpan = 1;
        for (let index = startIndex + 1; index < slotBounds.length; index += 1) {
          if (!overlaps(timeOffStart, timeOffEnd, slotBounds[index].start, slotBounds[index].end)) {
            break;
          }
          rowSpan += 1;
        }

        cells[startIndex] = { kind: "timeoff", timeOff, rowSpan };
        for (let index = startIndex + 1; index < startIndex + rowSpan; index += 1) {
          if (cells[index]?.kind === "empty") {
            cells[index] = { kind: "skip" };
          }
        }
      }

      cellsByProfessional[professional.id] = cells;
    }

    return cellsByProfessional;
  }, [dayAppointments, dayTimeOffs, professionals, selectedDateObject, timeRows]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setRecordsPage(1);
            setRecordsModalOpen(true);
          }}
          className="rounded-full bg-primary-strong px-5 py-2.5 text-sm font-semibold text-white"
        >
          Marcações
        </button>
        <button
          type="button"
          onClick={() => setActiveModal("appointment")}
          className="rounded-full bg-primary-strong px-5 py-2.5 text-sm font-semibold text-white"
        >
          Marcar cliente na agenda
        </button>
        <button
          type="button"
          onClick={() => setActiveModal("timeoff")}
          className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-foreground"
        >
          Registar folga/pausa
        </button>
        <button
          type="button"
          onClick={() => setActiveModal("dayoff")}
          className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-foreground"
        >
          Definir dia nao util
        </button>
      </div>

      <div className="section-card rounded-[1.5rem] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-foreground">Agenda diária progressiva</h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => shiftDay(-1)} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground">
              Dia anterior
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-xl border border-line bg-white px-3 py-1.5 text-sm"
            />
            <button type="button" onClick={() => shiftDay(1)} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground">
              Dia seguinte
            </button>
          </div>
        </div>

        <p className="mb-3 text-sm text-muted">{formatDayLabel(selectedDateObject)}</p>

        <div className="pb-1">
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="max-h-[62vh] overflow-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="sticky top-0 z-10 border-b border-line bg-white px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-primary-strong">
                      Horário
                    </th>
                    {professionals.map((professional) => (
                      <th
                        key={professional.id}
                        title={professional.name}
                        className="sticky top-0 z-10 border-b border-l border-line bg-white px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-primary-strong"
                      >
                        <span className="block truncate">{professional.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeRows.map((slot, rowIndex) => (
                    <tr key={`row-${slot}`}>
                      <td className="border-b border-line px-2 py-1 text-[11px] font-semibold text-foreground align-top">
                        {slot}
                      </td>
                      {professionals.map((professional) => {
                        const cell = agendaCells[professional.id]?.[rowIndex] ?? { kind: "empty" };

                        if (cell.kind === "skip") {
                          return null;
                        }

                        if (cell.kind === "appointment") {
                          return (
                            <td
                              key={`${professional.id}-${slot}`}
                              rowSpan={cell.rowSpan}
                              className="border-b border-l border-line px-1 py-0.5 align-top"
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedItem({ type: "appointment", payload: cell.appointment })}
                                style={{ minHeight: `${cell.rowSpan * AGENDA_ROW_HEIGHT - 8}px` }}
                                className="h-full w-full rounded bg-primary-strong px-1 py-0.5 text-left text-[10px] font-semibold text-white"
                              >
                                <p className="truncate" title={cell.appointment.customerName}>{cell.appointment.customerName}</p>
                              </button>
                            </td>
                          );
                        }

                        if (cell.kind === "timeoff") {
                          return (
                            <td
                              key={`${professional.id}-${slot}`}
                              rowSpan={cell.rowSpan}
                              className="border-b border-l border-line px-1 py-0.5 align-top"
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedItem({ type: "timeoff", payload: cell.timeOff })}
                                style={{ minHeight: `${cell.rowSpan * AGENDA_ROW_HEIGHT - 8}px` }}
                                className="h-full w-full rounded bg-amber-50 px-1 py-0.5 text-left text-[10px] font-semibold text-amber-800"
                              >
                                {cell.timeOff.title}
                              </button>
                            </td>
                          );
                        }

                        return (
                          <td key={`${professional.id}-${slot}`} className="border-b border-l border-line px-1 py-0.5" />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {activeModal ? (
        <div className="admin-animate-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="admin-animate-pop w-full max-w-2xl rounded-[1.5rem] border border-line bg-white p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {activeModal === "appointment"
                  ? "Marcar cliente na agenda"
                  : activeModal === "timeoff"
                    ? "Registar folga/pausa"
                    : "Definir dia nao util"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted"
              >
                Fechar
              </button>
            </div>

            {activeModal === "appointment" ? (
              <form action={createAppointmentAction} className="space-y-4">
                <input type="hidden" name="date" value={selectedDate} />

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    name="startTime"
                    type="time"
                    min="09:30"
                    max="22:30"
                    step={1800}
                    defaultValue="09:30"
                    className="rounded-2xl border border-line bg-white px-4 py-3"
                    required
                  />
                  <select name="status" defaultValue="CONFIRMED" className="rounded-2xl border border-line bg-white px-4 py-3">
                    <option value="CONFIRMED">Confirmada</option>
                    <option value="PENDING">Pendente</option>
                  </select>
                </div>

                <select name="professionalId" className="w-full rounded-2xl border border-line bg-white px-4 py-3" required>
                  <option value="">Selecionar funcionária</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name}
                    </option>
                  ))}
                </select>

                <select name="serviceId" className="w-full rounded-2xl border border-line bg-white px-4 py-3" required>
                  <option value="">Selecionar serviço</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>

                <div className="grid gap-4 md:grid-cols-2">
                  <input name="customerName" placeholder="Nome da cliente" className="rounded-2xl border border-line bg-white px-4 py-3" required />
                  <input name="customerPhone" placeholder="Telefone" className="rounded-2xl border border-line bg-white px-4 py-3" required />
                </div>

                <input name="customerEmail" type="email" placeholder="Email (opcional)" className="w-full rounded-2xl border border-line bg-white px-4 py-3" />
                <textarea name="clientNotes" rows={3} placeholder="Notas da cliente" className="w-full rounded-2xl border border-line bg-white px-4 py-3" />

                <button type="submit" className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white">
                  Criar marcação
                </button>
              </form>
            ) : null}

            {activeModal === "timeoff" ? (
              <form action={saveTimeOffAction} className="space-y-4">
                <input name="title" placeholder="Título (ex: Folga, Pausa almoço)" className="w-full rounded-2xl border border-line bg-white px-4 py-3" required />
                <textarea name="reason" rows={3} placeholder="Motivo (opcional)" className="w-full rounded-2xl border border-line bg-white px-4 py-3" />
                <select name="professionalId" className="w-full rounded-2xl border border-line bg-white px-4 py-3">
                  <option value="">Bloqueio geral</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name}
                    </option>
                  ))}
                </select>
                <div className="grid gap-4 md:grid-cols-2">
                  <input name="startsAt" type="datetime-local" defaultValue={defaultTimeOffStart} className="rounded-2xl border border-line bg-white px-4 py-3" required />
                  <input name="endsAt" type="datetime-local" defaultValue={defaultTimeOffEnd} className="rounded-2xl border border-line bg-white px-4 py-3" required />
                </div>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input name="isAllDay" type="checkbox" /> Dia inteiro
                </label>
                <button type="submit" className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white">
                  Guardar bloqueio
                </button>
              </form>
            ) : null}

            {activeModal === "dayoff" ? (
              <form action={saveTimeOffAction} className="space-y-4">
                <p className="text-sm text-muted">
                  Dia selecionado fica bloqueado para novas marcações nesse período.
                </p>
                <input
                  type="date"
                  value={dayOffDate}
                  onChange={(event) => setDayOffDate(event.target.value)}
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3"
                  required
                />
                <select name="professionalId" className="w-full rounded-2xl border border-line bg-white px-4 py-3">
                  <option value="">Aplicar a toda a equipa</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name}
                    </option>
                  ))}
                </select>

                <input type="hidden" name="title" value="Dia não útil" />
                <input type="hidden" name="reason" value="Dia sem trabalho" />
                <input type="hidden" name="startsAt" value={computedDayOff.start} />
                <input type="hidden" name="endsAt" value={computedDayOff.end} />
                <input type="hidden" name="isAllDay" value="on" />

                <button type="submit" className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white">
                  Bloquear dia
                </button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}

      {recordsModalOpen ? (
        <div className="admin-animate-overlay fixed inset-0 z-[55] flex items-center justify-center bg-black/45 p-4">
          <div className="admin-animate-pop w-full max-w-6xl rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Marcações</h3>
                <p className="text-sm text-muted">Lista completa de marcações ativas e canceladas com filtros rápidos.</p>
              </div>
              <button type="button" onClick={() => setRecordsModalOpen(false)} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted">
                Fechar
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <input value={recordsQuery} onChange={(event) => { setRecordsPage(1); setRecordsQuery(event.target.value); }} placeholder="Pesquisar nome, email, serviço ou profissional" className="rounded-2xl border border-line bg-white px-4 py-3 xl:col-span-2" />
              <input value={recordsDate} onChange={(event) => { setRecordsPage(1); setRecordsDate(event.target.value); }} type="date" className="rounded-2xl border border-line bg-white px-4 py-3" />
              <input value={recordsTime} onChange={(event) => { setRecordsPage(1); setRecordsTime(event.target.value); }} type="time" step={1800} className="rounded-2xl border border-line bg-white px-4 py-3" />
              <select value={recordsProfessionalId} onChange={(event) => { setRecordsPage(1); setRecordsProfessionalId(event.target.value); }} className="rounded-2xl border border-line bg-white px-4 py-3">
                <option value="">Todas as funcionárias</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>{professional.name}</option>
                ))}
              </select>
              <select value={recordsServiceId} onChange={(event) => { setRecordsPage(1); setRecordsServiceId(event.target.value); }} className="rounded-2xl border border-line bg-white px-4 py-3">
                <option value="">Todos os serviços</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
              <select value={recordsStatus} onChange={(event) => { setRecordsPage(1); setRecordsStatus(event.target.value as RecordsFilterStatus); }} className="rounded-2xl border border-line bg-white px-4 py-3">
                <option value="ALL">Todas</option>
                <option value="ACTIVE">Ativas</option>
                <option value="CANCELED">Canceladas</option>
              </select>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2 text-sm font-semibold text-muted">
                <span className="rounded-full border border-line bg-surface px-3 py-1">Ativas: {recordsSummary.active}</span>
                <span className="rounded-full border border-line bg-surface px-3 py-1">Canceladas: {recordsSummary.canceled}</span>
                <span className="rounded-full border border-line bg-surface px-3 py-1">Total filtrado: {filteredRecords.length}</span>
              </div>
              <button type="button" onClick={resetRecordsFilters} className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-foreground">
                Limpar filtros
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">
                A mostrar {filteredRecords.length === 0 ? 0 : recordsOffset + 1}-{Math.min(recordsOffset + recordsPerPage, filteredRecords.length)} de {filteredRecords.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRecordsPage((page) => Math.max(1, page - 1))}
                  className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-foreground disabled:opacity-50"
                  disabled={recordsCurrentPage === 1}
                >
                  Anterior
                </button>
                <p className="text-xs font-semibold text-muted">Página {recordsCurrentPage} de {recordsTotalPages}</p>
                <button
                  type="button"
                  onClick={() => setRecordsPage((page) => Math.min(recordsTotalPages, page + 1))}
                  className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-foreground disabled:opacity-50"
                  disabled={recordsCurrentPage === recordsTotalPages}
                >
                  Seguinte
                </button>
              </div>
            </div>

            <div className="appointments-scroll-window mt-4 max-h-[62vh] overflow-y-auto pr-2">
              <div className="space-y-4">
                {recordsPageItems.map((appointment) => {
                  const isCanceled = appointment.status === "CANCELED";
                  const cancellationReason = appointment.internalNotes?.includes("[Cancelamento")
                    ? appointment.internalNotes.split("\n").find((line) => line.includes("[Cancelamento"))
                    : null;

                  return (
                    <div key={appointment.id} className={`rounded-2xl border p-5 ${isCanceled ? "border-red-200 bg-red-50" : "border-line bg-white"}`}>
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-foreground">{appointment.customerName}</p>
                          <p className="text-sm text-muted">{appointment.serviceName} com {appointment.professionalName}</p>
                        </div>
                        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${isCanceled ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {appointment.status}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border border-line bg-surface px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Data</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{toAppointmentDate(appointment.startAt)}</p>
                        </div>
                        <div className="rounded-xl border border-line bg-surface px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Hora</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{toAppointmentTime(appointment.startAt)} - {toAppointmentTime(appointment.endAt)}</p>
                        </div>
                        <div className="rounded-xl border border-line bg-surface px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Contacto</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{appointment.customerPhone}</p>
                        </div>
                        <div className="rounded-xl border border-line bg-surface px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Email</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{appointment.customerEmail ?? "-"}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-line bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Notas cliente</p>
                          <p className="mt-1 text-sm text-muted">{appointment.clientNotes ?? "-"}</p>
                        </div>
                        <div className="rounded-xl border border-line bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Notas internas</p>
                          <p className="mt-1 text-sm text-muted">{isCanceled ? (cancellationReason ?? appointment.internalNotes ?? "-") : (appointment.internalNotes ?? "-")}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {recordsPageItems.length === 0 ? (
                  <div className="rounded-2xl border border-line bg-surface px-5 py-8 text-center text-sm font-semibold text-muted">
                    Nenhuma marcação encontrada com os filtros atuais.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedItem ? (
        <div className="admin-animate-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="admin-animate-pop w-full max-w-2xl rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
            <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Detalhes da agenda</h3>
                <p className="text-sm text-muted">Visualize informações e ações desta entrada.</p>
              </div>
              <button type="button" onClick={() => setSelectedItem(null)} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted">
                Fechar
              </button>
            </div>

            {selectedItem.type === "appointment" ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-line bg-surface px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Cliente</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{selectedItem.payload.customerName}</p>
                  <p className="mt-1 text-sm text-muted">
                    {selectedItem.payload.customerPhone}
                    {selectedItem.payload.customerEmail ? ` · ${selectedItem.payload.customerEmail}` : ""}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-line bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Serviço</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{selectedItem.payload.serviceName}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Profissional</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{selectedItem.payload.professionalName}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Início</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{new Date(selectedItem.payload.startAt).toLocaleString("pt-PT")}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Fim</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{new Date(selectedItem.payload.endAt).toLocaleString("pt-PT")}</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-line bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Estado</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{selectedItem.payload.status}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Notas cliente</p>
                    <p className="mt-1 text-sm text-muted">{selectedItem.payload.clientNotes ?? "-"}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-line bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Notas internas</p>
                  <p className="mt-1 text-sm text-muted">{selectedItem.payload.internalNotes ?? "-"}</p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
                  <button
                    type="button"
                    onClick={() => setCancelModal({ appointment: selectedItem.payload })}
                    className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700"
                  >
                    Cancelar marcação
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-800">Bloqueio</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{selectedItem.payload.title}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-line bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Início</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{new Date(selectedItem.payload.startsAt).toLocaleString("pt-PT")}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Fim</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{new Date(selectedItem.payload.endsAt).toLocaleString("pt-PT")}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Dia inteiro</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{selectedItem.payload.isAllDay ? "Sim" : "Não"}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Motivo</p>
                    <p className="mt-1 text-sm text-muted">{selectedItem.payload.reason ?? "-"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {cancelModal ? (
        <div className="admin-animate-overlay fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
          <div className="admin-animate-pop w-full max-w-xl rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
            <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Cancelar marcação</h3>
                <p className="text-sm text-muted">Indique o motivo antes de cancelar esta marcação.</p>
              </div>
              <button type="button" onClick={() => setCancelModal(null)} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted">
                Fechar
              </button>
            </div>

            <form action={cancelAppointmentAction} className="space-y-4">
              <input type="hidden" name="id" value={cancelModal.appointment.id} />
              <div className="rounded-2xl border border-line bg-surface px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-strong">Cliente</p>
                <p className="mt-1 text-base font-semibold text-foreground">{cancelModal.appointment.customerName}</p>
                <p className="mt-1 text-sm text-muted">
                  {cancelModal.appointment.serviceName} · {cancelModal.appointment.professionalName}
                </p>
              </div>

              <textarea
                name="cancelReason"
                rows={5}
                placeholder="Ex: cliente pediu cancelamento, reagendamento, indisponibilidade, etc."
                className="w-full rounded-2xl border border-line bg-white px-4 py-3"
                required
              />

              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setCancelModal(null)} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-foreground">
                  Voltar
                </button>
                <button type="submit" className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                  Confirmar cancelamento
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
