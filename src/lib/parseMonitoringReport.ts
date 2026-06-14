/**
 * Parser for UNFPA Quarterly Monitoring Reports (the PDF/text exported from the
 * monitoring system). Pulls the authoritative summary block, the office/period,
 * and the programme-cycle outputs + milestones, so the Quantum Tracker dashboard
 * reflects the real uploaded file instead of mock data.
 */

export type MilestoneStatus = 'Achieved' | 'Overachieved' | 'Not Achieved' | 'Yet to be Reported';

export interface MonitoringIndicator {
  label: string;
  status: MilestoneStatus;
  value?: string | number;
  target?: string | number;
  responsiblePerson: string;
  trend: number[];
  flag: 'critical' | 'warning' | 'stable';
}

export interface MonitoringOutput {
  id: string;
  label: string;
  outputInsight?: string;
  indicators: MonitoringIndicator[];
}

export interface MonitoringData {
  office: string;
  period: string;
  totalMilestones: number;
  reported: number;
  achieved: number;
  notAchieved: number;
  overachieved: number;
  pending: number;
  narrativeInsight?: string;
  managementReport?: string;
  outputs: MonitoringOutput[];
}

/** Replace common PDF ligatures so labels like "Oﬃce" become "Office". */
function deligature(s: string): string {
  return s
    .replace(/ﬀ/g, 'ff')
    .replace(/ﬁ/g, 'fi')
    .replace(/ﬂ/g, 'fl')
    .replace(/ﬃ/g, 'ffi')
    .replace(/ﬄ/g, 'ffl');
}

const STATUS_ALT = '(Overachieved|Not Achieved|Achieved|Yet to be Reported)';

/** Pull the trailing integer from the first summary line that starts with `label`. */
function summaryNumber(lines: string[], label: RegExp): number | null {
  for (const raw of lines) {
    const line = raw.trim();
    if (label.test(line)) {
      const ints = line.match(/\d+/g);
      if (ints && ints.length) return parseInt(ints[ints.length - 1], 10);
    }
  }
  return null;
}

function toNum(v: string | undefined): number {
  if (!v) return 0;
  const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

function flagFor(status: MilestoneStatus): 'critical' | 'warning' | 'stable' {
  if (status === 'Not Achieved') return 'critical';
  if (status === 'Yet to be Reported') return 'warning';
  return 'stable';
}

/**
 * Parse the extracted text of a monitoring report. Returns null when the
 * authoritative summary block can't be found, so callers can fall back.
 */
export function parseMonitoringReport(rawText: string, fileName = ''): MonitoringData | null {
  const text = deligature(rawText).replace(/\r/g, '');
  const lines = text.split('\n');

  // --- Office + period -----------------------------------------------------
  let office = '';
  let period = '';
  const title = text.match(
    /Monitoring Report\s+of\s+(Q[1-4]\s*\d{4})\s+for\s+([\s\S]+?)\s+(?:Deadline|Status|Summary|Printed)/i,
  );
  if (title) {
    period = title[1].replace(/\s+/g, ' ').trim();
    office = title[2].replace(/\s+/g, ' ').trim();
  }
  if (!period) {
    const p = text.match(/\bQ([1-4])\s*(\d{4})\b/);
    if (p) period = `Q${p[1]} ${p[2]}`;
  }
  if (!office) {
    const cleaned = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
    const m = cleaned.match(/for\s+(.+)/i);
    office = (m ? m[1] : cleaned).replace(/\s+\d{4}.*$/, '').trim() || 'Uploaded Office';
  }

  // --- Summary block (authoritative counts) --------------------------------
  const sumStart = text.search(/Summary\s*:?/i);
  const sumEnd = text.search(/Programme Cycle Outputs/i);
  const summaryLines = (sumStart >= 0
    ? text.slice(sumStart, sumEnd > sumStart ? sumEnd : sumStart + 600)
    : text
  ).split('\n');

  const totalMilestones = summaryNumber(summaryLines, /^Total\s+milestones/i);
  const reported = summaryNumber(summaryLines, /^Progress\s+Reported/i);
  const pending = summaryNumber(summaryLines, /^Yet\s+to\s+be\s+Reported/i);
  const achieved = summaryNumber(summaryLines, /^Achieved\b/i);
  const notAchieved = summaryNumber(summaryLines, /^Not\s+Achieved/i);
  const overachieved = summaryNumber(summaryLines, /^Overachieved/i);

  // Require the core summary to consider this a valid monitoring report.
  if (totalMilestones == null || achieved == null) return null;

  // --- Outputs -------------------------------------------------------------
  const outputs: MonitoringOutput[] = [];
  const outputRe = /^([A-Z]{2,4}\d{2,3}[A-Z]{2,4}):\s*(.+)$/gm;
  const headers: { id: string; label: string; index: number }[] = [];
  let oh: RegExpExecArray | null;
  while ((oh = outputRe.exec(text)) !== null) {
    if (!headers.find((h) => h.id === oh![1])) {
      headers.push({ id: oh[1], label: oh[2].replace(/\s+/g, ' ').trim(), index: oh.index });
    }
  }

  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].index;
    const end = i + 1 < headers.length ? headers[i + 1].index : text.length;
    const slice = text.slice(start, end);
    const indicators = parseMilestones(slice);
    outputs.push({ id: headers[i].id, label: headers[i].label, indicators });
  }

  return {
    office,
    period: period || 'Q1 2026',
    totalMilestones,
    reported: reported ?? totalMilestones,
    achieved,
    notAchieved: notAchieved ?? 0,
    overachieved: overachieved ?? 0,
    pending: pending ?? Math.max(0, totalMilestones - (reported ?? totalMilestones)),
    outputs,
  };
}

/** Extract individual milestones (indicators) from one output's text slice. */
function parseMilestones(slice: string): MonitoringIndicator[] {
  const indicators: MonitoringIndicator[] = [];
  const milestoneRe = /Milestone:\s*([\s\S]*?)\s*(?:Type:|$)/g;
  let m: RegExpExecArray | null;
  while ((m = milestoneRe.exec(slice)) !== null && indicators.length < 20) {
    const label = m[1].replace(/\s+/g, ' ').trim();
    if (!label) continue;
    const after = slice.slice(m.index, m.index + 1200);

    const personMatch = after.match(/Responsible person:\s*([^\n]+)/i);
    const responsiblePerson = personMatch ? personMatch[1].trim().split(/\s{2,}/)[0].trim() : '—';

    const rowMatch = after.match(new RegExp(`\\bQ[1-4]\\s+(\\S+)\\s+(\\S+)\\s+${STATUS_ALT}`));
    let status: MilestoneStatus = 'Yet to be Reported';
    let target: string | number | undefined;
    let value: string | number | undefined;
    if (rowMatch) {
      target = rowMatch[1];
      value = rowMatch[2];
      status = rowMatch[3] as MilestoneStatus;
    }

    indicators.push({
      label: label.length > 160 ? label.slice(0, 157) + '…' : label,
      status,
      value,
      target,
      responsiblePerson,
      trend: [0, 0, Math.round(toNum(value as string) * 0.6), toNum(value as string)],
      flag: flagFor(status),
    });
  }
  return indicators;
}

/* ------------------------------------------------------------------------- */
/* Browser file -> text extraction                                            */
/* ------------------------------------------------------------------------- */

let workerInitialized = false;
async function getPdfjs() {
  const pdfjs = await import('pdfjs-dist');
  if (!workerInitialized) {
    // Vite bundles `?worker` imports into a real Web Worker constructor — the
    // most reliable way to wire up the pdfjs worker across dev and build.
    const PdfWorker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?worker')).default;
    pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();
    workerInitialized = true;
  }
  return pdfjs;
}

/** Extract text from a PDF File, reconstructing lines from text-item positions. */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await getPdfjs();
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Group items into lines by their vertical position.
    const rows = new Map<number, { x: number; w: number; h: number; s: string }[]>();
    for (const item of content.items as any[]) {
      if (typeof item.str !== 'string') continue;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)!.push({ x, w: item.width || 0, h: item.height || 0, s: item.str });
    }
    const ys = [...rows.keys()].sort((a, b) => b - a);
    const lineStrs = ys.map((y) => {
      const items = rows.get(y)!.sort((a, b) => a.x - b.x);
      let line = '';
      let prevEnd: number | null = null;
      for (const it of items) {
        if (prevEnd !== null) {
          const gap = it.x - prevEnd;
          // Only insert a space when there's a real gap. pdfjs splits ligatures
          // (e.g. "Office" -> "O","ffi","ce") into adjacent items with no gap.
          const threshold = Math.max(0.6, (it.h || 6) * 0.18);
          if (gap > threshold) line += ' ';
        }
        line += it.s;
        prevEnd = it.x + it.w;
      }
      return line.replace(/\s+/g, ' ').trim();
    });
    pages.push(lineStrs.join('\n'));
  }
  return pages.join('\n');
}

/** Extract text from a supported uploaded file (PDF or plain text). */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return extractPdfText(file);
  if (name.endsWith('.txt') || file.type.startsWith('text/')) return file.text();
  // .docx and others aren't text-extractable here; signal caller to fall back.
  throw new Error(`Unsupported file type for parsing: ${file.name}`);
}
