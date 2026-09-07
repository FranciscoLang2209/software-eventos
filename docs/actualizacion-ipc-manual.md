# Ejecucion manual: actualizacion de precios por IPC

El script listo para ejecutar esta en [`sql/actualizacion-ipc.sql`](sql/actualizacion-ipc.sql). Ejecutalo desde el SQL Editor del proyecto Supabase con una cuenta administrativa del proyecto.

## Checklist

1. Exportar o respaldar el esquema y las tablas `ipc_indices`, `actualizaciones_ipc`, `evento_servicios`, `evento_servicios_historial` y `audit_log`.
2. Ejecutar el script completo una sola vez; la transaccion hace rollback si falla cualquiera de sus sentencias.
3. Ejecutar las consultas de inspeccion y confirmar que las RPC, políticas, grants, constraint e índices figuren con los nombres esperados.
4. Ejecutar la previsualización con una cuenta admin y contrastar los importes contra eventos de prueba.
5. Probar la aplicación con un período de prueba dentro de una transacción que termine en `rollback`; luego ejecutar la aplicación real sólo para el período que corresponda.
6. Desplegar la aplicación TypeScript después de ejecutar el SQL. La pantalla no funcionará hasta que ambas RPC estén disponibles.

## Inspeccion del esquema

```sql
select table_name, row_security
from information_schema.tables
where table_schema = 'public'
  and table_name in ('ipc_indices', 'actualizaciones_ipc');

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid in ('public.ipc_indices'::regclass, 'public.actualizaciones_ipc'::regclass)
order by conrelid::regclass::text, conname;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('ipc_indices', 'actualizaciones_ipc')
order by tablename, indexname;

select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('ipc_indices', 'actualizaciones_ipc');

select routine_name, routine_type, security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('previsualizar_actualizacion_ipc', 'registrar_y_aplicar_ipc');

select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('previsualizar_actualizacion_ipc', 'registrar_y_aplicar_ipc')
order by routine_name, grantee;
```

## Previsualizacion y aplicacion reversibles

Las RPC validan el usuario de `auth.uid()`. Ejecutalas desde una sesion autenticada como administrador o mediante la aplicacion; el SQL Editor no simula por si mismo una identidad de usuario final.

```sql
-- Reemplazar por un período que no esté cargado. No modifica datos.
select *
from public.previsualizar_actualizacion_ipc('2026-10-01'::date, 2.5::numeric);

-- Prueba transaccional: ejecutar como admin autenticado y cerrar con ROLLBACK.
begin;
select *
from public.registrar_y_aplicar_ipc('2026-10-01'::date, 2.5::numeric);
select periodo, variacion_porcentual
from public.ipc_indices
where periodo = '2026-10-01'::date;
rollback;
```

## Permisos y duplicados en una sesión simulada

Reemplazar los UUID por un administrador y un vendedor reales. `set local role`
evita que la sesión de SQL Editor conserve la identidad simulada después del
`rollback`.

```sql
-- Un administrador puede consultar IPCs y ejecutar la previsualización.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'UUID_ADMIN', true);
select auth.uid(), public.current_user_is_active_admin();
select * from public.ipc_indices;
select * from public.previsualizar_actualizacion_ipc('2026-10-01'::date, 2.5::numeric);
rollback;

-- Un vendedor no puede leer IPCs ni ejecutar las RPC.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'UUID_VENDEDOR', true);
select auth.uid(), public.current_user_is_active_admin();
select * from public.ipc_indices; -- debe devolver cero filas por RLS
select * from public.previsualizar_actualizacion_ipc('2026-10-01'::date, 2.5::numeric);
rollback; -- la última sentencia debe fallar con 42501
```

Para probar duplicados sin persistir datos, ejecutar como administrador autenticado:

```sql
begin;
do $$
begin
  perform public.registrar_y_aplicar_ipc('2026-10-01'::date, 2.5::numeric);
  begin
    perform public.registrar_y_aplicar_ipc('2026-10-01'::date, 2.5::numeric);
    raise exception 'La segunda aplicación no fue rechazada.';
  exception when unique_violation then
    null;
  end;
end;
$$;
rollback;
```

## Atomicidad ante un fallo

La siguiente prueba instala un trigger que fuerza una falla durante el `UPDATE`.
Todo sucede dentro de una transacción y termina con `rollback`, incluidos el
trigger y la función temporarios.

```sql
begin;

create function public.ipc_prueba_forzar_fallo()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Fallo de prueba IPC';
end;
$$;

create trigger ipc_prueba_forzar_fallo
before update on public.evento_servicios
for each row execute function public.ipc_prueba_forzar_fallo();

set local role authenticated;
select set_config('request.jwt.claim.sub', 'UUID_ADMIN', true);

do $$
begin
  begin
    perform public.registrar_y_aplicar_ipc('2026-10-01'::date, 2.5::numeric);
    raise exception 'La aplicación debía fallar.';
  exception when others then
    if exists (
      select 1 from public.ipc_indices where periodo = '2026-10-01'::date
    ) then
      raise exception 'El IPC quedó registrado pese al rollback.';
    end if;
  end;
end;
$$;

rollback;
```

## Consultas de verificacion funcional

```sql
-- Servicios excluidos por cualquier pago ordinario activo, incluidos anticipos.
select evento_servicio.id as evento_servicio_id, pago.id as pago_id, pago.es_garantia
from public.evento_servicios evento_servicio
join public.pagos pago on pago.evento_servicio_id = evento_servicio.id
where pago.deleted_at is null
  and pago.es_garantia is not true;

-- Las garantias activas no excluyen por sí solas al servicio.
select evento_servicio.id as evento_servicio_id, pago.id as garantia_id
from public.evento_servicios evento_servicio
join public.pagos pago on pago.evento_servicio_id = evento_servicio.id
where pago.deleted_at is null
  and pago.es_garantia is true
  and not exists (
    select 1
    from public.pagos pago_ordinario
    where pago_ordinario.evento_servicio_id = evento_servicio.id
      and pago_ordinario.deleted_at is null
      and pago_ordinario.es_garantia is not true
  );

-- Para un IPC de prueba recién aplicado, estos eventos no deben aparecer.
select
  evento.id as evento_id,
  evento.estado,
  evento.fecha_evento,
  evento.deleted_at,
  actualizacion.id as actualizacion_ipc_id
from public.eventos evento
join public.evento_servicios evento_servicio on evento_servicio.evento_id = evento.id
join public.actualizaciones_ipc actualizacion
  on actualizacion.evento_servicio_id = evento_servicio.id
join public.ipc_indices ipc on ipc.id = actualizacion.ipc_indice_id
where ipc.periodo = '2026-10-01'::date
  and (
    evento.deleted_at is not null
    or evento.estado <> 'confirmado'::public.estado_evento
    or evento.fecha_evento < timezone('America/Argentina/Buenos_Aires', now())::date
  );

-- Evidencia de idempotencia: una aplicación por servicio para cada IPC.
select ipc.periodo, actualizacion.evento_servicio_id, count(*)
from public.actualizaciones_ipc actualizacion
join public.ipc_indices ipc on ipc.id = actualizacion.ipc_indice_id
group by ipc.periodo, actualizacion.evento_servicio_id
having count(*) > 1;

-- Los servicios aplicados preservan lo pagado y reflejan sus valores auditables.
select
  ipc.periodo,
  actualizacion.evento_servicio_id,
  actualizacion.valor_inicial,
  actualizacion.valor_ajustado,
  evento_servicio.total_pagado,
  evento_servicio.total_sin_iva,
  evento_servicio.total_con_iva,
  evento_servicio.saldo_pendiente
from public.actualizaciones_ipc actualizacion
join public.ipc_indices ipc on ipc.id = actualizacion.ipc_indice_id
join public.evento_servicios evento_servicio on evento_servicio.id = actualizacion.evento_servicio_id
where ipc.periodo = '2026-10-01'::date;
```

Para comprobar permisos, iniciar sesion como vendedor y llamar ambas RPC desde la consola de la aplicación o una petición autenticada a PostgREST: deben responder `42501`. Un segundo intento de aplicar el mismo período como admin debe responder `23505`, sin modificar servicios.
