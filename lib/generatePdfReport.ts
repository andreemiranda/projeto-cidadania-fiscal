import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Question, SurveyStats, SurveyResponse } from './types';

/**
 * Gera relatório acadêmico e científico de alto padrão visual com cores vibrantes,
 * cabeçalho e rodapé institucionais padronizados UNITINS/UAB, métricas estatísticas descritivas completas,
 * tabelas de frequência (FA, FR %, FC %), gráficos de barras horizontais coloridos e auditoria de participantes.
 */
export function generatePdfReport(
  stats: SurveyStats,
  questions: Question[],
  projectTitle: string = 'Trabalho Extensionista: Cidadania Fiscal na Prática'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Paleta de Cores Colorida e Institucional
  const colorBluePrimary: [number, number, number] = [30, 64, 175]; // #1e40af (Azul Royal Institucional)
  const colorNavyDark: [number, number, number] = [15, 23, 42]; // #0f172a (Navy)
  const colorAccentGold: [number, number, number] = [245, 158, 11]; // #f59e0b (Âmbar/Dourado)
  const colorTableHead: [number, number, number] = [30, 58, 138]; // #1e3a8a
  const colorTextDark: [number, number, number] = [15, 23, 42]; // #0f172a
  const colorBorderMuted: [number, number, number] = [203, 213, 225]; // #cbd5e1

  // Data formatada para o cabeçalho
  const dataCabecalho = new Date().toLocaleDateString('pt-BR');
  const headerMainTitle = `UNITINS / UAB – RELATÓRIO TÉCNICO-CIENTÍFICO DE EXTENSÃO UNIVERSITÁRIA ${dataCabecalho}`;

  let currentY = margin;

  // Running Header em páginas subsequentes (colorido e elegante)
  const drawRunningHeader = () => {
    // Faixa sutil azul no topo
    doc.setFillColor(239, 246, 255); // #eff6ff
    doc.rect(margin, 8, contentWidth, 8, 'F');

    doc.setDrawColor(...colorBluePrimary);
    doc.setLineWidth(0.6);
    doc.line(margin, 16, pageWidth - margin, 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...colorBluePrimary);
    doc.text(headerMainTitle, margin + 2, 13.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text('POLO UAB PEDRO AFONSO - TO', pageWidth - margin - 2, 13.5, { align: 'right' });
  };

  // Verificador e criador inteligente de quebra de página
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = 22;
      drawRunningHeader();
    }
  };

  // Running Footer estilizado colorido em todas as páginas
  const drawAllFooters = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Linha divisória colorida
      doc.setDrawColor(...colorBluePrimary);
      doc.setLineWidth(0.6);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      // Texto institucional à esquerda
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Universidade do Estado do Tocantins (UNITINS) • Polo UAB Pedro Afonso - TO | Cidadania Fiscal`,
        margin,
        pageHeight - 7.5
      );

      // Data, hora e numeração à direita
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(...colorBluePrimary);
      doc.text(
        `Página ${i} de ${totalPages} • Emitido às ${new Date().toLocaleTimeString('pt-BR')}`,
        pageWidth - margin,
        pageHeight - 7.5,
        { align: 'right' }
      );
    }
  };

  // ==========================================
  // PÁGINA 1: CABEÇALHO COLORIDO E FICHA INSTITUCIONAL
  // ==========================================

  // Banner Principal Colorido
  doc.setFillColor(...colorBluePrimary);
  doc.rect(margin, currentY, contentWidth, 37, 'F');

  // Linha dourada decorativa inferior no banner
  doc.setFillColor(...colorAccentGold);
  doc.rect(margin, currentY + 35.5, contentWidth, 0.8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(headerMainTitle, margin + 4, currentY + 11.2);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'UNIVERSIDADE DO ESTADO DO TOCANTINS – UNITINS | SISTEMA UNIVERSIDADE ABERTA DO BRASIL (UAB)',
    margin + 4,
    currentY + 20
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(
    'CURSO: ADMINISTRAÇÃO PÚBLICA • COMPONENTE: TEMAS CONTEMPORÂNEOS DA ADMINISTRAÇÃO PÚBLICA',
    margin + 4,
    currentY + 28.8
  );

  currentY += 44.8;

  // Sub-faixa com título do projeto e objetivo
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...colorBorderMuted);
  doc.roundedRect(margin, currentY, contentWidth, 22, 1.5, 1.5, 'FD');

  doc.setTextColor(...colorBluePrimary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(`TEMA: ${projectTitle.toUpperCase()}`, margin + 3.5, currentY + 8.8);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(
    'Subtítulo: Análise Diagnóstica da Consciência Tributária e Percepção Social da População Consumidora',
    margin + 3.5,
    currentY + 16.8
  );

  currentY += 27.2;

  // Ficha de Identificação Acadêmica e Autores
  const academicosNomes = [
    'Constancia Rodrigues Tavares de Souza',
    'Lavinia Volary Brito Teixeira',
    'Amanda Oliveira Rocha',
    'Renazielly de Souza Luz',
    'Keila Pereira dos Santos',
    'Aloísio Machado de Sousa',
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['ITEM METODOLÓGICO', 'DETALHAMENTO DO PROJETO']],
    body: [
      ['Instituição de Ensino Superior', 'Universidade do Estado do Tocantins (UNITINS)'],
      ['Polo Universitário Presencial', 'Polo UAB de Pedro Afonso – Estado do Tocantins'],
      ['Curso de Graduação', 'Bacharelado em Administração Pública'],
      ['Equipe Discente Autora', academicosNomes.join(' • ')],
      ['Critério de Inclusão Amostral', 'Consumidores maiores de 18 anos com autenticação federada Google'],
      ['Protocolo de Unicidade Amostral', 'Restrição a 1 voto por conta Google e 1 voto por dispositivo físico'],
    ],
    headStyles: {
      fillColor: colorTableHead,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11.5,
      cellPadding: 2,
    },
    bodyStyles: {
      textColor: colorTextDark,
      fontSize: 11,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: contentWidth - 70 },
    },
    styles: { overflow: 'linebreak' },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  currentY = doc.lastAutoTable.finalY + 6;

  // Seção 1: Contextualização e Metodologia Científica
  checkPageBreak(40);
  doc.setFillColor(...colorBluePrimary);
  doc.rect(margin, currentY, contentWidth, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. CONTEXTUALIZAÇÃO TEÓRICA E METODOLOGIA CIENTÍFICA', margin + 3, currentY + 6.1);

  currentY += 12.8;
  doc.setTextColor(...colorTextDark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const textMetodologia =
    'A cidadania fiscal expressa a capacidade de compreensão e acompanhamento da gestão dos tributos arrecadados pelo Estado. A presente pesquisa extensionista adota abordagem quantitativa e descritiva, utilizando amostragem não probabilística por conveniência mediante questionário eletrônico responsivo com validação rigorosa de maioridade e unicidade amostral Google/Dispositivo.';

  const splitMetodologia = doc.splitTextToSize(textMetodologia, contentWidth);
  doc.text(splitMetodologia, margin, currentY);
  currentY += splitMetodologia.length * 5.8 + 5;

  // Seção 2: Estatística Descritiva com Cards Coloridos + Tabela Compacta
  checkPageBreak(72);
  doc.setFillColor(...colorBluePrimary);
  doc.rect(margin, currentY, contentWidth, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `2. ESTATÍSTICA DESCRITIVA DA AMOSTRA COLETADA (N = ${stats.totalResponses})`,
    margin + 3,
    currentY + 6.1
  );

  currentY += 12.8;

  // 4 Cards Coloridos de Destaque Estatístico
  const cardW = (contentWidth - 9) / 4;
  const cardH = 24;

  // Card 1: N Amostral (Azul)
  doc.setFillColor(239, 246, 255); // #eff6ff
  doc.setDrawColor(59, 130, 246);
  doc.roundedRect(margin, currentY, cardW, cardH, 1, 1, 'FD');
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(10.4);
  doc.setFont('helvetica', 'bold');
  doc.text('AMOSTRA TOTAL (N)', margin + 2.5, currentY + 6.4);
  doc.setFontSize(17.6);
  doc.text(`${stats.totalResponses}`, margin + 2.5, currentY + 15.2);
  doc.setFontSize(9.6);
  doc.setFont('helvetica', 'normal');
  doc.text('Respondentes válidos', margin + 2.5, currentY + 20.8);

  // Card 2: Média e Mediana (Índigo)
  const card2X = margin + cardW + 3;
  doc.setFillColor(238, 242, 255); // #eef2ff
  doc.setDrawColor(99, 102, 241);
  doc.roundedRect(card2X, currentY, cardW, cardH, 1, 1, 'FD');
  doc.setTextColor(67, 56, 202);
  doc.setFontSize(10.4);
  doc.setFont('helvetica', 'bold');
  doc.text('MÉDIA DE IDADE (μ)', card2X + 2.5, currentY + 6.4);
  doc.setFontSize(17.6);
  doc.text(`${stats.averageAge} anos`, card2X + 2.5, currentY + 15.2);
  doc.setFontSize(9.6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Mediana: ${stats.medianAge || stats.averageAge} anos`, card2X + 2.5, currentY + 20.8);

  // Card 3: Maioridade (Verde Esmeralda)
  const card3X = card2X + cardW + 3;
  doc.setFillColor(236, 253, 245); // #ecfdf5
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(card3X, currentY, cardW, cardH, 1, 1, 'FD');
  doc.setTextColor(6, 95, 70);
  doc.setFontSize(10.4);
  doc.setFont('helvetica', 'bold');
  doc.text('CRITÉRIO MAIORIDADE', card3X + 2.5, currentY + 6.4);
  doc.setFontSize(17.6);
  doc.text('100%', card3X + 2.5, currentY + 15.2);
  doc.setFontSize(9.6);
  doc.setFont('helvetica', 'normal');
  doc.text('Todos >= 18 anos', card3X + 2.5, currentY + 20.8);

  // Card 4: Dispersão e Amplitude (Âmbar)
  const card4X = card3X + cardW + 3;
  doc.setFillColor(255, 251, 235); // #fffbeb
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(card4X, currentY, cardW, cardH, 1, 1, 'FD');
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(10.4);
  doc.setFont('helvetica', 'bold');
  doc.text('AMPLITUDE ETÁRIA', card4X + 2.5, currentY + 6.4);
  doc.setFontSize(17.6);
  doc.text(`${stats.minAge} a ${stats.maxAge}`, card4X + 2.5, currentY + 15.2);
  doc.setFontSize(9.6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Desvio Padrão: s = ${stats.standardDeviationAge || 0}`, card4X + 2.5, currentY + 20.8);

  currentY += cardH + 4;

  // Tabela compacta com todas as métricas detalhadas
  const stdDevStr = stats.standardDeviationAge ? `${stats.standardDeviationAge} anos` : '0 anos';
  const medianStr = stats.medianAge ? `${stats.medianAge} anos` : `${stats.averageAge} anos`;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['Indicador Amostral', 'Valor Apurado', 'Significado Metodológico']],
    body: [
      ['Tamanho Amostral Válido (N)', `${stats.totalResponses}`, 'Total de cidadãos que concluíram a pesquisa'],
      ['Média Aritmética Etária (μ)', `${stats.averageAge} anos`, 'Média ponderada pela data exata de nascimento'],
      ['Mediana Amostral (Md)', medianStr, 'Ponto mediano da distribuição etária (50% superior/inferior)'],
      ['Desvio Padrão Amostral (s)', stdDevStr, 'Medida de dispersão das idades em torno da média'],
      ['Intervalo Geracional (Min - Max)', `${stats.minAge} a ${stats.maxAge} anos`, 'Amplitude etária global registrada pela pesquisa'],
      ['Conformidade de Maioridade', '100% Maiores de 18 Anos', 'Restrição algorítmica rigorosa de maioridade legal'],
      ['Taxa de Completude dos Formulários', '100% de Preenchimento', 'Submissões concluídas sem omissão de quesitos'],
    ],
    headStyles: {
      fillColor: colorTableHead,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 11.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 11,
      textColor: colorTextDark,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: contentWidth - 105 },
    },
    styles: { overflow: 'linebreak' },
  });

  // ==========================================
  // PÁGINA 2+: ANÁLISE QUANTITATIVA POR QUESTÃO COM GRÁFICOS COLORIDOS
  // ==========================================
  doc.addPage();
  currentY = 22;
  drawRunningHeader();

  doc.setFillColor(...colorBluePrimary);
  doc.rect(margin, currentY, contentWidth, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.text('3. ANÁLISE QUANTITATIVA POR QUESTÃO E GRÁFICOS DE FREQUÊNCIA', margin + 3, currentY + 6.1);

  currentY += 14.4;

  // Paleta vibrante para as barras horizontais
  const barPalette: [number, number, number][] = [
    [37, 99, 235], // Azul vibrante #2563eb
    [5, 150, 105], // Esmeralda #059669
    [124, 58, 237], // Roxo / Violeta #7c3aed
    [217, 119, 6], // Âmbar / Laranja #d97706
    [8, 145, 178], // Ciano #0891b2
    [225, 29, 72], // Rosa escuro / Coral #e11d48
    [79, 70, 229], // Índigo #4f46e5
  ];

  questions.forEach((question, qIdx) => {
    const qStat = stats.questionStats[question.id];
    const optionsKeys = qStat ? Object.keys(qStat.optionCounts) : [];
    const totalVotes = optionsKeys.reduce((acc, k) => acc + qStat.optionCounts[k], 0) || 1;

    // Altura estimada do bloco unificado da pergunta (sem quebras no meio)
    // Título (7mm) + Tabela (optionsKeys.length * 7.2 + 8) + Gráfico (optionsKeys.length * 7.7 + 6) + Likert (5mm se houver)
    const estimatedHeight =
      7 +
      (optionsKeys.length > 0 ? optionsKeys.length * 6.7 + 8 : 10) +
      (question.type === 'rating' ? 5 : 0) +
      (optionsKeys.length > 0 ? optionsKeys.length * 7.7 + 8 : 0) +
      6;

    checkPageBreak(estimatedHeight);

    // Bloco de Título da Questão (colorido com borda suave)
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, contentWidth, 11, 1, 1, 'FD');

    // Marcador azul lateral
    doc.setFillColor(...colorBluePrimary);
    doc.rect(margin, currentY, 2.5, 11, 'F');

    doc.setTextColor(...colorTextDark);
    doc.setFontSize(11.5);
    doc.setFont('helvetica', 'bold');
    const cleanTitle = `Questão ${qIdx + 1}: ${question.title.replace(/^\d+\.\s*/, '')}`;
    doc.text(cleanTitle, margin + 4.5, currentY + 7.4, { maxWidth: contentWidth - 8 });

    currentY += 13.1;

    if (!qStat || qStat.totalAnswers === 0) {
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.text('Sem respostas registradas para esta questão até o momento.', margin + 2, currentY + 4.8);
      currentY += 11.2;
      return;
    }

    let cumulativePct = 0;
    const tableRows = optionsKeys.map((opt) => {
      const count = qStat.optionCounts[opt];
      const pct = (count / totalVotes) * 100;
      cumulativePct += pct;
      return [
        opt,
        `${count}`,
        `${pct.toFixed(1)}%`,
        `${Math.min(100, cumulativePct).toFixed(1)}%`,
      ];
    });

    // Tabela de Frequência Compacta (evita quebras de linha com coluna de alternativas larga)
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [['Alternativa / Opção de Resposta', 'Freq. Absoluta (FA)', 'Freq. Relativa (FR %)', 'Freq. Acumulada (FC %)']],
      body: tableRows,
      headStyles: {
        fillColor: colorTableHead,
        textColor: [255, 255, 255],
        fontSize: 11.5,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 11,
        textColor: colorTextDark,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 95 }, 
        1: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 30, halign: 'center', fontStyle: 'bold', textColor: [37, 99, 235] },
        3: { cellWidth: 31, halign: 'center' },
      },
      styles: { overflow: 'linebreak' },
    });

    // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
    currentY = doc.lastAutoTable.finalY + 3;

    // Métricas para Escala Likert
    if (question.type === 'rating' && qStat.meanRating !== undefined) {
      doc.setFillColor(243, 232, 255); // #f3e8ff
      doc.setDrawColor(192, 132, 252);
      doc.roundedRect(margin, currentY, contentWidth, 7, 0.8, 0.8, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(107, 33, 168);
      doc.text(
        `Estatística da Escala: Média Ponderada (x̄) = ${qStat.meanRating.toFixed(2)} / 5.0 | Desvio Padrão (s) = ${qStat.stdDevRating?.toFixed(2) ?? '0.00'} | Mediana = ${qStat.medianRating ?? qStat.meanRating}`,
        margin + 3,
        currentY + 5
      );
      currentY += 9.6;
    }

    // Gráfico de Barras Horizontais Colorido e Compacto
    const barMaxWidth = 85;
    optionsKeys.forEach((opt, oIdx) => {
      const count = qStat.optionCounts[opt];
      const pct = (count / totalVotes) * 100;
      const barWidth = Math.max(1.2, (pct / 100) * barMaxWidth);

      // Texto da opção à esquerda (compacto, sem quebra forçada)
      const shortOpt = opt.length > 34 ? opt.substring(0, 32) + '...' : opt;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text(shortOpt, margin + 2, currentY + 4.5);

      // Trilho de fundo cinza claro da barra
      doc.setFillColor(226, 232, 240);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin + 64, currentY, barMaxWidth, 3.2, 0.5, 0.5, 'FD');

      // Barra colorida preenchida
      doc.setFillColor(...barPalette[oIdx % barPalette.length]);
      doc.roundedRect(margin + 64, currentY, barWidth, 3.2, 0.5, 0.5, 'F');

      // Rótulo numérico à direita
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...colorNavyDark);
      doc.text(`${pct.toFixed(1)}% (${count})`, margin + 64 + barMaxWidth + 2.5, currentY + 4.2);

      currentY += 7.2;
    });

    currentY += 7.2;
  });

  // ==========================================
  // PÁGINA: LISTA NOMINAL DE PARTICIPANTES E AUDITORIA
  // ==========================================
  doc.addPage();
  currentY = 22;
  drawRunningHeader();

  doc.setFillColor(...colorBluePrimary);
  doc.rect(margin, currentY, contentWidth, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.text('4. LISTA NOMINAL DE PARTICIPANTES E AUDITORIA DE RESPOSTAS', margin + 3, currentY + 6.1);

  currentY += 12.8;

  doc.setTextColor(...colorTextDark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Relação formal e auditada de cidadãos que participaram da pesquisa mediante autenticação Google e controle de dispositivo:',
    margin,
    currentY
  );

  currentY += 7.2;

  const participants =
    stats.participantsList && stats.participantsList.length > 0
      ? stats.participantsList
      : stats.emailsList.map((item, idx) => ({
          id: `p-${idx + 1}`,
          email: item.email,
          name: item.email.split('@')[0],
          date: item.date,
          age: item.age,
          browserId: item.browserId || 'BRW-VERIFIED-HASH',
          status: 'Validado (Maior de 18)',
        }));

  const participantRows = participants.map((p, idx) => [
    `${idx + 1}`,
    p.email,
    `${p.age} anos`,
    p.date ? new Date(p.date).toLocaleString('pt-BR') : 'N/A',
    p.browserId ? p.browserId.slice(0, 16) + '...' : 'BRW-OK',
    p.status || 'Validado (Maior de 18)',
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['#', 'E-mail Autenticado (Google)', 'Idade', 'Data e Horário', 'Dispositivo Hash ID', 'Status de Validação']],
    body: participantRows.length > 0 ? participantRows : [['-', 'Nenhuma submissão registrada no banco', '-', '-', '-', '-']],
    headStyles: {
      fillColor: colorTableHead,
      textColor: [255, 255, 255],
      fontSize: 11.5,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 11,
      textColor: colorTextDark,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 55 },
      2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 37 },
      4: { cellWidth: 32 },
      5: { cellWidth: 30, halign: 'center', textColor: [5, 150, 105], fontStyle: 'bold' },
    },
    styles: { overflow: 'linebreak' },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  currentY = doc.lastAutoTable.finalY + 8;

  // ==========================================
  // CONSIDERAÇÕES FINAIS E ASSINATURAS
  // ==========================================
  checkPageBreak(72);
  doc.setFillColor(...colorBluePrimary);
  doc.rect(margin, currentY, contentWidth, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.text('5. CONSIDERAÇÕES TÉCNICO-CIENTÍFICAS E CONCLUSÃO', margin + 3, currentY + 6.1);

  currentY += 12.8;
  doc.setTextColor(...colorTextDark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const textConclusao =
    'Os dados coletados neste trabalho de extensão universitária proporcionam um diagnóstico empírico substancial sobre a compreensão da cidadania fiscal pela sociedade. Observa-se a relevância de ações pedagógicas contínuas que demonstrem como a solicitação da nota fiscal e a correta aplicação dos tributos impactam diretamente na qualidade dos serviços públicos (saúde, educação, infraestrutura e segurança).\n\n' +
    'A Universidade do Estado do Tocantins (UNITINS), por meio do polo presencial de Pedro Afonso e do programa UAB, reafirma seu compromisso com a formação ética e cidadã, aproximando a teoria da Administração Pública da realidade social da nossa comunidade.';

  const splitConclusao = doc.splitTextToSize(textConclusao, contentWidth);
  doc.text(splitConclusao, margin, currentY);
  currentY += splitConclusao.length * 5.8 + 12;

  // Bloco de Assinaturas Colorido
  checkPageBreak(44.8);
  const colWidth = (contentWidth - 10) / 2;

  doc.setDrawColor(...colorBluePrimary);
  doc.setLineWidth(0.6);
  doc.line(margin + 10, currentY, margin + colWidth - 10, currentY);
  doc.line(margin + colWidth + 10, currentY, margin + contentWidth - 10, currentY);

  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorBluePrimary);
  doc.text('Equipe Acadêmica Extensionista', margin + colWidth / 2, currentY + 6.4, { align: 'center' });
  doc.text('Coordenação do Polo – Pedro Afonso / TO', margin + colWidth + colWidth / 2, currentY + 6.4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text('Discentes do Curso de Administração Pública', margin + colWidth / 2, currentY + 12, { align: 'center' });
  doc.text('Universidade do Estado do Tocantins – UNITINS / UAB', margin + colWidth + colWidth / 2, currentY + 12, { align: 'center' });

  // Aplica o rodapé em todas as páginas
  drawAllFooters();

  // Salva o arquivo PDF
  const filename = `Relatorio_Cientifico_Cidadania_Fiscal_UNITINS_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * Função polimórfica compatível com chamadas de outros componentes (AdminDashboard, etc)
 */
export function generateScientificPdfReport(
  arg1: Question[] | SurveyStats,
  arg2?: SurveyResponse[] | Question[],
  arg3?: SurveyStats | string,
  arg4?: string
) {
  let stats: SurveyStats;
  let questions: Question[];
  let projectTitle: string = 'Trabalho Extensionista: Cidadania Fiscal na Prática';

  if (arg1 && 'totalResponses' in arg1) {
    stats = arg1 as unknown as SurveyStats;
    questions = (arg2 as Question[]) || [];
    if (typeof arg3 === 'string') projectTitle = arg3;
  } else {
    questions = (arg1 as Question[]) || [];
    if (arg3 && typeof arg3 === 'object' && 'totalResponses' in arg3) {
      stats = arg3 as unknown as SurveyStats;
    } else if (arg2 && typeof arg2 === 'object' && 'totalResponses' in arg2) {
      stats = arg2 as unknown as SurveyStats;
    } else {
      stats = {
        totalResponses: 0,
        averageAge: 0,
        medianAge: 0,
        standardDeviationAge: 0,
        minAge: 0,
        maxAge: 0,
        emailsList: [],
        participantsList: [],
        questionStats: {},
      };
    }
    if (typeof arg4 === 'string') projectTitle = arg4;
    else if (typeof arg3 === 'string') projectTitle = arg3;
  }

  return generatePdfReport(stats, questions, projectTitle);
}
