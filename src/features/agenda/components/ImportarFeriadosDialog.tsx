"use client";

import { useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CalendarX2, CheckCircle2, ExternalLink, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIALOG_ACCIONES } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useConfirmarImportacionFeriados, useVistaPreviaImportacionFeriados } from "../hooks/useImportacionFeriados";
import {
  ANIO_IMPORTACION_MAX, ANIO_IMPORTACION_MIN, ESTADO_ITEM_IMPORTACION, explicarConflicto, fechaCorta, fechaHoraImportacion,
  fechasRevisionVigentes, interpretarErrorImportacion, leerAnioImportacion, seAplicaAlConfirmar, tipoRegistroFuente, type ErrorImportacion,
} from "../lib/importacionFeriados";
import type { ItemImportacionFeriados, ResultadoImportacionFeriados, VistaPreviaImportacionFeriados } from "../types/diasInhabiles";
import AgendaConfiguracionDialog, { useEventosConfiguracionAgenda } from "./AgendaConfiguracionDialog";

function Aviso({ error, children }: { error: ErrorImportacion; children?: ReactNode }) {
  const advertencia = error.tipo === "anio-no-disponible" || error.tipo === "desactualizada";
  return <div role="alert" className={cn("flex gap-3 rounded-lg border p-4 text-sm", advertencia ? "border-amber-500/40 bg-amber-500/10" : "border-destructive/30 bg-destructive/5")}>
    {error.tipo === "anio-no-disponible" ? <CalendarX2 aria-hidden className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle aria-hidden className={cn("mt-0.5 size-4 shrink-0", !advertencia && "text-destructive")} />}
    <div className="min-w-0 space-y-2"><p className="font-medium">{error.titulo}</p><p className="text-muted-foreground">{error.mensaje}</p>{children}</div>
  </div>;
}

function ElegirAnio({ inicial, onElegir }: { inicial: string; onElegir: (anio: number) => void }) {
  const [valor, setValor] = useState(inicial), [error, setError] = useState<string>();
  const actual = Number(inicial);
  function elegir(texto: string) { try { onElegir(leerAnioImportacion(texto)); } catch (err) { setError(err instanceof Error ? err.message : "Año inválido."); } }
  return <form className="flex flex-1 flex-col gap-4" onSubmit={e => { e.preventDefault(); elegir(valor); }}>
    <p className="text-sm">Se consulta el calendario oficial de feriados nacionales del Ministerio del Interior. Antes de guardar vas a ver qué días se agregan, cuáles ya estaban y cuáles requieren revisión.</p>
    <div className="space-y-2">
      <Label htmlFor="importar-feriados-anio">Año</Label>
      <Input id="importar-feriados-anio" inputMode="numeric" maxLength={4} className="max-w-32" value={valor} aria-invalid={error ? true : undefined} aria-describedby="importar-feriados-anio-ayuda" onChange={e => { setValor(e.target.value); setError(undefined); }} />
      <p id="importar-feriados-anio-ayuda" className="text-xs text-muted-foreground">Entre {ANIO_IMPORTACION_MIN} y {ANIO_IMPORTACION_MAX}. La fuente publica cada año por separado.</p>
      <div className="flex flex-wrap gap-2">{[actual, actual + 1].map(anio => <Button key={anio} type="button" size="sm" variant="outline" onClick={() => { setValor(String(anio)); elegir(String(anio)); }}>{anio}</Button>)}</div>
    </div>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <p className="text-xs text-muted-foreground">Las ferias y excepciones judiciales se siguen cargando a mano con “Nuevo día inhábil”.</p>
    <div className={DIALOG_ACCIONES}><Button type="submit">Ver vista previa</Button></div>
  </form>;
}

function FilaItem({ item, accion, htmlFor }: { item: ItemImportacionFeriados; accion?: ReactNode; htmlFor?: string }) {
  const estado = ESTADO_ITEM_IMPORTACION[item.estado];
  const conflicto = item.estado === "Conflicto";
  const tipos = [...new Set(item.registrosFuente.map(r => tipoRegistroFuente(r.tipo)))].join(" · ");
  const Contenedor = htmlFor ? "label" : "div";
  return <li className={cn("min-w-0 rounded-md border", conflicto && "border-amber-500/50 bg-amber-500/5", item.estado === "Existente" && "text-muted-foreground", htmlFor && "has-checked:border-primary has-checked:bg-primary/5")}>
    <Contenedor htmlFor={htmlFor} className={cn("flex min-w-0 gap-3 p-3", htmlFor && "cursor-pointer")}>
    {accion}
    <div className="min-w-0 flex-1 space-y-1">
      <div className="flex flex-wrap items-center gap-2"><span className="font-medium tabular-nums">{fechaCorta(item.fecha)}</span><Badge variant={item.estado === "Nuevo" ? "default" : conflicto ? "destructive" : item.estado === "Actualizable" ? "secondary" : "outline"} title={estado.ayuda}>{estado.etiqueta}</Badge>{tipos ? <span className="text-xs text-muted-foreground">{tipos}</span> : null}</div>
      <p className="break-words text-sm">{item.descripcion}</p>
      {item.registrosFuente.length > 1 ? <p className="break-words text-xs text-muted-foreground">La fuente publica también: {item.registrosFuente.filter(r => r.nombre !== item.descripcion).map(r => `${r.nombre} (${tipoRegistroFuente(r.tipo)})`).join("; ")}</p> : null}
      {item.estado === "Actualizable" && item.descripcionExistente ? <p className="break-words text-xs text-muted-foreground">Antes: {item.descripcionExistente}</p> : null}
      {conflicto ? <p className="flex gap-1.5 text-xs"><AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0 text-amber-600" /><span className="break-words">{explicarConflicto(item)}</span></p> : item.motivo ? <p className="break-words text-xs text-muted-foreground">{item.motivo}</p> : null}
    </div>
    </Contenedor>
  </li>;
}

function Seccion({ titulo, descripcion, cantidad, abierta = true, children }: { titulo: string; descripcion: string; cantidad: number; abierta?: boolean; children: ReactNode }) {
  if (cantidad === 0) return null;
  return <details open={abierta} className="group rounded-lg border">
    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-3 pointer-coarse:min-h-11 [&::-webkit-details-marker]:hidden">
      <span className="min-w-0"><span className="font-medium">{titulo} <span className="tabular-nums text-muted-foreground">({cantidad})</span></span><span className="mt-0.5 block text-xs text-muted-foreground">{descripcion}</span></span>
      <span aria-hidden className="mt-0.5 shrink-0 text-xs text-muted-foreground group-open:rotate-180">▾</span>
    </summary>
    <div className="border-t p-3">{children}</div>
  </details>;
}

function VistaPrevia({ anio, onCambiarAnio, onImportado }: { anio: number; onCambiarAnio: () => void; onImportado: (resultado: ResultadoImportacionFeriados) => void }) {
  const { onClose, onPending, onDirty } = useEventosConfiguracionAgenda();
  const consulta = useVistaPreviaImportacionFeriados(anio), confirmar = useConfirmarImportacionFeriados();
  const [seleccion, setSeleccion] = useState<string[]>([]), [error, setError] = useState<ErrorImportacion>();
  const lock = useRef(false);

  if (consulta.isPending || (consulta.isFetching && !consulta.data)) return <div className="space-y-3" role="status" aria-label={`Consultando feriados ${anio}`}><p className="text-sm text-muted-foreground">Consultando la fuente oficial para {anio}…</p><Skeleton className="h-20 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (consulta.isError) {
    const err = interpretarErrorImportacion(consulta.error);
    return <div className="flex flex-1 flex-col gap-4"><Aviso error={err} /><div className={DIALOG_ACCIONES}><Button variant="outline" onClick={onCambiarAnio}>Elegir otro año</Button>{err.tipo !== "anio-no-disponible" ? <Button disabled={consulta.isFetching} onClick={() => void consulta.refetch()}>{consulta.isFetching ? "Consultando…" : "Reintentar"}</Button> : null}</div></div>;
  }
  const vista: VistaPreviaImportacionFeriados = consulta.data;
  const vigentes = fechasRevisionVigentes(seleccion, vista.requierenRevision);
  const seAplican = vista.items.filter(seAplicaAlConfirmar), conflictos = vista.items.filter(i => i.estado === "Conflicto"), existentes = vista.items.filter(i => i.estado === "Existente");
  const cambios = seAplican.length + vigentes.length, ocupado = confirmar.isPending || consulta.isFetching;

  function alternar(fecha: string, marcado: boolean) {
    const next = marcado ? [...seleccion, fecha] : seleccion.filter(f => f !== fecha);
    setSeleccion(next); onDirty(next.length > 0); setError(undefined);
  }
  async function confirmarImportacion() {
    if (lock.current) return;
    lock.current = true; onPending(true); setError(undefined);
    try {
      const resultado = await confirmar.mutateAsync({ anio, request: { huella: vista.huella, fechasRevisionIncluidas: vigentes } });
      onDirty(false); onImportado(resultado);
    } catch (err) {
      const interpretado = interpretarErrorImportacion(err);
      setError(interpretado);
      // Con la vista previa vieja no se puede confirmar: se trae la actual para revisarla.
      if (interpretado.tipo === "desactualizada") { const nueva = await consulta.refetch(); if (nueva.data) setSeleccion(s => fechasRevisionVigentes(s, nueva.data.requierenRevision)); }
    } finally { lock.current = false; onPending(false); }
  }

  return <div className="flex flex-1 flex-col gap-4" aria-busy={ocupado}>
    <div className="space-y-1 rounded-lg border bg-muted/30 p-3 text-sm">
      <p className="font-medium">Feriados nacionales {vista.anio}</p>
      <p className="break-words text-muted-foreground">Fuente: <a className="inline-flex items-center gap-1 underline underline-offset-2" href={vista.fuente.url} target="_blank" rel="noreferrer">{vista.fuente.nombre}<ExternalLink aria-hidden className="size-3" /></a></p>
      <p className="text-muted-foreground">Publicado: {fechaHoraImportacion(vista.fechaPublicacionFuente)} · Consultado: {fechaHoraImportacion(vista.consultadoEn)}</p>
      <p className="text-muted-foreground">{vista.calendarioCargado ? `Ya importado. Última sincronización: ${fechaHoraImportacion(vista.ultimaSincronizacion)}.` : "Este año todavía no tiene calendario importado."}</p>
    </div>

    <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
      {[["Nuevos", vista.resumen.nuevos], ["Se actualizan", vista.resumen.actualizables], ["Ya cargados", vista.resumen.existentes], ["Conflictos", vista.resumen.conflictos]].map(([nombre, valor]) => <div key={nombre} className={cn("rounded-md border p-2", nombre === "Conflictos" && Number(valor) > 0 && "border-amber-500/50 bg-amber-500/5")}><dt className="text-xs text-muted-foreground">{nombre}</dt><dd className="text-lg font-semibold tabular-nums">{valor}</dd></div>)}
    </dl>

    {consulta.isFetching ? <p role="status" className="text-sm text-muted-foreground">Actualizando la vista previa…</p> : null}
    {error ? <Aviso error={error} /> : null}

    <div className="space-y-3">
      <Seccion titulo="Se agregan o actualizan" descripcion="Feriados nacionales inamovibles y trasladables que se guardan al confirmar." cantidad={seAplican.length}><ul className="space-y-2">{seAplican.map(item => <FilaItem key={item.fecha} item={item} />)}</ul></Seccion>
      <Seccion titulo="Conflictos" descripcion="No se importan. El sistema respeta los cambios hechos a mano; revisalos desde el listado si corresponde." cantidad={conflictos.length}><ul className="space-y-2">{conflictos.map(item => <FilaItem key={item.fecha} item={item} />)}</ul></Seccion>
      <Seccion titulo="Requieren revisión" descripcion="Días no laborables, puentes turísticos y feriados regionales. No son feriados nacionales: marcá sólo los que el estudio trate como inhábiles." cantidad={vista.requierenRevision.length}>
        <ul className="space-y-2">{vista.requierenRevision.map(item => {
          const elegible = seAplicaAlConfirmar(item), id = `revision-${item.fecha}`;
          return <FilaItem key={item.fecha} item={item} htmlFor={elegible ? id : undefined} accion={elegible ? <span className="flex pt-0.5"><input id={id} type="checkbox" className="size-4 pointer-coarse:size-5" disabled={ocupado} checked={seleccion.includes(item.fecha)} onChange={e => alternar(item.fecha, e.target.checked)} aria-label={`Importar ${fechaCorta(item.fecha)}: ${item.descripcion}`} /></span> : undefined} />;
        })}</ul>
      </Seccion>
      <Seccion titulo="Ya cargados" descripcion="Ya hay un día inhábil activo en esas fechas. No se modifican." cantidad={existentes.length} abierta={false}><ul className="space-y-2">{existentes.map(item => <FilaItem key={item.fecha} item={item} />)}</ul></Seccion>
      <Seccion titulo="Importados que la fuente ya no publica" descripcion="Se conservan. Si ya no corresponden, desactivalos desde el listado." cantidad={vista.ausentesEnFuente.length} abierta={false}><ul className="space-y-2">{vista.ausentesEnFuente.map(dia => <li key={dia.diaInhabilId} className="rounded-md border p-3 text-sm"><span className="font-medium tabular-nums">{fechaCorta(dia.fecha)}</span> · <span className="break-words">{dia.descripcion}</span></li>)}</ul></Seccion>
      <Seccion titulo="Omitidos" descripcion="Fechas de otro año incluidas en el archivo. Se cargan con el calendario de su año." cantidad={vista.omitidos.length} abierta={false}><ul className="space-y-2">{vista.omitidos.map(item => <li key={item.fecha} className="rounded-md border p-3 text-sm"><span className="font-medium tabular-nums">{fechaCorta(item.fecha)}</span> · <span className="break-words">{item.descripcion}</span><p className="text-xs text-muted-foreground">{item.motivo}</p></li>)}</ul></Seccion>
    </div>

    <p className="flex gap-2 text-xs text-muted-foreground"><Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />Los vencimientos ya generados conservan su fecha: la importación sólo afecta los cálculos nuevos.</p>

    <div className={DIALOG_ACCIONES}>
      <Button variant="outline" disabled={ocupado} onClick={onCambiarAnio}>Cambiar año</Button>
      <Button variant="outline" disabled={ocupado} onClick={onClose} className="max-sm:hidden">Cancelar</Button>
      <Button disabled={ocupado} onClick={() => void confirmarImportacion()}>{confirmar.isPending ? "Importando…" : cambios > 0 ? `Importar ${cambios} ${cambios === 1 ? "día" : "días"}` : "Confirmar sin cambios"}</Button>
    </div>
  </div>;
}

function Resultado({ resultado, onClose }: { resultado: ResultadoImportacionFeriados; onClose: () => void }) {
  const sinCambios = resultado.creados + resultado.actualizados + resultado.revisionIncluidos === 0;
  const filas: [string, number][] = [["Agregados", resultado.creados], ["Actualizados", resultado.actualizados], ["De revisión incluidos", resultado.revisionIncluidos], ["Ya cargados", resultado.existentes], ["Conflictos sin tocar", resultado.conflictos]];
  return <div className="flex flex-1 flex-col gap-4">
    <div role="status" className="flex gap-3 rounded-lg border border-emerald-600/30 bg-emerald-600/5 p-4 text-sm">
      <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
      <div className="space-y-1"><p className="font-medium">{resultado.yaAplicada ? `Esta importación de ${resultado.anio} ya estaba aplicada` : sinCambios ? `Feriados ${resultado.anio} sincronizados sin cambios` : `Feriados ${resultado.anio} importados`}</p><p className="text-muted-foreground">{resultado.yaAplicada ? "No se hicieron cambios nuevos. Se muestran las cantidades de la importación original." : sinCambios ? "El calendario ya coincidía con la fuente oficial. Se registró la sincronización." : "El calendario de días inhábiles ya está actualizado."}</p></div>
    </div>
    <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">{filas.map(([nombre, valor]) => <div key={nombre} className="rounded-md border p-2"><dt className="text-xs text-muted-foreground">{nombre}</dt><dd className="text-lg font-semibold tabular-nums">{valor}</dd></div>)}</dl>
    <p className="break-words text-xs text-muted-foreground">Fuente: {resultado.fuente.nombre} · Sincronizado: {fechaHoraImportacion(resultado.sincronizadoEn)}</p>
    {resultado.conflictos > 0 ? <p className="text-sm">Los conflictos no se modificaron. Revisalos en el listado: quedan como estaban.</p> : null}
    <div className={DIALOG_ACCIONES}><Button onClick={onClose}>Listo</Button></div>
  </div>;
}

function Flujo({ anioInicial, onImportado }: { anioInicial: string; onImportado: (resultado: ResultadoImportacionFeriados) => void }) {
  const { onClose } = useEventosConfiguracionAgenda();
  const [anio, setAnio] = useState<number>(), [resultado, setResultado] = useState<ResultadoImportacionFeriados>();
  if (resultado) return <Resultado resultado={resultado} onClose={onClose} />;
  if (anio === undefined) return <ElegirAnio inicial={anioInicial} onElegir={setAnio} />;
  return <VistaPrevia key={anio} anio={anio} onCambiarAnio={() => setAnio(undefined)} onImportado={r => { setResultado(r); onImportado(r); }} />;
}

export default function ImportarFeriadosDialog({ anioInicial, onClose, onImportado }: { anioInicial: string; onClose: () => void; onImportado: (resultado: ResultadoImportacionFeriados) => void }) {
  return <AgendaConfiguracionDialog titulo="Importar feriados nacionales" descripcion="Elegí el año, revisá la vista previa y confirmá." avisoCierre="Se perderán las fechas de revisión que marcaste. No se importó nada todavía." onClose={onClose}>
    <Flujo anioInicial={anioInicial} onImportado={onImportado} />
  </AgendaConfiguracionDialog>;
}
