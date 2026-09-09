import { EXPERIENCE_LEVELS, type ExperienceLevel, SEXES, type Sex } from '@bh/domain';
import { Check, X } from 'lucide-react';
import { type FormEvent, useEffect, useId, useRef, useState } from 'react';
import { EXPERIENCE_LABELS, SEX_LABELS } from '../lib/labels.ts';
import type { ProfileEdit } from '../lib/profile.ts';
import { Button, Field, fieldClass } from './ui/index.ts';

/**
 * EDITAR EL PERFIL
 *
 * El lápiz de "Tus datos" abría solo el formulario de peso y altura, así que
 * el nombre, la fecha de nacimiento, el sexo y el nivel se cargaban una vez en
 * el onboarding y quedaban congelados para siempre. Dos de esos entran al
 * motor: la edad cambia la ventana de intensidad a partir de los 60
 * (`docs/research/08-edad.md`) y el nivel decide qué ejercicios entran por
 * técnica (`docs/research/10-nivel-de-experiencia.md`). Un nivel mal elegido en
 * el onboarding se arrastraba a todos los planes sin forma de corregirlo.
 *
 * Lo que NO está acá es el rol ni el gimnasio. No es un olvido: son columnas de
 * privilegio de la misma tabla, y quien las frena de verdad es el trigger
 * `profiles_guard_privileges`, porque la política de RLS mira quién edita y no
 * qué columnas toca.
 */

/** La edad entra al motor, así que la fecha tiene que ser una fecha posible. */
const MIN_BIRTH_DATE = '1920-01-01';

export function ProfileForm({
  current,
  busy,
  onCancel,
  onSubmit,
}: {
  readonly current: ProfileEdit;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: (edit: ProfileEdit) => void;
}) {
  const [displayName, setDisplayName] = useState(current.displayName);
  const [birthDate, setBirthDate] = useState(current.birthDate ?? '');
  const [sex, setSex] = useState<Sex>(current.sex);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(current.experienceLevel);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const nameId = useId();
  const birthId = useId();
  const sexId = useId();
  const levelId = useId();

  useEffect(() => {
    // Por `ref` y no por `autoFocus`: el atributo también roba el foco al
    // rehidratar. Mismo criterio que `BodyMetricsForm`.
    nameRef.current?.focus();
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nombre = displayName.trim();
    if (!nombre) {
      setError('Poné un nombre para que la app sepa cómo llamarte.');
      return;
    }
    // Una fecha futura pasa el `type="date"` y después produce una edad
    // negativa que el motor lee sin quejarse.
    if (birthDate && birthDate > new Date().toISOString().slice(0, 10)) {
      setError('La fecha de nacimiento no puede ser futura.');
      return;
    }
    setError(null);
    onSubmit({
      displayName: nombre,
      birthDate: birthDate.trim() === '' ? null : birthDate,
      sex,
      experienceLevel,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-line/60 pt-3">
      <Field label="Cómo te llamamos" htmlFor={nameId}>
        <input
          id={nameId}
          ref={nameRef}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={60}
          autoComplete="name"
          className={fieldClass}
        />
      </Field>

      <Field
        label="Fecha de nacimiento"
        htmlFor={birthId}
        hint="A partir de los 60 el plan usa una ventana de carga distinta, medida en esa edad."
      >
        <input
          id={birthId}
          type="date"
          value={birthDate}
          min={MIN_BIRTH_DATE}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setBirthDate(e.target.value)}
          className={fieldClass}
        />
      </Field>

      <Field label="Sexo" htmlFor={sexId}>
        <select
          id={sexId}
          value={sex}
          onChange={(e) => setSex(e.target.value as Sex)}
          className={fieldClass}
        >
          {SEXES.map((s) => (
            <option key={s} value={s}>
              {SEX_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Nivel"
        htmlFor={levelId}
        hint="Decide qué ejercicios entran al plan por la técnica que piden."
      >
        <select
          id={levelId}
          value={experienceLevel}
          onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
          className={fieldClass}
        >
          {EXPERIENCE_LEVELS.map((l) => (
            <option key={l} value={l}>
              {EXPERIENCE_LABELS[l]}
            </option>
          ))}
        </select>
      </Field>

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={busy} className="flex-1">
          <Check size={14} aria-hidden="true" />
          {busy ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          <X size={14} aria-hidden="true" />
          Cancelar
        </Button>
      </div>
    </form>
  );
}
