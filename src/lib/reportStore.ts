/**
 * Monitoring-report persistence (Quantum Tracker → Supabase).
 *
 * Saves a parsed quarterly monitoring report (report row + outputs +
 * milestones) and uploads the original file to the `monitoring-reports`
 * Storage bucket. Offline (no Supabase configured) both functions are cheap
 * no-ops so the tracker keeps its current fully-client-side behavior.
 *
 * IMPORTANT (learned the hard way): callers must invoke saveMonitoringReport
 * fire-and-forget AFTER rendering parse results — never block the
 * "EXTRACTING…" overlay on network I/O.
 */
import { hasSupabase, supabase } from './supabase';
import type { MonitoringData } from './parseMonitoringReport';

export interface SavedReport {
  id: number;
  office: string;
  period: string;
  uploadedBy: string | null;
  uploadedAt: string;
  totalMilestones: number;
  achieved: number;
  notAchieved: number;
  overachieved: number;
  yetToReport: number;
}

export async function saveMonitoringReport(
  data: MonitoringData,
  file: File | null,
  uploadedBy: string,
): Promise<number | null> {
  if (!hasSupabase) return null;
  const sb = supabase();

  // 1) original file → Storage (best-effort; the parsed rows matter more)
  let rawFilePath: string | null = null;
  if (file) {
    const path = `${data.office}/${data.period}/${Date.now()}-${file.name}`.replace(/\s+/g, '_');
    const { error } = await sb.storage.from('monitoring-reports').upload(path, file, { upsert: false });
    if (!error) rawFilePath = path;
    else console.error('[supabase] report file upload:', error.message);
  }

  // 2) report row (MonitoringData keeps its summary counts at the top level)
  const { data: rep, error: repErr } = await sb
    .from('monitoring_reports')
    .insert({
      office: data.office,
      period: data.period,
      uploaded_by: uploadedBy,
      total_milestones: data.totalMilestones,
      progress_reported: data.reported,
      yet_to_report: data.pending,
      achieved: data.achieved,
      not_achieved: data.notAchieved,
      overachieved: data.overachieved,
      raw_file_path: rawFilePath,
    })
    .select('id')
    .single();
  if (repErr || !rep) {
    console.error('[supabase] report insert:', repErr?.message);
    return null;
  }

  // 3) outputs + milestones
  for (const output of data.outputs) {
    const { data: out, error: outErr } = await sb
      .from('monitoring_outputs')
      .insert({ report_id: rep.id, code: output.id, title: output.label })
      .select('id')
      .single();
    if (outErr || !out) { console.error('[supabase] output insert:', outErr?.message); continue; }
    const rows = output.indicators.map((m) => ({
      output_id: out.id,
      label: m.label,
      status: m.status,
      responsible: m.responsiblePerson ?? null,
    }));
    if (rows.length) {
      const { error } = await sb.from('monitoring_milestones').insert(rows);
      if (error) console.error('[supabase] milestones insert:', error.message);
    }
  }
  return rep.id;
}

export async function listMonitoringReports(count = 10): Promise<SavedReport[]> {
  if (!hasSupabase) return [];
  const { data, error } = await supabase()
    .from('monitoring_reports')
    .select('id, office, period, uploaded_by, uploaded_at, total_milestones, achieved, not_achieved, overachieved, yet_to_report')
    .order('uploaded_at', { ascending: false })
    .limit(count);
  if (error) { console.error('[supabase] listMonitoringReports:', error.message); return []; }
  return (data ?? []).map((r: any) => ({
    id: r.id, office: r.office, period: r.period,
    uploadedBy: r.uploaded_by, uploadedAt: r.uploaded_at,
    totalMilestones: r.total_milestones, achieved: r.achieved,
    notAchieved: r.not_achieved, overachieved: r.overachieved, yetToReport: r.yet_to_report,
  }));
}
