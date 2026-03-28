import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { getCostTypeLabel, getWorkTypeLabel } from '../lib/domain';
import { getStatusLabel } from '../lib/domain';
import { formatCurrency, formatDate } from '../lib/format';
import type { AppSettings, Lavorazione, Project, Registrazione } from '../types';

const VAT_RATE = 0.22;

interface ReportRow {
  id: string;
  category: string;
  title: string;
  details: string;
  amount: number;
}

function createReportFileName(projectName: string): string {
  const safeName = projectName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

  return `report-${safeName || 'edilmaestro'}-${new Date().toISOString().slice(0, 10)}.pdf`;
}

function buildReportPdf(options: {
  settings: AppSettings;
  project: Project;
  displayedEndDate: string;
  reportRows: ReportRow[];
  reportTotal: number;
  vatAmount: number;
}): jsPDF {
  const { settings, project, displayedEndDate, reportRows, reportTotal, vatAmount } = options;
  const document = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = document.internal.pageSize.getWidth();
  const pageHeight = document.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const amountX = pageWidth - margin;
  let cursorY = 18;

  const ensureSpace = (requiredHeight: number) => {
    if (cursorY + requiredHeight <= pageHeight - margin) {
      return;
    }

    document.addPage();
    cursorY = 18;
  };

  document.setFont('helvetica', 'bold');
  document.setFontSize(18);
  document.text('Report cantiere', margin, cursorY);
  cursorY += 8;

  document.setFont('helvetica', 'normal');
  document.setFontSize(11);

  [
    `Nome azienda: ${settings.companyName}`,
    `Titolare: ${settings.ownerName || 'N/D'}`,
    `Cantiere: ${project.name}`,
    `Data inizio: ${formatDate(project.startDate)}`,
    `Data fine: ${displayedEndDate}`,
    `Stato: ${getStatusLabel(project.status)}`,
    `Committente: ${project.client || 'Non definito'}`,
    `Indirizzo: ${project.address || 'Non definito'}`
  ].forEach((line) => {
    const splitLine = document.splitTextToSize(line, contentWidth);
    ensureSpace(splitLine.length * 6);
    document.text(splitLine, margin, cursorY);
    cursorY += splitLine.length * 6;
  });

  cursorY += 3;
  ensureSpace(12);
  document.setDrawColor(210, 210, 210);
  document.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 8;

  document.setFont('helvetica', 'bold');
  document.text('Voce', margin, cursorY);
  document.text('Importo', amountX, cursorY, { align: 'right' });
  cursorY += 6;
  document.setFont('helvetica', 'normal');

  reportRows.forEach((item) => {
    const detailText = `${item.category} - ${item.title}${item.details ? ` (${item.details})` : ''}`;
    const splitDetails = document.splitTextToSize(detailText, contentWidth - 35);
    const rowHeight = Math.max(splitDetails.length * 5 + 3, 8);

    ensureSpace(rowHeight + 4);
    document.text(splitDetails, margin, cursorY);
    document.text(formatCurrency(item.amount), amountX, cursorY, { align: 'right' });
    cursorY += rowHeight;
    document.setDrawColor(232, 232, 232);
    document.line(margin, cursorY - 2, pageWidth - margin, cursorY - 2);
  });

  if (reportRows.length === 0) {
    ensureSpace(10);
    document.text('Nessuna lavorazione o spesa con importo diverso da zero.', margin, cursorY);
    cursorY += 8;
  }

  cursorY += 4;
  ensureSpace(18);
  document.setFont('helvetica', 'bold');
  document.text(`Totale: ${formatCurrency(reportTotal)}`, amountX, cursorY, { align: 'right' });
  cursorY += 7;
  document.text(`di cui IVA: ${formatCurrency(vatAmount)}`, amountX, cursorY, { align: 'right' });

  return document;
}

interface ReportPageProps {
  projects: Project[];
  lavorazioni: Lavorazione[];
  registrazioni: Registrazione[];
  settings: AppSettings;
}

export function ReportPage({ projects, lavorazioni, registrazioni, settings }: ReportPageProps) {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const selectedLavorazioni = lavorazioni.filter(
    (lavorazione) => lavorazione.cantiereId === selectedProjectId && lavorazione.amount !== 0
  );
  const selectedRegistrazioni = registrazioni.filter(
    (registrazione) => registrazione.cantiereId === selectedProjectId && registrazione.costAmount !== 0
  );
  const reportRows = [
    ...selectedLavorazioni.map((lavorazione) => ({
      id: `lavorazione-${lavorazione.id}`,
      category: 'Lavorazione',
      title: lavorazione.description,
      details: [getWorkTypeLabel(lavorazione.workType), `${lavorazione.quantity} ${lavorazione.unit}`]
        .filter(Boolean)
        .join(' · '),
      amount: lavorazione.amount
    })),
    ...selectedRegistrazioni.map((registrazione) => ({
      id: `registrazione-${registrazione.id}`,
      category: 'Spesa',
      title: registrazione.costDescription || getCostTypeLabel(registrazione.costType),
      details: [
        getCostTypeLabel(registrazione.costType),
        registrazione.lavorazioneId || '',
        registrazione.workerName || '',
        registrazione.costUnit ? `${registrazione.costQuantity} ${registrazione.costUnit}` : ''
      ]
        .filter(Boolean)
        .join(' · '),
      amount: registrazione.costAmount
    }))
  ];
  const reportTotal = reportRows.reduce((total, item) => total + item.amount, 0);
  const vatAmount = Number((reportTotal * VAT_RATE).toFixed(2));
  const displayedEndDate =
    selectedProject?.status === 'completato' && selectedProject.endDate
      ? formatDate(selectedProject.endDate)
      : selectedProject
        ? 'Cantiere non concluso'
        : 'Non definita';

  async function handlePrintReport() {
    if (!selectedProject) {
      return;
    }

    setFeedback(null);

    if (!Capacitor.isNativePlatform()) {
      window.print();
      return;
    }

    try {
      setIsExporting(true);

      const document = buildReportPdf({
        settings,
        project: selectedProject,
        displayedEndDate,
        reportRows,
        reportTotal,
        vatAmount
      });
      const fileName = createReportFileName(selectedProject.name);
      const dataUri = document.output('datauristring');
      const base64Data = dataUri.split(',')[1];

      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });

      const fileUri = await Filesystem.getUri({
        path: fileName,
        directory: Directory.Documents
      });

      await Share.share({
        title: `Report ${selectedProject.name}`,
        text: `Report PDF del cantiere ${selectedProject.name}`,
        url: fileUri.uri,
        dialogTitle: 'Salva o stampa il report'
      });

      setFeedback({
        type: 'success',
        message: 'PDF creato. Si e aperto il menu del telefono per salvarlo, condividerlo o stamparlo.'
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Impossibile generare il PDF del report.'
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="page-grid">
      <section className="panel accent-panel">
        <div className="section-heading report-header">
          <div>
            <p className="eyebrow">Report operativo</p>
            <h2>Seleziona un cantiere e stampa il report</h2>
          </div>
        </div>

        <div className="report-controls">
          <label>
            <span>Cantiere</span>
            <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
              <option value="">Seleziona un cantiere</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="primary-button"
            onClick={handlePrintReport}
            disabled={!selectedProject || isExporting}
          >
            {isExporting ? 'Preparazione PDF...' : 'Stampa report'}
          </button>
        </div>

        {Capacitor.isNativePlatform() ? (
          <p className="muted-text report-hint">
            Nell'app Android viene generato un PDF e si apre il menu di sistema per salvarlo o stamparlo.
          </p>
        ) : null}

        {feedback ? <p className={`settings-feedback settings-feedback-${feedback.type}`}>{feedback.message}</p> : null}

        {projects.length === 0 ? <p className="muted-text">Nessun cantiere disponibile per il report.</p> : null}

        {!selectedProject && projects.length > 0 ? (
          <p className="muted-text report-placeholder">Seleziona un cantiere per visualizzare il report da stampare.</p>
        ) : null}

        {selectedProject ? (
          <div className="stack-list report-list">
            <article className="report-card report-print-area" key={selectedProject.id}>
              <div className="report-topline">
                <div>
                  <span>Nome azienda</span>
                  <strong>{settings.companyName}</strong>
                </div>
                <div>
                  <span>Titolare</span>
                  <strong>{settings.ownerName || 'N/D'}</strong>
                </div>
                <div>
                  <span>Nome cantiere</span>
                  <strong>{selectedProject.name}</strong>
                </div>
                <div>
                  <span>Data inizio</span>
                  <strong>{formatDate(selectedProject.startDate)}</strong>
                </div>
                <div>
                  <span>Data fine</span>
                  <strong>{displayedEndDate}</strong>
                </div>
                <div>
                  <span>Stato</span>
                  <strong>{getStatusLabel(selectedProject.status)}</strong>
                </div>
              </div>

              <div className="project-header">
                <div>
                  <h3>{selectedProject.name}</h3>
                  <p>
                    {selectedProject.client || 'Committente non definito'} · {selectedProject.address || 'Indirizzo non definito'}
                  </p>
                </div>
                <span className="status-pill">{getStatusLabel(selectedProject.status)}</span>
              </div>

              <div className="report-items">
                <div className="report-item report-item-head">
                  <strong>Voce</strong>
                  <strong>Dettaglio</strong>
                  <strong>Importo</strong>
                </div>
                {reportRows.map((item) => (
                  <div className="report-item" key={item.id}>
                    <div>
                      <span>{item.category}</span>
                      <strong>{item.title}</strong>
                    </div>
                    <p>{item.details || 'Nessun dettaglio'}</p>
                    <strong>{formatCurrency(item.amount)}</strong>
                  </div>
                ))}
                {reportRows.length === 0 ? (
                  <p className="muted-text report-placeholder">Nessuna lavorazione o spesa con importo diverso da zero.</p>
                ) : null}
              </div>

              <div className="report-total-box">
                <div>
                  <span>Totale</span>
                  <strong>{formatCurrency(reportTotal)}</strong>
                </div>
                <div>
                  <span>di cui IVA</span>
                  <strong>{formatCurrency(vatAmount)}</strong>
                </div>
              </div>
            </article>
          </div>
        ) : null}
      </section>
    </div>
  );
}
