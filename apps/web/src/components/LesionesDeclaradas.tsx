import type { BodyRegion } from '@bh/domain';
import { Loader2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { activeRuleset } from '../lib/engine.ts';
import { BODY_REGION_LABELS } from '../lib/labels.ts';
import { conMes, type MolestiaDeclarada, useDeclareConstraints } from '../lib/profile.ts';
import { Button, Card, Chip, Notice } from './ui/index.ts';

/**
 * Qué es lo que duele, en palabras del socio. El orden es el de la frecuencia:
 * lo que más se declara es un dolor que viene de antes.
 */
const TIPOS: readonly { id: MolestiaDeclarada['type']; texto: string }[] = [
  { id: 'pain', texto: 'Un dolor que vengo arrastrando' },
  { id: 'injury', texto: 'Una lesión reciente' },
  { id: 'tendinopathy', texto: 'Una tendinitis o tendinopatía' },
  { id: 'surgery', texto: 'Una operación' },
  { id: 'sprain', texto: 'Un esguince' },
];

/**
 * Los tipos que tienen sentido en esta zona. El esguince solo donde el ruleset
 * tiene qué hacer con él (`sprain.regions`, `docs/research/57`): en otra zona
 * se guardaría y el plan no cambiaría nada.
 */
function tiposPara(region: BodyRegion): typeof TIPOS {
  const conEsguince = activeRuleset.sprain?.regions ?? [];
  return TIPOS.filter((t) => t.id !== 'sprain' || conEsguince.includes(region));
}

/**
 * El borrador completo, o `null` si falta algo. Una operación o un esguince no
 * piden intensidad: piden el mes (y la operación, si terminó la
 * rehabilitación), y van con el escalón más bajo de la escala. Si además duele,
 * eso se carga aparte como dolor (`docs/research/56` y `57`).
 */
export function armarBorrador(d: {
  readonly region: BodyRegion | null;
  readonly tipo: MolestiaDeclarada['type'] | null;
  readonly severity: number | null;
  readonly mes: string;
  readonly rehabDone: boolean | null;
  readonly escalonMinimo: number | null;
}): MolestiaDeclarada | null {
  if (d.region === null || d.tipo === null) return null;
  if (!conMes(d.tipo)) {
    return d.severity === null ? null : { region: d.region, type: d.tipo, severity: d.severity };
  }
  if (!/^\d{4}-\d{2}$/.test(d.mes) || d.escalonMinimo === null) return null;
  if (d.tipo === 'sprain') {
    return { region: d.region, type: 'sprain', severity: d.escalonMinimo, month: d.mes };
  }
  if (d.rehabDone === null) return null;
  return {
    region: d.region,
    type: 'surgery',
    severity: d.escalonMinimo,
    month: d.mes,
    rehabDone: d.rehabDone,
  };
}

/** Una por zona y tipo: volver a agregar la misma cambia la intensidad. */
export function conBorrador(
  agregadas: readonly MolestiaDeclarada[],
  nueva: MolestiaDeclarada,
): readonly MolestiaDeclarada[] {
  return [...agregadas.filter((m) => m.region !== nueva.region || m.type !== nueva.type), nueva];
}

/**
 * La puerta de lesiones (`docs/research/55`).
 *
 * Con `conPuerta`, primero un sí o no: la mayoría no tiene nada y sigue. Con un
 * sí, se agregan de a una: zona, qué es y cuánto. La intensidad usa la misma
 * escala que el reporte de dolor de la sesión (`safety.severityScale`), así que
 * el motor las lee igual vengan de donde vengan.
 */
export function LesionesDeclaradas({
  conPuerta,
  textoBoton,
  onGuardado,
}: {
  readonly conPuerta: boolean;
  readonly textoBoton: string;
  readonly onGuardado?: () => void;
}) {
  const declarar = useDeclareConstraints();
  const escala = activeRuleset.safety?.severityScale ?? [];
  const [puerta, setPuerta] = useState<boolean | null>(conPuerta ? null : true);
  const [agregadas, setAgregadas] = useState<readonly MolestiaDeclarada[]>([]);
  const [region, setRegion] = useState<BodyRegion | null>(null);
  const [tipo, setTipo] = useState<MolestiaDeclarada['type'] | null>(null);
  const [severity, setSeverity] = useState<number | null>(null);
  const [mes, setMes] = useState('');
  const [rehabDone, setRehabDone] = useState<boolean | null>(null);

  const escalonMinimo = escala.length > 0 ? Math.min(...escala.map((e) => e.severity)) : null;
  const borrador = armarBorrador({ region, tipo, severity, mes, rehabDone, escalonMinimo });
  // Lo que se guarda: lo agregado más el borrador completo, si lo hay. Quien
  // completa zona, tipo e intensidad y aprieta "Seguir" sin "Agregar" no pierde
  // lo que cargó.
  const aGuardar = borrador ? conBorrador(agregadas, borrador) : agregadas;
  // Con un "sí" y nada cargado no se sabe qué quiso decir.
  const listo = puerta === false || (puerta === true && aGuardar.length > 0);

  function agregar() {
    if (!borrador) return;
    setAgregadas((prev) => conBorrador(prev, borrador));
    setRegion(null);
    setTipo(null);
    setSeverity(null);
    setMes('');
    setRehabDone(null);
  }

  async function onGuardar() {
    await declarar.mutateAsync(puerta ? aGuardar : []);
    onGuardado?.();
  }

  return (
    <div className="flex flex-col gap-4">
      {conPuerta && (
        <Card>
          <p className="mb-3 text-sm font-medium text-ice">
            ¿Tenés ahora alguna lesión, dolor o tendinitis, o tuviste hace poco una operación o un
            esguince?
          </p>
          <div className="flex gap-2">
            <Chip className="flex-1" selected={puerta === false} onClick={() => setPuerta(false)}>
              No
            </Chip>
            <Chip className="flex-1" selected={puerta === true} onClick={() => setPuerta(true)}>
              Sí
            </Chip>
          </div>
        </Card>
      )}

      {puerta === true && (
        <div className="flex flex-col gap-4">
          <Agregadas
            agregadas={agregadas}
            onSacar={(m) => setAgregadas((prev) => prev.filter((x) => x !== m))}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-display text-xs font-semibold uppercase tracking-[0.12em] text-slate">
              ¿Dónde?
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(BODY_REGION_LABELS) as BodyRegion[]).map((r) => (
                <Chip key={r} tone="orange" selected={region === r} onClick={() => setRegion(r)}>
                  {BODY_REGION_LABELS[r]}
                </Chip>
              ))}
            </div>
          </fieldset>

          {region && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 font-display text-xs font-semibold uppercase tracking-[0.12em] text-slate">
                ¿Qué es?
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {tiposPara(region).map((t) => (
                  <Chip key={t.id} selected={tipo === t.id} onClick={() => setTipo(t.id)}>
                    {t.texto}
                  </Chip>
                ))}
              </div>
            </fieldset>
          )}

          {region && tipo && (
            <Detalle
              tipo={tipo}
              escala={escala}
              severity={severity}
              onSeverity={setSeverity}
              mes={mes}
              onMes={setMes}
              rehabDone={rehabDone}
              onRehab={setRehabDone}
            />
          )}

          {borrador && (
            <Button variant="ghost" onClick={agregar}>
              <Plus className="size-4" aria-hidden="true" />
              Agregar
            </Button>
          )}
        </div>
      )}

      {declarar.isError && (
        <Notice tone="error" role="alert">
          No se pudo guardar. Probá de nuevo.
        </Notice>
      )}

      <Button disabled={!listo || declarar.isPending} onClick={() => void onGuardar()}>
        {declarar.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {textoBoton}
      </Button>
    </div>
  );
}

function Agregadas({
  agregadas,
  onSacar,
}: {
  readonly agregadas: readonly MolestiaDeclarada[];
  readonly onSacar: (m: MolestiaDeclarada) => void;
}) {
  if (agregadas.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {agregadas.map((m) => (
        <li
          key={`${m.region}-${m.type}`}
          className="flex items-center justify-between rounded-card border border-line bg-surface px-3.5 py-2.5 text-sm text-ink"
        >
          <span>
            {BODY_REGION_LABELS[m.region]} ·{' '}
            {TIPOS.find((t) => t.id === m.type)?.texto.toLowerCase()}
          </span>
          <button
            type="button"
            aria-label={`Sacar ${BODY_REGION_LABELS[m.region]}`}
            onClick={() => onSacar(m)}
            className="text-slate hover:text-ink"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Lo que se pregunta después del tipo: el mes, o cuánto duele. */
function Detalle(p: {
  readonly tipo: MolestiaDeclarada['type'];
  readonly escala: readonly { readonly severity: number; readonly label: string }[];
  readonly severity: number | null;
  readonly onSeverity: (v: number) => void;
  readonly mes: string;
  readonly onMes: (v: string) => void;
  readonly rehabDone: boolean | null;
  readonly onRehab: (v: boolean) => void;
}) {
  if (!conMes(p.tipo)) {
    return <Intensidad escala={p.escala} valor={p.severity} onElegir={p.onSeverity} />;
  }
  return (
    <DatosConMes
      mes={p.mes}
      onMes={p.onMes}
      rehabDone={p.tipo === 'surgery' ? p.rehabDone : undefined}
      onRehab={p.onRehab}
    />
  );
}

/** La escala del ruleset, con las frases a la vista, igual que en el reporte de dolor. */
function Intensidad({
  escala,
  valor,
  onElegir,
}: {
  readonly escala: readonly { readonly severity: number; readonly label: string }[];
  readonly valor: number | null;
  readonly onElegir: (v: number) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 font-display text-xs font-semibold uppercase tracking-[0.12em] text-slate">
        ¿Cuánto?
      </legend>
      <div className="flex flex-col gap-1.5">
        {escala.map((escalon) => (
          <button
            key={escalon.severity}
            type="button"
            aria-pressed={valor === escalon.severity}
            onClick={() => onElegir(escalon.severity)}
            className={`rounded-card border px-3.5 py-3 text-left text-sm transition-colors ${
              valor === escalon.severity
                ? 'border-orange bg-orange/12 text-ink'
                : 'border-line bg-surface text-slate hover:border-line-bright'
            }`}
          >
            {escalon.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** El mes en que pasó y, en una operación, si terminó la rehabilitación. */
function DatosConMes({
  mes,
  onMes,
  rehabDone,
  onRehab,
}: {
  readonly mes: string;
  readonly onMes: (v: string) => void;
  /** `undefined`: no se pregunta (esguince). */
  readonly rehabDone: boolean | null | undefined;
  readonly onRehab: (v: boolean) => void;
}) {
  // El mes de hoy como tope: una operación no puede ser del futuro. La hora del
  // sistema se lee acá, en la pantalla, no en el motor.
  const hoy = new Date();
  const tope = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-slate">
          ¿En qué mes fue?
        </span>
        <input
          type="month"
          value={mes}
          max={tope}
          onChange={(e) => onMes(e.target.value)}
          className="rounded-card border border-line bg-surface px-3.5 py-2.5 text-sm text-ink"
        />
      </label>
      {rehabDone !== undefined && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-display text-xs font-semibold uppercase tracking-[0.12em] text-slate">
            ¿Ya terminaste la rehabilitación?
          </legend>
          <div className="flex gap-2">
            <Chip className="flex-1" selected={rehabDone === false} onClick={() => onRehab(false)}>
              Todavía no
            </Chip>
            <Chip className="flex-1" selected={rehabDone === true} onClick={() => onRehab(true)}>
              Sí, me dieron el alta
            </Chip>
          </div>
        </fieldset>
      )}
    </div>
  );
}
