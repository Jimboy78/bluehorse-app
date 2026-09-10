import { ArrowLeft, ClipboardList, Loader2, PenLine, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { AppShell } from '../components/AppShell.tsx';
import { ManualItemForm } from '../components/ManualItemForm.tsx';
import { ManualSessionCard } from '../components/ManualSessionCard.tsx';
import {
  Button,
  Card,
  EmptyState,
  Field,
  fieldClass,
  Notice,
  Skeleton,
} from '../components/ui/index.ts';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { useGymCatalog } from '../lib/catalog.ts';
import {
  useAddManualItem,
  useAddManualSession,
  useManualPlan,
  useRemoveManualItem,
  useRemoveManualSession,
} from '../lib/manual-plan.ts';
import { useProfileStatus } from '../lib/onboarding.ts';
import { useActivatePlan } from '../lib/plan.ts';

/**
 * ARMAR UN PLAN A MANO
 *
 * El otro camino es el motor: dice el objetivo, mira el equipamiento real y
 * devuelve la cola entera. Sirve cuando la persona quiere que la app decida.
 * Esta pantalla es para la otra mitad — quien ya sabe qué quiere hacer, o
 * quien quiere cargar hoy el día de piernas y el resto la semana que viene.
 *
 * **El plan crece de a un día.** No hay un paso "armá la semana": se agrega un
 * día, se le cargan ejercicios, y se cierra la app. Mañana se agrega otro. Por
 * eso el plan nace guardado y no activo, y hay un botón explícito para
 * empezar a usarlo.
 *
 * Los días son una cola, no un calendario. Se llaman "Día 1, Día 2" y no
 * "lunes": atar sesiones a días de la semana genera sesiones vencidas cuando
 * la persona falta, que es la trampa documentada en CLAUDE.md. Quien quiera
 * escribir "Lunes de pierna" lo escribe en el nombre del día, que es texto
 * suyo y no cambia cuándo toca.
 */
export function ArmarPlan() {
  const { planId = null } = useParams();
  const { status } = useAuth();
  const plan = useManualPlan(planId);

  // `status` antes que la query: gateada por sesión, con la sesión sin
  // resolver queda deshabilitada y `isPending` no se apaga nunca.
  if (status !== 'signed-in') {
    return (
      <AppShell>
        <Skeleton className="h-40" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <Link
          to="/planes"
          className="flex items-center gap-1.5 self-start text-xs text-slate transition-colors hover:text-brand"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Tus planes
        </Link>

        {plan.isPending && <Skeleton className="h-40" />}
        {plan.isError && (
          <Notice tone="error" role="alert">
            No se pudo abrir el plan.
          </Notice>
        )}
        {!plan.isPending && !plan.isError && !plan.data && (
          <Notice tone="warn">Este plan ya no existe.</Notice>
        )}
        {plan.data && <Cuerpo planId={plan.data.id} />}
      </div>
    </AppShell>
  );
}

function Cuerpo({ planId }: { readonly planId: string }) {
  const plan = useManualPlan(planId);
  const perfil = useProfileStatus();
  const catalogo = useGymCatalog(perfil.data?.gymId ?? null);
  const navigate = useNavigate();

  const addSession = useAddManualSession(planId);
  const removeSession = useRemoveManualSession(planId);
  const addItem = useAddManualItem(planId);
  const removeItem = useRemoveManualItem(planId);
  const activate = useActivatePlan();

  const [abriendoDia, setAbriendoDia] = useState(false);
  const [cargandoEn, setCargandoEn] = useState<string | null>(null);

  const detalle = plan.data;
  if (!detalle) return null;

  const sessions = detalle.sessions;
  const conEjercicios = sessions.filter((s) => s.items.length > 0);

  async function activar() {
    await activate.mutateAsync(planId);
    void navigate('/');
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold uppercase leading-tight tracking-tight">
          <PenLine size={20} className="text-brand" aria-hidden="true" />
          {detalle.name ?? 'Plan a mano'}
        </h1>
        {/* Regla dura 4: el plan del motor cita investigación en cada número.
            Este no cita nada, y decirlo una vez arriba es más honesto que
            repetirlo en cada ejercicio o —peor— no decirlo. */}
        <Notice tone="warn">
          Los números de este plan los elegís vos. La app los guarda y los muestra tal cual: no
          pasan por el motor, no salen de la investigación, y nadie revisa si te falta cubrir algún
          patrón o si el volumen semanal queda corto.
        </Notice>
      </div>

      {sessions.length === 0 && !abriendoDia && (
        <EmptyState
          icon={<ClipboardList size={24} aria-hidden="true" />}
          title="Todavía no tiene ningún día"
          action={
            <Button variant="primary" size="lg" onClick={() => setAbriendoDia(true)}>
              <Plus size={16} aria-hidden="true" />
              Agregar el primer día
            </Button>
          }
        >
          Agregá uno ahora y el resto cuando quieras. No hace falta armar la semana entera de una.
        </EmptyState>
      )}

      {sessions.map((session) => (
        <ManualSessionCard
          key={session.id}
          session={session}
          onDelete={() => removeSession.mutate(session.id)}
          onDeleteItem={(itemId) => removeItem.mutate(itemId)}
          cargando={cargandoEn === session.id}
          onOpenForm={() => setCargandoEn(session.id)}
          form={
            cargandoEn === session.id && catalogo.data ? (
              <ManualItemForm
                exercises={catalogo.data.gym.exercises}
                equipment={catalogo.data.gym.equipment}
                pending={addItem.isPending}
                error={addItem.isError}
                onCancel={() => setCargandoEn(null)}
                onAdd={(draft) => addItem.mutate({ sessionId: session.id, draft })}
              />
            ) : null
          }
        />
      ))}

      {(sessions.length > 0 || abriendoDia) &&
        (abriendoDia ? (
          <NuevoDia
            pending={addSession.isPending}
            error={addSession.isError}
            onCancel={() => setAbriendoDia(false)}
            onCreate={async (draft) => {
              await addSession.mutateAsync(draft);
              setAbriendoDia(false);
            }}
          />
        ) : (
          <Button
            variant="ghost"
            size="md"
            className="self-start"
            onClick={() => setAbriendoDia(true)}
          >
            <Plus size={16} aria-hidden="true" />
            Agregar otro día
          </Button>
        ))}

      {detalle.status !== 'active' && conEjercicios.length > 0 && (
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-sm leading-relaxed text-slate">
            Tiene {conEjercicios.length} {conEjercicios.length === 1 ? 'día' : 'días'} con
            ejercicios. Al empezar a usarlo, el plan que tenías activo queda guardado donde lo
            dejaste, y podés seguir agregándole días a este.
          </p>
          <Button
            variant="primary"
            size="lg"
            disabled={activate.isPending}
            onClick={() => void activar()}
          >
            {activate.isPending && (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            )}
            Empezar a usarlo
          </Button>
          {activate.isError && (
            <Notice tone="error" role="alert">
              No se pudo activar el plan. Probá de nuevo.
            </Notice>
          )}
        </Card>
      )}

      {detalle.status === 'active' && (
        <Notice tone="info">
          Es el plan que estás usando. Lo que agregues acá aparece en "Hoy" en cuanto te toque.
        </Notice>
      )}
    </div>
  );
}

/**
 * Un día nuevo: cómo se llama y cuánto lleva.
 *
 * Los minutos los declara la persona. El motor los saca del template del
 * ruleset, y acá no hay template: deducirlos de la suma de descansos daría
 * menos de la mitad del tiempo real, y usar un promedio por serie sería
 * inventar un número de entrenamiento (regla dura 3).
 */
function NuevoDia({
  onCreate,
  onCancel,
  pending,
  error,
}: {
  readonly onCreate: (draft: { focus: string; estimatedMinutes: number }) => Promise<void>;
  readonly onCancel: () => void;
  readonly pending: boolean;
  readonly error: boolean;
}) {
  const [focus, setFocus] = useState('');
  const [minutos, setMinutos] = useState('');

  const min = Number(minutos.trim());
  const listo = focus.trim().length > 0 && Number.isFinite(min) && min > 0;

  return (
    <Card className="flex flex-col gap-3.5 p-4">
      <Field
        label="Nombre del día"
        htmlFor="nuevo-dia-focus"
        hint="Lo que vas a hacer ese día: “Pierna y core”, “Empuje”."
      >
        <input
          id="nuevo-dia-focus"
          type="text"
          maxLength={60}
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          placeholder="Pierna y core"
          className={fieldClass}
        />
      </Field>

      <Field
        label="Cuánto te lleva (min)"
        htmlFor="nuevo-dia-min"
        hint="Tu estimación. La app no la deduce sola."
      >
        <input
          id="nuevo-dia-min"
          type="number"
          inputMode="numeric"
          min={1}
          value={minutos}
          onChange={(e) => setMinutos(e.target.value)}
          className={fieldClass}
        />
      </Field>

      {error && (
        <Notice tone="error" role="alert">
          No se pudo agregar el día. Probá de nuevo.
        </Notice>
      )}

      <div className="flex gap-2">
        <Button variant="quiet" size="md" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          disabled={!listo || pending}
          onClick={() => void onCreate({ focus: focus.trim(), estimatedMinutes: Math.round(min) })}
        >
          {pending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          Agregar el día
        </Button>
      </div>
    </Card>
  );
}
