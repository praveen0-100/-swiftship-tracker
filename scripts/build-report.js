// Builds docs/SwiftShip_Tracker_Project_Report.docx and an HTML copy (used for the PDF)
// from docs/SwiftShip_Tracker_Project_Report.md plus the screenshots in docs/screenshots.
// Usage: node scripts/build-report.js
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, ImageRun, LevelFormat, AlignmentType, PageBreak,
} = require('docx');

const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');
const mdPath = path.join(docsDir, 'SwiftShip_Tracker_Project_Report.md');
const shotsDir = path.join(docsDir, 'screenshots');

const SHOTS = [
  ['01-parcel-object-fields.jpg', 'Parcel object: fields and relationships'],
  ['02-parcel-record-P-001.jpg', 'Parcel record P-001 with all fields'],
  ['03-parcel-details.png', 'Parcel Details flow in Flow Builder (Active)'],
  ['04-retrieve-parcel-details.png', 'Retrieve Parcel Details prompt template'],
  ['04-report-parcels-by-status.jpg', 'Report: Parcels by Status'],
  ['05-report-overdue-parcels.jpg', 'Report: Overdue Parcels'],
  ['06-validation-error-weight-zero.jpg', 'Validation error when saving Weight = 0'],
  ['07-dashboard-swiftship-operations.jpg', 'Dashboard: SwiftShip Operations'],
  ['08-agent-preview-track-P-001.jpg', 'Agent preview: "Track parcel P-001"'],
  ['09-agent-active.jpg', 'Agent SwiftShip Tracker, Version 1 (Active)'],
].filter(([f]) => fs.existsSync(path.join(shotsDir, f)));

// ---------- markdown parsing ----------
function parseInline(text) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: text.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith('**')) out.push({ t: tok.slice(2, -2), b: true });
    else if (tok.startsWith('`')) out.push({ t: tok.slice(1, -1), code: true });
    else out.push({ t: tok.slice(1, -1), i: true });
    last = m.index + tok.length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out;
}

function parseMarkdown(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if ((m = /^(#{1,3})\s+(.*)$/.exec(line))) {
      blocks.push({ type: 'h', level: m[1].length, text: m[2] }); i++; continue;
    }
    if (line.trim().startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i].trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
        if (!cells.every(c => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      blocks.push({ type: 'table', rows }); continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++;
      }
      blocks.push({ type: 'ul', items }); continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|\s*[-*]\s+|\|)/.test(lines[i])) {
      para.push(lines[i].trim()); i++;
    }
    blocks.push({ type: 'p', text: para.join(' ') });
  }
  return blocks;
}

// ---------- image sizes ----------
function imageSize(file) {
  const b = fs.readFileSync(file);
  if (b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), type: 'png' };
  let p = 2;
  while (p < b.length) {
    if (b[p] !== 0xff) { p++; continue; }
    const marker = b[p + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: b.readUInt16BE(p + 5), w: b.readUInt16BE(p + 7), type: 'jpg' };
    }
    p += 2 + b.readUInt16BE(p + 2);
  }
  throw new Error('Unknown image: ' + file);
}

// ---------- DOCX ----------
const CONTENT_W = 9638; // A4 with 2 cm margins, in DXA
const FONT = 'Calibri';

function runs(text, base = {}) {
  return parseInline(text).map(s => new TextRun({
    text: s.t, bold: s.b || base.bold, italics: s.i, font: s.code ? 'Consolas' : FONT,
    size: s.code ? 20 : (base.size || 22), color: base.color,
  }));
}

function docxTable(rows) {
  const cols = rows[0].length;
  const base = Math.floor(CONTENT_W / cols);
  const widths = Array(cols).fill(base);
  widths[cols - 1] += CONTENT_W - base * cols;
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((r, ri) => new TableRow({
      tableHeader: ri === 0,
      children: widths.map((w, ci) => new TableCell({
        width: { size: w, type: WidthType.DXA },
        borders,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        shading: ri === 0 ? { type: ShadingType.CLEAR, fill: 'DCE9F7', color: 'auto' } : undefined,
        children: [new Paragraph({ children: runs(r[ci] || '', { bold: ri === 0, size: 20 }) })],
      })),
    })),
  });
}

function buildDocx(blocks) {
  const children = [];
  blocks.forEach((b, idx) => {
    if (b.type === 'h') {
      const lvl = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][b.level - 1];
      if (b.level === 1 && idx === 0) {
        children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: b.text, font: FONT })] }));
      } else {
        children.push(new Paragraph({ heading: lvl, children: [new TextRun({ text: b.text, font: FONT })] }));
      }
    } else if (b.type === 'p') {
      children.push(new Paragraph({ spacing: { after: 120 }, children: runs(b.text) }));
    } else if (b.type === 'ul') {
      b.items.forEach(t => children.push(new Paragraph({
        numbering: { reference: 'bullets', level: 0 }, spacing: { after: 40 }, children: runs(t),
      })));
    } else if (b.type === 'table') {
      children.push(docxTable(b.rows));
      children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    }
  });

  // screenshots appendix
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '12. Screenshots', font: FONT })] }));
  SHOTS.forEach(([file, caption], n) => {
    const full = path.join(shotsDir, file);
    const { w, h, type } = imageSize(full);
    const width = 600;
    const height = Math.round(width * h / w);
    children.push(new Paragraph({ keepNext: true, spacing: { before: 200, after: 60 }, children: [new TextRun({ text: `Figure ${n + 1}: ${caption}`, bold: true, font: FONT, size: 22 })] }));
    children.push(new Paragraph({
      spacing: { after: 160 },
      children: [new ImageRun({ type, data: fs.readFileSync(full), transformation: { width, height }, altText: { title: caption, description: caption, name: file } })],
    }));
  });

  return new Document({
    creator: 'Praveen P',
    title: 'SwiftShip Tracker: Project Report',
    styles: {
      default: { document: { run: { font: FONT, size: 22 } } },
      paragraphStyles: [
        { id: 'Title', name: 'Title', basedOn: 'Normal', run: { size: 44, bold: true, color: '1F3864', font: FONT }, paragraph: { spacing: { after: 160 } } },
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, color: '1F3864', font: FONT }, paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, color: '2E5597', font: FONT }, paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, color: '2E5597', font: FONT }, paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
      ],
    },
    numbering: {
      config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }],
    },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      children,
    }],
  });
}

// ---------- HTML (for PDF) ----------
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function htmlInline(text) {
  return parseInline(text).map(s => {
    const t = esc(s.t);
    return s.b ? `<b>${t}</b>` : s.code ? `<code>${t}</code>` : s.i ? `<i>${t}</i>` : t;
  }).join('');
}
function buildHtml(blocks) {
  let h = `<!doctype html><html><head><meta charset="utf-8"><title>SwiftShip Tracker: Project Report</title><style>
@page { size: A4; margin: 18mm 16mm; }
body { font-family: Calibri, "Segoe UI", Arial, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.4; }
h1 { font-size: 22pt; color: #1F3864; margin: 0 0 8pt; } h1.sec { font-size: 16pt; margin-top: 18pt; }
h2 { font-size: 13pt; color: #2E5597; margin: 14pt 0 5pt; } h3 { font-size: 11.5pt; color: #2E5597; margin: 10pt 0 4pt; }
p { margin: 0 0 6pt; } ul { margin: 0 0 8pt 18pt; padding: 0; } li { margin-bottom: 2pt; }
table { border-collapse: collapse; width: 100%; margin: 4pt 0 10pt; font-size: 9.5pt; page-break-inside: auto; }
tr { page-break-inside: avoid; } th, td { border: 1px solid #bfbfbf; padding: 3pt 5pt; vertical-align: top; text-align: left; }
th { background: #dce9f7; } code { font-family: Consolas, monospace; font-size: 9.5pt; background: #f2f2f2; padding: 0 2px; }
figure { margin: 10pt 0; page-break-inside: avoid; } figcaption { font-weight: bold; margin-bottom: 4pt; }
img { max-width: 100%; border: 1px solid #ccc; }
</style></head><body>`;
  blocks.forEach((b, idx) => {
    if (b.type === 'h') {
      const tag = 'h' + b.level;
      h += `<${tag}${b.level === 1 && idx !== 0 ? ' class="sec"' : ''}>${htmlInline(b.text)}</${tag}>`;
    } else if (b.type === 'p') h += `<p>${htmlInline(b.text)}</p>`;
    else if (b.type === 'ul') h += '<ul>' + b.items.map(t => `<li>${htmlInline(t)}</li>`).join('') + '</ul>';
    else if (b.type === 'table') {
      h += '<table>' + b.rows.map((r, ri) => '<tr>' + r.map(c => `<${ri ? 'td' : 'th'}>${htmlInline(c)}</${ri ? 'td' : 'th'}>`).join('') + '</tr>').join('') + '</table>';
    }
  });
  h += '<h1 class="sec" style="page-break-before: always">12. Screenshots</h1>';
  SHOTS.forEach(([file, caption], n) => {
    const data = fs.readFileSync(path.join(shotsDir, file)).toString('base64');
    const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
    h += `<figure><figcaption>Figure ${n + 1}: ${esc(caption)}</figcaption><img src="data:${mime};base64,${data}"></figure>`;
  });
  return h + '</body></html>';
}

(async () => {
  const blocks = parseMarkdown(fs.readFileSync(mdPath, 'utf8'));
  const htmlPath = path.join(process.env.REPORT_HTML_DIR || docsDir, 'SwiftShip_Tracker_Project_Report.html');
  fs.writeFileSync(htmlPath, buildHtml(blocks));
  console.log('Blocks:', blocks.length, '| screenshots:', SHOTS.length);
  console.log('HTML written:', htmlPath);
  const buf = await Packer.toBuffer(buildDocx(blocks));
  try {
    fs.writeFileSync(path.join(docsDir, 'SwiftShip_Tracker_Project_Report.docx'), buf);
    console.log('DOCX written:', buf.length, 'bytes');
  } catch (e) {
    console.error('DOCX NOT written (' + e.code + '). Close the file in Word and run this script again.');
    process.exitCode = 1;
  }
})();
