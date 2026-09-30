import type { SubstituteOption } from '@bh/engine';

/**
 * La marca corta de una alternativa en las listas compactas (vista previa del
 * plan, Explorar): cuál es la recomendada y cuál pide más técnica que la del
 * socio. Reemplaza al porcentaje de equivalencia, que no le decía a nadie si
 * convenía o no. El aviso entero va en el `title`.
 */
export function OpcionMarca({ option }: { option: SubstituteOption }) {
  if (option.warning) {
    return (
      <span
        title={option.warning}
        className="shrink-0 font-display text-[0.6rem] uppercase tracking-[0.12em] text-orange"
      >
        más técnico
      </span>
    );
  }
  if (!option.recommended) return null;
  return (
    <span className="shrink-0 font-display text-[0.6rem] uppercase tracking-[0.12em] text-brand">
      recomendado
    </span>
  );
}
