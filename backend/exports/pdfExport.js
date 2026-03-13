'use strict';
const { Question, Answer, User } = require('../models');

/* ─────────────────────────────────────────────────────────────
   HTML-based PDF renderer using Puppeteer.
   Puppeteer (headless Chrome) handles Devanagari/Marathi text
   correctly via the OS font-shaping engine — PDFKit cannot.
   ───────────────────────────────────────────────────────────── */

/** Strip HTML tags, preserve line breaks */
const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const esc = (str) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('mr-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const STATUS_STYLES = {
  open:             'background:#D1FAE5;color:#065F46',
  locked:           'background:#FEF3C7;color:#92400E',
  finalized:        'background:#DBEAFE;color:#1E3A8A',
  accepted:         'background:#D1FAE5;color:#065F46',
  rejected:         'background:#FEE2E2;color:#991B1B',
  pending_review:   'background:#DBEAFE;color:#1E3A8A',
  update_requested: 'background:#FFEDD5;color:#7C2D12',
};

const PRIORITY_STYLES = {
  low:    'background:#D1FAE5;color:#065F46',
  medium: 'background:#DBEAFE;color:#1E40AF',
  high:   'background:#FEF3C7;color:#92400E',
  urgent: 'background:#FEE2E2;color:#991B1B',
};

const ANSWER_BG = {
  accepted:         '#D1FAE5',
  pending_review:   '#DBEAFE',
  rejected:         '#FEE2E2',
  update_requested: '#FFEDD5',
};

const badge = (text, style) =>
  `<span class="badge" style="${style}">${esc(text)}</span>`;

/** Shared CSS — uses Nirmala UI (Windows built-in, Marathi support)
 *  with Noto Sans Devanagari as web-font fallback.               */
const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans:wght@400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Nirmala UI', 'Noto Sans Devanagari', 'Noto Sans', 'Mangal',
                 'Arial Unicode MS', sans-serif;
    font-size: 11pt;
    color: #1e293b;
    background: #fff;
    line-height: 1.6;
  }

  .page-header {
    background: linear-gradient(135deg, #1E3A8A 0%, #6366F1 100%);
    color: #fff;
    padding: 20px 40px 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 0;
  }
  .page-header h1 { font-size: 18pt; font-weight: 700; letter-spacing: -0.3px; }
  .page-header .meta { font-size: 8.5pt; opacity: 0.8; margin-top: 4px; }

  .content { padding: 24px 40px 40px; }

  .section {
    margin-bottom: 22px;
    page-break-inside: avoid;
  }
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11pt;
    font-weight: 700;
    color: #1E3A8A;
    border-bottom: 2px solid #BFDBFE;
    padding-bottom: 5px;
    margin-bottom: 12px;
  }
  .section-title::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 16px;
    background: #1E3A8A;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .kv-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  .kv-table td { padding: 3px 0; vertical-align: top; font-size: 10.5pt; }
  .kv-table td:first-child {
    font-weight: 600;
    color: #374151;
    width: 130px;
    white-space: nowrap;
  }
  .kv-table td:last-child { color: #1e293b; }

  .badge {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 9999px;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    margin-right: 5px;
    margin-bottom: 4px;
  }

  .question-title {
    font-size: 14pt;
    font-weight: 700;
    color: #0F172A;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .description-text {
    white-space: pre-wrap;
    color: #1e293b;
    font-size: 10.5pt;
    background: #F8FAFC;
    border-radius: 8px;
    padding: 12px 14px;
    border: 1px solid #E2E8F0;
    line-height: 1.7;
  }

  .final-answer-text {
    white-space: pre-wrap;
    color: #065F46;
    font-size: 10.5pt;
    background: #ECFDF5;
    border-radius: 8px;
    padding: 12px 14px;
    border: 1px solid #6EE7B7;
    line-height: 1.7;
  }

  .answer-card {
    border-radius: 10px;
    border: 1px solid #E2E8F0;
    margin-bottom: 14px;
    overflow: hidden;
    page-break-inside: avoid;
  }
  .answer-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 14px;
    background: #F1F5F9;
    border-bottom: 1px solid #E2E8F0;
    font-size: 9.5pt;
  }
  .answer-card-header .dept { font-weight: 700; color: #1e293b; }
  .answer-card-header .vmeta { font-size: 8.5pt; color: #64748b; margin-top: 2px; }
  .answer-card-body {
    padding: 12px 14px;
    white-space: pre-wrap;
    font-size: 10.5pt;
    line-height: 1.7;
  }
  .attachment-line {
    font-size: 8.5pt;
    color: #4338CA;
    padding: 5px 14px 8px;
    border-top: 1px solid #E2E8F0;
  }

  .footer {
    border-top: 1px solid #E2E8F0;
    padding: 8px 40px;
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: #94A3B8;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #fff;
  }

  .empty-note { color: #94A3B8; font-style: italic; font-size: 10pt; padding: 8px 0; }
`;

/* ─────────────────────────────────────────────────────────────
   HTML builders
   ───────────────────────────────────────────────────────────── */

const buildQuestionHtml = (question, answers) => {
  const dept    = esc(question.department?.departmentName || question.department?.name || '—');
  const creator = esc(question.createdBy?.name || question.createdBy?.email || '—');
  const sStyle  = STATUS_STYLES[question.status] || '';
  const pStyle  = PRIORITY_STYLES[question.priority] || '';

  const answersHtml = answers.length === 0
    ? '<p class="empty-note">अद्याप कोणतेही उत्तर सादर केले नाही.</p>'
    : answers.map((a, i) => {
        const aDept = esc(a.department?.departmentName || a.department?.name || '—');
        const aStyle = STATUS_STYLES[a.status] || '';
        const aBg = ANSWER_BG[a.status] || '#F8FAFC';
        const content = esc(stripHtml(a.content));
        const attachHtml = (a.attachments?.length)
          ? `<div class="attachment-line">📎 ${a.attachments.map(at => esc(at.originalName)).join(', ')}</div>`
          : '';
        return `
          <div class="answer-card" style="background:${aBg}">
            <div class="answer-card-header">
              <div>
                <div class="dept">#${i + 1}&nbsp;&nbsp;${aDept}</div>
                <div class="vmeta">v${a.version} &nbsp;·&nbsp; ${fmtDate(a.createdAt)}</div>
              </div>
              ${badge(a.status.replace(/_/g, ' '), aStyle)}
            </div>
            <div class="answer-card-body">${content}</div>
            ${attachHtml}
          </div>`;
      }).join('');

  const tagsHtml = question.tags?.length
    ? question.tags.map(t => `<span class="badge" style="background:#EEF2FF;color:#4338CA">${esc(t)}</span>`).join(' ')
    : '';

  const finalAnswerHtml = question.finalAnswer ? `
    <div class="section">
      <div class="section-title">अंतिम उत्तर (प्रकाशित)</div>
      <div class="final-answer-text">${esc(stripHtml(question.finalAnswer))}</div>
      <p style="font-size:8.5pt;color:#64748b;margin-top:6px">प्रकाशित: ${fmtDate(question.finalAnswerPublishedAt)}</p>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width"/>
  <title>${esc(question.title)}</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  <div class="page-header">
    <div>
      <h1>प्रश्न अहवाल</h1>
      <div class="meta">तयार केले: ${fmtDate(new Date())}</div>
    </div>
    <div style="font-size:9pt;opacity:0.8">Pradhikaran Portal</div>
  </div>

  <div class="content">

    <!-- Question Details -->
    <div class="section">
      <div class="section-title">प्रश्नाचा तपशील</div>
      <div class="question-title">${esc(question.title)}</div>
      <div style="margin-bottom:8px">
        ${badge(question.status, sStyle)}
        ${question.priority ? badge(question.priority, pStyle) : ''}
        ${tagsHtml}
      </div>
      <table class="kv-table">
        <tr><td>विभाग:</td><td>${dept}</td></tr>
        <tr><td>तयार केले:</td><td>${creator}</td></tr>
        <tr><td>दिनांक:</td><td>${fmtDate(question.createdAt)}</td></tr>
        ${question.deadline ? `<tr><td>अंतिम मुदत:</td><td>${fmtDate(question.deadline)}</td></tr>` : ''}
      </table>
    </div>

    <!-- Description -->
    <div class="section">
      <div class="section-title">वर्णन</div>
      <div class="description-text">${esc(stripHtml(question.description))}</div>
    </div>

    ${finalAnswerHtml}

    <!-- Answers -->
    <div class="section">
      <div class="section-title">सादर केलेली उत्तरे (${answers.length})</div>
      ${answersHtml}
    </div>

  </div>

  <div class="footer">
    <span>Pradhikaran Portal — गोपनीय</span>
  </div>
</body>
</html>`;
};

const buildDepartmentHtml = (user, questions, answerByQuestion) => {
  const questionsHtml = questions.length === 0
    ? '<p class="empty-note">कोणतेही प्रश्न नियुक्त केले नाहीत.</p>'
    : questions.map((q, i) => {
        const ans = answerByQuestion[q._id.toString()];
        const qStyle = STATUS_STYLES[q.status] || '';
        const creator = esc(q.createdBy?.name || q.createdBy?.email || '—');
        const ansBlock = ans ? (() => {
          const aStyle = STATUS_STYLES[ans.status] || '';
          const aBg = ANSWER_BG[ans.status] || '#F8FAFC';
          const content = esc(stripHtml(ans.content));
          const trimmed = content.length > 1000 ? content.slice(0, 1000) + '…' : content;
          return `
            <div style="margin-top:8px;padding:10px 12px;background:${aBg};border-radius:8px;border:1px solid #E2E8F0">
              <div style="font-size:8.5pt;font-weight:700;margin-bottom:5px">
                ${badge(ans.status.replace(/_/g, ' '), aStyle)}
                <span style="color:#64748b">v${ans.version} &nbsp;·&nbsp; ${fmtDate(ans.updatedAt || ans.createdAt)}</span>
              </div>
              <div style="white-space:pre-wrap;font-size:10.5pt;line-height:1.7">${trimmed}</div>
            </div>`;
        })() : `<p style="color:#94A3B8;font-size:9.5pt;margin-top:6px">अद्याप उत्तर सादर केले नाही.</p>`;

        return `
          <div class="answer-card" style="background:#F8FAFC;margin-bottom:16px">
            <div class="answer-card-header">
              <div>
                <div class="dept">${i + 1}.&nbsp;&nbsp;${esc(q.title)}</div>
                <div class="vmeta">${creator} &nbsp;·&nbsp; ${fmtDate(q.createdAt)}</div>
              </div>
              ${badge(q.status, qStyle)}
            </div>
            <div style="padding:10px 14px 14px">${ansBlock}</div>
          </div>`;
      }).join('');

  return `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(user.departmentName || user.name)} — विभाग अहवाल</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  <div class="page-header">
    <div>
      <h1>विभाग अहवाल</h1>
      <div class="meta">तयार केले: ${fmtDate(new Date())}</div>
    </div>
    <div style="font-size:9pt;opacity:0.8">Pradhikaran Portal</div>
  </div>

  <div class="content">

    <div class="section">
      <div class="section-title">विभागाची माहिती</div>
      <table class="kv-table">
        <tr><td>नाव:</td><td>${esc(user.name)}</td></tr>
        <tr><td>ईमेल:</td><td>${esc(user.email)}</td></tr>
        <tr><td>विभाग:</td><td>${esc(user.departmentName || '—')}</td></tr>
        <tr><td>स्थिती:</td><td>${user.isApproved ? 'मंजूर' : 'प्रलंबित'}</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">नियुक्त प्रश्न (${questions.length})</div>
      ${questionsHtml}
    </div>

  </div>

  <div class="footer">
    <span>Pradhikaran Portal — गोपनीय</span>
  </div>
</body>
</html>`;
};

/* ─────────────────────────────────────────────────────────────
   PDF generation via Puppeteer
   ───────────────────────────────────────────────────────────── */

let _browser = null;
const getBrowser = async () => {
  if (!_browser || !_browser.connected) {
    const puppeteer = require('puppeteer');
    _browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
        '--disable-gpu',
      ],
    });
  }
  return _browser;
};

const htmlToPdf = async (html) => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, {
      waitUntil: 'networkidle0',   // wait for Google Fonts to load
      timeout: 30000,
    });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '0mm', right: '0mm', bottom: '18mm', left: '0mm' },
      printBackground: true,
      displayHeaderFooter: false,
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
};

/* ─────────────────────────────────────────────────────────────
   Public API — same as before, returns a Buffer
   ───────────────────────────────────────────────────────────── */

const buildQuestionPdf = async (questionId) => {
  const question = await Question.findOne({ _id: questionId, isDeleted: { $ne: true } })
    .populate('department', 'name email departmentName')
    .populate('createdBy', 'name email')
    .lean();
  if (!question) return null;

  const answers = await Answer.find({ question: questionId, isDeleted: { $ne: true } })
    .populate('department', 'name departmentName')
    .sort({ createdAt: -1 })
    .lean();

  const html = buildQuestionHtml(question, answers);
  return htmlToPdf(html);
};

const buildDepartmentPdf = async (userId) => {
  const user = await User.findOne({ _id: userId, role: 'DEPARTMENT', isDeleted: { $ne: true } }).lean();
  if (!user) return null;

  const questions = await Question.find({ department: userId, isDeleted: { $ne: true } })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  const answers = await Answer.find({ department: userId, isDeleted: { $ne: true } })
    .populate('question', 'title status')
    .lean();

  const answerByQuestion = {};
  answers.forEach(a => { answerByQuestion[a.question._id.toString()] = a; });

  const html = buildDepartmentHtml(user, questions, answerByQuestion);
  return htmlToPdf(html);
};

/* ─────────────────────────────────────────────────────────────
   Helpers — group questions by senate member
   ───────────────────────────────────────────────────────────── */

const groupBySenate = (questions) => {
  const map = {};
  questions.forEach(q => {
    const id = q.createdBy?._id?.toString() || 'unknown';
    if (!map[id]) {
      map[id] = {
        senateName: q.createdBy?.name || q.createdBy?.email || 'अज्ञात सदस्य',
        questions: [],
      };
    }
    map[id].questions.push(q);
  });
  return Object.values(map);
};

/** CSS for the table-based report format (Marathi official document style) */
const TABLE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans:wght@400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Nirmala UI', 'Noto Sans Devanagari', 'Noto Sans', 'Mangal',
                 'Arial Unicode MS', sans-serif;
    font-size: 11pt;
    color: #1e293b;
    background: #fff;
    line-height: 1.6;
  }

  .report-header {
    text-align: center;
    padding: 24px 40px 16px;
    border-bottom: 2px solid #1E3A8A;
  }
  .report-header h1 {
    font-size: 16pt;
    font-weight: 700;
    color: #1E3A8A;
    margin-bottom: 4px;
  }
  .report-header .sub {
    font-size: 9.5pt;
    color: #64748b;
  }

  .content { padding: 16px 32px 40px; }

  .senate-section {
    margin-bottom: 28px;
    page-break-inside: avoid;
  }
  .senate-heading {
    background: #F1F5F9;
    border: 1px solid #CBD5E1;
    padding: 8px 14px;
    margin-bottom: 0;
    text-align: center;
  }
  .senate-heading .label {
    font-size: 10pt;
    font-weight: 700;
    color: #1E3A8A;
  }
  .senate-heading .name {
    font-size: 12pt;
    font-weight: 700;
    color: #0F172A;
    margin-top: 2px;
  }

  .q-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0;
  }
  .q-table td, .q-table th {
    border: 1px solid #94A3B8;
    padding: 8px 12px;
    vertical-align: top;
    font-size: 10.5pt;
    line-height: 1.7;
  }
  .q-table .q-label {
    font-weight: 700;
    color: #1E3A8A;
    white-space: nowrap;
    width: 100px;
    background: #F8FAFC;
  }
  .q-table .q-content {
    color: #1e293b;
    white-space: pre-wrap;
  }
  .q-table .a-label {
    font-weight: 700;
    color: #065F46;
    white-space: nowrap;
    width: 100px;
    background: #ECFDF5;
  }
  .q-table .a-content {
    color: #065F46;
    white-space: pre-wrap;
    background: #F0FDF4;
  }
  .q-table .dept-info {
    font-size: 9pt;
    color: #64748b;
    margin-top: 4px;
  }

  .badge {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 9999px;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    margin-right: 5px;
  }

  .footer {
    border-top: 1px solid #E2E8F0;
    padding: 8px 40px;
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: #94A3B8;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #fff;
  }

  .empty-note { color: #94A3B8; font-style: italic; font-size: 10pt; padding: 8px 0; }

  .page-count {
    text-align: right;
    font-size: 8.5pt;
    color: #94A3B8;
    padding: 4px 0;
  }
`;

/* ─────────────────────────────────────────────────────────────
   R1 — All received senate questions report (all statuses)
   Grouped by senate member, table format
   ───────────────────────────────────────────────────────────── */

const buildR1Html = (questions) => {
  const groups = groupBySenate(questions);

  const sectionsHtml = groups.length === 0
    ? '<p class="empty-note">कोणतेही प्रश्न नाहीत.</p>'
    : groups.map(g => {
        const tableRows = g.questions.map((q, i) => {
          const auditLabel = (q.auditStatus || 'pending').replace(/_/g, ' ');
          return `
            <tr>
              <td class="q-label">प्रश्न क्र.<br>${i + 1}</td>
              <td class="q-content">
                ${esc(q.title)}
                <div style="margin-top:6px">${esc(stripHtml(q.description))}</div>
                <div class="dept-info">स्थिती: ${esc(auditLabel)} · दिनांक: ${fmtDate(q.createdAt)}</div>
              </td>
            </tr>`;
        }).join('');

        return `
          <div class="senate-section">
            <div class="senate-heading">
              <div class="label">मा.अधिसभा सदस्य</div>
              <div class="name">${esc(g.senateName)} यांचे प्रश्न</div>
            </div>
            <table class="q-table">
              ${tableRows}
            </table>
          </div>`;
      }).join('');

  return `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8"/>
  <title>R1 — प्राप्त प्रश्न अहवाल</title>
  <style>${TABLE_CSS}</style>
</head>
<body>
  <div class="report-header">
    <h1>R1 — प्राप्त प्रश्न अहवाल</h1>
    <div class="sub">मा अधिसभा बैठक प्रश्न व उत्तरे · तयार केले: ${fmtDate(new Date())} · Pradhikaran Portal</div>
  </div>
  <div class="content">
    ${sectionsHtml}
  </div>
  <div class="footer">
    <span>Pradhikaran Portal — गोपनीय</span>
    <span>R1 Report</span>
  </div>
</body>
</html>`;
};

const buildR1Pdf = async () => {
  const User = require('../models/User');
  const senateUsers = await User.find({ role: 'SENATE', isDeleted: { $ne: true } }).select('_id').lean();
  const senateIds = senateUsers.map(u => u._id);

  const questions = await Question.find({
    createdBy: { $in: senateIds },
    isDeleted: { $ne: true },
  })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return htmlToPdf(buildR1Html(questions));
};

/* ─────────────────────────────────────────────────────────────
   R2 — Sorted / forwarded questions report
   Grouped by senate member, table format
   ───────────────────────────────────────────────────────────── */

const buildR2Html = (questions) => {
  const groups = groupBySenate(questions);

  const sectionsHtml = groups.length === 0
    ? '<p class="empty-note">कोणतेही अग्रेषित प्रश्न नाहीत.</p>'
    : groups.map(g => {
        const tableRows = g.questions.map((q, i) => {
          const dept = esc(q.department?.departmentName || q.department?.name || '—');
          return `
            <tr>
              <td class="q-label">प्रश्न क्र.<br>${i + 1}</td>
              <td class="q-content">
                ${esc(q.title)}
                <div style="margin-top:6px">${esc(stripHtml(q.description))}</div>
                <div class="dept-info">विभाग: ${dept}${q.deadline ? ` · अंतिम मुदत: ${fmtDate(q.deadline)}` : ''} · दिनांक: ${fmtDate(q.createdAt)}</div>
              </td>
            </tr>`;
        }).join('');

        return `
          <div class="senate-section">
            <div class="senate-heading">
              <div class="label">मा.अधिसभा सदस्य</div>
              <div class="name">${esc(g.senateName)} यांचे प्रश्न</div>
            </div>
            <table class="q-table">
              ${tableRows}
            </table>
          </div>`;
      }).join('');

  return `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8"/>
  <title>R2 — वर्गीकृत प्रश्न अहवाल</title>
  <style>${TABLE_CSS}</style>
</head>
<body>
  <div class="report-header">
    <h1>R2 — वर्गीकृत प्रश्न अहवाल</h1>
    <div class="sub">प्रधिकरणाला पाठवलेले प्रश्न · तयार केले: ${fmtDate(new Date())} · Pradhikaran Portal</div>
  </div>
  <div class="content">
    ${sectionsHtml}
  </div>
  <div class="footer">
    <span>Pradhikaran Portal — गोपनीय</span>
    <span>R2 Report</span>
  </div>
</body>
</html>`;
};

const buildR2Pdf = async () => {
  const questions = await Question.find({
    isDeleted: { $ne: true },
    auditStatus: 'forwarded',
  })
    .populate('createdBy', 'name email')
    .populate('department', 'name departmentName')
    .sort({ createdAt: -1 })
    .lean();

  return htmlToPdf(buildR2Html(questions));
};

/* ─────────────────────────────────────────────────────────────
   R3 — Finalized questions with accepted answers report
   Grouped by senate member, table format with answers
   ───────────────────────────────────────────────────────────── */

const buildR3Html = (questions, answersByQ) => {
  const groups = groupBySenate(questions);

  const sectionsHtml = groups.length === 0
    ? '<p class="empty-note">कोणतेही अंतिम प्रश्न नाहीत.</p>'
    : groups.map(g => {
        const tableRows = g.questions.map((q, i) => {
          const dept = esc(q.department?.departmentName || q.department?.name || '—');
          const answers = answersByQ[q._id.toString()] || [];
          const answersText = answers.map(a => {
            const aDept = esc(a.department?.departmentName || a.department?.name || '—');
            return `[${aDept}] ${esc(stripHtml(a.content))}`;
          }).join('\n\n');
          const answerDisplay = answersText || 'अद्याप कोणतेही स्वीकृत उत्तर नाही.';

          return `
            <tr>
              <td class="q-label">प्रश्न क्र.<br>${i + 1}</td>
              <td class="q-content">
                ${esc(q.title)}
                <div style="margin-top:6px">${esc(stripHtml(q.description))}</div>
                <div class="dept-info">विभाग: ${dept} · दिनांक: ${fmtDate(q.createdAt)}</div>
              </td>
            </tr>
            <tr>
              <td class="a-label">उत्तर</td>
              <td class="a-content">${answerDisplay}${q.finalAnswer ? `\n\n<b>अंतिम उत्तर (प्रकाशित):</b>\n${esc(stripHtml(q.finalAnswer))}` : ''}</td>
            </tr>`;
        }).join('');

        return `
          <div class="senate-section">
            <div class="senate-heading">
              <div class="label">मा.अधिसभा सदस्य</div>
              <div class="name">${esc(g.senateName)} यांचे प्रश्न</div>
            </div>
            <table class="q-table">
              ${tableRows}
            </table>
          </div>`;
      }).join('');

  return `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8"/>
  <title>R3 — अंतिम प्रश्न व उत्तरे अहवाल</title>
  <style>${TABLE_CSS}</style>
</head>
<body>
  <div class="report-header">
    <h1>R3 — अंतिम प्रश्न व उत्तरे अहवाल</h1>
    <div class="sub">अंतिम प्रश्न व स्वीकृत उत्तरे · तयार केले: ${fmtDate(new Date())} · Pradhikaran Portal</div>
  </div>
  <div class="content">
    ${sectionsHtml}
  </div>
  <div class="footer">
    <span>Pradhikaran Portal — गोपनीय</span>
    <span>R3 Report</span>
  </div>
</body>
</html>`;
};

const buildR3Pdf = async () => {
  const questions = await Question.find({
    isDeleted: { $ne: true },
    status: 'finalized',
  })
    .populate('createdBy', 'name email')
    .populate('department', 'name departmentName')
    .sort({ createdAt: -1 })
    .lean();

  const qIds = questions.map(q => q._id);
  const answers = await Answer.find({
    question: { $in: qIds },
    isDeleted: { $ne: true },
    status: 'accepted',
  })
    .populate('department', 'name departmentName')
    .sort({ createdAt: -1 })
    .lean();

  const answersByQ = {};
  answers.forEach(a => {
    const key = a.question.toString();
    if (!answersByQ[key]) answersByQ[key] = [];
    answersByQ[key].push(a);
  });

  return htmlToPdf(buildR3Html(questions, answersByQ));
};

/* ─────────────────────────────────────────────────────────────
   R4 — Complete Q&A Report (all questions + all answers + final)
   Grouped by senate member, table format
   ───────────────────────────────────────────────────────────── */

const buildR4Html = (questions, answersByQ) => {
  const groups = groupBySenate(questions);

  const sectionsHtml = groups.length === 0
    ? '<p class="empty-note">कोणतेही प्रश्न नाहीत.</p>'
    : groups.map(g => {
        const tableRows = g.questions.map((q, i) => {
          const dept = esc(q.department?.departmentName || q.department?.name || '—');
          const answers = answersByQ[q._id.toString()] || [];
          const answersText = answers.length === 0
            ? 'अद्याप कोणतेही उत्तर सादर केले नाही.'
            : answers.map(a => {
                const aDept = esc(a.department?.departmentName || a.department?.name || '—');
                const aStatus = (a.status || '').replace(/_/g, ' ');
                return `[${aDept} · ${aStatus} · v${a.version}]\n${esc(stripHtml(a.content))}`;
              }).join('\n\n');

          const finalText = q.finalAnswer
            ? `\n\n<b>अंतिम उत्तर (प्रकाशित ${fmtDate(q.finalAnswerPublishedAt)}):</b>\n${esc(stripHtml(q.finalAnswer))}`
            : '';

          const statusLabel = (q.status || 'open');
          const auditLabel = (q.auditStatus || 'pending').replace(/_/g, ' ');

          return `
            <tr>
              <td class="q-label">प्रश्न क्र.<br>${i + 1}</td>
              <td class="q-content">
                ${esc(q.title)}
                <div style="margin-top:6px">${esc(stripHtml(q.description))}</div>
                <div class="dept-info">विभाग: ${dept} · स्थिती: ${esc(statusLabel)} · ऑडिट: ${esc(auditLabel)} · दिनांक: ${fmtDate(q.createdAt)}</div>
              </td>
            </tr>
            <tr>
              <td class="a-label">उत्तर</td>
              <td class="a-content">${answersText}${finalText}</td>
            </tr>`;
        }).join('');

        return `
          <div class="senate-section">
            <div class="senate-heading">
              <div class="label">मा.अधिसभा सदस्य</div>
              <div class="name">${esc(g.senateName)} यांचे प्रश्न</div>
            </div>
            <table class="q-table">
              ${tableRows}
            </table>
          </div>`;
      }).join('');

  return `<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8"/>
  <title>R4 — संपूर्ण प्रश्न व उत्तरे अहवाल</title>
  <style>${TABLE_CSS}</style>
</head>
<body>
  <div class="report-header">
    <h1>R4 — संपूर्ण प्रश्न व उत्तरे अहवाल</h1>
    <div class="sub">सर्व प्रश्न, उत्तरे व अंतिम प्रकाशित उत्तरे · तयार केले: ${fmtDate(new Date())} · Pradhikaran Portal</div>
  </div>
  <div class="content">
    ${sectionsHtml}
  </div>
  <div class="footer">
    <span>Pradhikaran Portal — गोपनीय</span>
    <span>R4 Report</span>
  </div>
</body>
</html>`;
};

const buildR4Pdf = async () => {
  const User = require('../models/User');
  const senateUsers = await User.find({ role: 'SENATE', isDeleted: { $ne: true } }).select('_id').lean();
  const senateIds = senateUsers.map(u => u._id);

  const questions = await Question.find({
    createdBy: { $in: senateIds },
    isDeleted: { $ne: true },
  })
    .populate('createdBy', 'name email')
    .populate('department', 'name departmentName')
    .sort({ createdAt: -1 })
    .lean();

  const qIds = questions.map(q => q._id);
  const answers = await Answer.find({
    question: { $in: qIds },
    isDeleted: { $ne: true },
  })
    .populate('department', 'name departmentName')
    .sort({ createdAt: -1 })
    .lean();

  const answersByQ = {};
  answers.forEach(a => {
    const key = a.question.toString();
    if (!answersByQ[key]) answersByQ[key] = [];
    answersByQ[key].push(a);
  });

  return htmlToPdf(buildR4Html(questions, answersByQ));
};

/* Gracefully close the browser on process exit */
process.on('exit', () => { if (_browser) _browser.close(); });

module.exports = { buildQuestionPdf, buildDepartmentPdf, buildR1Pdf, buildR2Pdf, buildR3Pdf, buildR4Pdf };
