-- Actualizacion mensual de precios por IPC
-- Ejecutar como administrador desde Supabase SQL Editor.
-- El script es incremental e idempotente respecto de sus objetos de esquema.

begin;

create table if not exists public.ipc_indices (
  id uuid primary key default gen_random_uuid(),
  periodo date not null,
  variacion_porcentual numeric(12, 4) not null,
  usuario_id uuid not null references public.usuarios(id),
  created_at timestamptz not null default now(),
  constraint ipc_indices_periodo_primer_dia_check
    check (periodo = date_trunc('month', periodo)::date),
  constraint ipc_indices_variacion_valida_check
    check (
      variacion_porcentual <> 'NaN'::numeric
      and variacion_porcentual > -100
    ),
  constraint ipc_indices_periodo_key unique (periodo)
);

alter table public.actualizaciones_ipc
  add column if not exists ipc_indice_id uuid;

alter table public.actualizaciones_ipc
  drop constraint if exists actualizaciones_ipc_ipc_indice_id_fkey;

alter table public.actualizaciones_ipc
  add constraint actualizaciones_ipc_ipc_indice_id_fkey
  foreign key (ipc_indice_id)
  references public.ipc_indices(id)
  on delete restrict;

create unique index if not exists actualizaciones_ipc_indice_servicio_key
  on public.actualizaciones_ipc (ipc_indice_id, evento_servicio_id)
  where ipc_indice_id is not null;

create index if not exists actualizaciones_ipc_ipc_indice_id_idx
  on public.actualizaciones_ipc (ipc_indice_id);

create index if not exists ipc_indices_periodo_desc_idx
  on public.ipc_indices (periodo desc);

alter table public.ipc_indices enable row level security;
alter table public.actualizaciones_ipc enable row level security;

drop policy if exists ipc_indices_select_active_admin on public.ipc_indices;
create policy ipc_indices_select_active_admin
  on public.ipc_indices
  for select
  to authenticated
  using (public.current_user_is_active_admin());

drop policy if exists actualizaciones_ipc_select_active_admin on public.actualizaciones_ipc;
create policy actualizaciones_ipc_select_active_admin
  on public.actualizaciones_ipc
  for select
  to authenticated
  using (public.current_user_is_active_admin());

revoke insert, update, delete on public.ipc_indices from anon, authenticated;
revoke insert, update, delete on public.actualizaciones_ipc from anon, authenticated;
grant select on public.ipc_indices to authenticated;
grant select on public.actualizaciones_ipc to authenticated;

-- Detecta si los triggers existentes ya escriben el historial/auditoria. El
-- procedimiento usa estos datos para no duplicar entradas en instalaciones que
-- todavia no tengan esos triggers.
create or replace function public.ipc_evento_servicio_has_automatic_log(
  p_text text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from pg_trigger trigger_row
    join pg_proc trigger_function on trigger_function.oid = trigger_row.tgfoid
    where trigger_row.tgrelid = 'public.evento_servicios'::regclass
      and not trigger_row.tgisinternal
      and (
        pg_get_triggerdef(trigger_row.oid) ilike '%' || p_text || '%'
        or pg_get_functiondef(trigger_function.oid) ilike '%' || p_text || '%'
      )
  );
$$;

create or replace function public.previsualizar_actualizacion_ipc(
  p_periodo date,
  p_variacion_porcentual numeric
)
returns table (
  cantidad_servicios bigint,
  cantidad_eventos bigint,
  monto_precio_base_anterior numeric,
  monto_precio_base_proyectado numeric,
  monto_total_con_iva_anterior numeric,
  monto_total_con_iva_proyectado numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_periodo date := date_trunc('month', p_periodo)::date;
begin
  if auth.uid() is null or not public.current_user_is_active_admin() then
    raise exception 'Solo los administradores activos pueden previsualizar un IPC.'
      using errcode = '42501';
  end if;

  if p_periodo is null or p_variacion_porcentual is null
    or p_variacion_porcentual = 'NaN'::numeric
    or p_variacion_porcentual <= -100 then
    raise exception 'El periodo y la variacion porcentual son invalidos.'
      using errcode = '22023';
  end if;

  if exists (select 1 from public.ipc_indices where periodo = v_periodo) then
    raise exception 'Ya existe un IPC registrado para este periodo.'
      using errcode = '23505', constraint = 'ipc_indices_periodo_key';
  end if;

  return query
  with elegibles as materialized (
    select
      evento_servicio.id,
      evento_servicio.evento_id,
      coalesce(evento_servicio.precio_base, 0)::numeric as precio_base,
      coalesce(evento_servicio.total_con_iva, 0)::numeric as total_con_iva
    from public.evento_servicios evento_servicio
    join public.eventos evento on evento.id = evento_servicio.evento_id
    where evento.deleted_at is null
      and evento.estado = 'confirmado'::public.estado_evento
      and evento.fecha_evento >= timezone('America/Argentina/Buenos_Aires', now())::date
      and not exists (
        select 1
        from public.pagos pago
        where pago.evento_servicio_id = evento_servicio.id
          and pago.deleted_at is null
          and pago.es_garantia is not true
      )
  )
  select
    count(*)::bigint,
    count(distinct evento_id)::bigint,
    coalesce(sum(precio_base), 0)::numeric,
    coalesce(sum(round(precio_base * (1 + p_variacion_porcentual / 100), 2)), 0)::numeric,
    coalesce(sum(total_con_iva), 0)::numeric,
    coalesce(sum(total_con_iva + round(precio_base * (p_variacion_porcentual / 100), 2)), 0)::numeric
  from elegibles;
end;
$$;

create or replace function public.registrar_y_aplicar_ipc(
  p_periodo date,
  p_variacion_porcentual numeric
)
returns table (
  ipc_indice_id uuid,
  cantidad_servicios bigint,
  cantidad_eventos bigint,
  monto_precio_base_anterior numeric,
  monto_precio_base_actualizado numeric,
  monto_total_con_iva_anterior numeric,
  monto_total_con_iva_actualizado numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_periodo date := date_trunc('month', p_periodo)::date;
  v_ipc_indice_id uuid;
  v_historial_automatico boolean;
  v_auditoria_automatica boolean;
begin
  if auth.uid() is null or not public.current_user_is_active_admin() then
    raise exception 'Solo los administradores activos pueden aplicar un IPC.'
      using errcode = '42501';
  end if;

  if p_periodo is null or p_variacion_porcentual is null
    or p_variacion_porcentual = 'NaN'::numeric
    or p_variacion_porcentual <= -100 then
    raise exception 'El periodo y la variacion porcentual son invalidos.'
      using errcode = '22023';
  end if;

  insert into public.ipc_indices (periodo, variacion_porcentual, usuario_id)
  values (v_periodo, p_variacion_porcentual, auth.uid())
  returning id into v_ipc_indice_id;

  v_historial_automatico := public.ipc_evento_servicio_has_automatic_log('evento_servicios_historial');
  v_auditoria_automatica := public.ipc_evento_servicio_has_automatic_log('audit_log');

  return query
  with elegibles as materialized (
    select
      evento_servicio.id,
      evento_servicio.evento_id,
      coalesce(evento_servicio.precio_base, 0)::numeric as precio_base_anterior,
      coalesce(evento_servicio.total_con_iva, 0)::numeric as total_con_iva_anterior
    from public.evento_servicios evento_servicio
    join public.eventos evento on evento.id = evento_servicio.evento_id
    where evento.deleted_at is null
      and evento.estado = 'confirmado'::public.estado_evento
      and evento.fecha_evento >= timezone('America/Argentina/Buenos_Aires', now())::date
      and not exists (
        select 1
        from public.pagos pago
        where pago.evento_servicio_id = evento_servicio.id
          and pago.deleted_at is null
          and pago.es_garantia is not true
      )
    for update of evento_servicio
  ), actualizados as (
    update public.evento_servicios evento_servicio
    set
      precio_base = round(elegibles.precio_base_anterior * (1 + p_variacion_porcentual / 100), 2),
      updated_at = now()
    from elegibles
    where evento_servicio.id = elegibles.id
    returning
      evento_servicio.id,
      elegibles.evento_id,
      elegibles.precio_base_anterior,
      evento_servicio.precio_base::numeric as precio_base_actualizado,
      elegibles.total_con_iva_anterior,
      coalesce(evento_servicio.total_con_iva, 0)::numeric as total_con_iva_actualizado
  ), aplicaciones as (
    insert into public.actualizaciones_ipc (
      evento_servicio_id,
      ipc_indice_id,
      valor_inicial,
      fecha_inicio,
      indec_mes_anterior,
      indec_mes_ajuste,
      porcentaje_aplicado,
      valor_ajustado,
      fecha_ajuste,
      tipo,
      usuario_id
    )
    select
      id,
      v_ipc_indice_id,
      precio_base_anterior,
      v_periodo,
      null,
      null,
      p_variacion_porcentual,
      precio_base_actualizado,
      timezone('America/Argentina/Buenos_Aires', now())::date,
      'ipc'::public.tipo_actualizacion,
      auth.uid()
    from actualizados
    returning evento_servicio_id, valor_inicial, valor_ajustado
  ), historial_respaldo as (
    insert into public.evento_servicios_historial (
      evento_servicio_id,
      campo_modificado,
      valor_anterior,
      valor_nuevo,
      motivo,
      usuario_id
    )
    select
      aplicaciones.evento_servicio_id,
      'precio_base',
      aplicaciones.valor_inicial::text,
      aplicaciones.valor_ajustado::text,
      'Actualizacion por IPC ' || to_char(v_periodo, 'YYYY-MM'),
      auth.uid()
    from aplicaciones
    where not v_historial_automatico
  ), auditoria_respaldo as (
    insert into public.audit_log (
      accion,
      tabla,
      registro_id,
      datos_anteriores,
      datos_nuevos,
      usuario_id
    )
    select
      'UPDATE'::public.accion_audit,
      'evento_servicios',
      aplicaciones.evento_servicio_id,
      jsonb_build_object('precio_base', aplicaciones.valor_inicial),
      jsonb_build_object('precio_base', aplicaciones.valor_ajustado, 'ipc_indice_id', v_ipc_indice_id),
      auth.uid()
    from aplicaciones
    where not v_auditoria_automatica
  )
  select
    v_ipc_indice_id,
    count(*)::bigint,
    count(distinct evento_id)::bigint,
    coalesce(sum(precio_base_anterior), 0)::numeric,
    coalesce(sum(precio_base_actualizado), 0)::numeric,
    coalesce(sum(total_con_iva_anterior), 0)::numeric,
    coalesce(sum(total_con_iva_actualizado), 0)::numeric
  from actualizados;
end;
$$;

revoke all on function public.ipc_evento_servicio_has_automatic_log(text) from public, anon, authenticated;
revoke all on function public.previsualizar_actualizacion_ipc(date, numeric) from public, anon;
revoke all on function public.registrar_y_aplicar_ipc(date, numeric) from public, anon;
grant execute on function public.previsualizar_actualizacion_ipc(date, numeric) to authenticated;
grant execute on function public.registrar_y_aplicar_ipc(date, numeric) to authenticated;

commit;
