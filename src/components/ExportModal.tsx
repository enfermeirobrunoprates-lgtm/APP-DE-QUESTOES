import React from 'react';
import { X, Printer, Download, FileText, CheckCircle2 } from 'lucide-react';
import { Module, Question } from '../types';

interface ExportModalProps {
  module: Module;
  questions: Question[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  module,
  questions,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    let md = `# Caderno de Estudos: ${module.title}\n`;
    md += `**Categoria:** ${module.category}\n`;
    md += `**Total de Questões:** ${questions.length}\n\n`;
    md += `---\n\n`;

    questions.forEach((q, i) => {
      md += `### Questão ${i + 1}\n`;
      md += `${q.stem}\n\n`;
      q.options.forEach((opt) => {
        md += `- **(${opt.label})** ${opt.text}\n`;
      });
      md += `\n**Gabarito Correto:** Alternative ${q.correctAnswer}\n`;
      md += `**Explicação:** ${q.explanation}\n\n`;
      if (q.breakdown?.keyConcept) {
        md += `**Conceito Chave:** ${q.breakdown.keyConcept}\n\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${module.title.replace(/\s+/g, '_')}_Caderno.md`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:static print:bg-white">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Exportar Guia de Estudos / PDF
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Imprima ou baixe o caderno completo formatado para revisão offline.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar como PDF</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200"
            >
              <Download className="w-4 h-4" />
              <span>Baixar (.MD)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Study Document Body */}
        <div className="p-8 overflow-y-auto space-y-8 print:p-0 print:overflow-visible text-slate-900 dark:text-slate-100 font-sans">
          
          {/* Header Document */}
          <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-1">
              StudyForge • Caderno de Questões com IA
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {module.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Categoria: <strong>{module.category}</strong> • Total de {questions.length} questões com gabarito comentado
            </p>
          </div>

          {/* Question List Format */}
          <div className="space-y-8">
            {questions.map((q, i) => (
              <div key={q.id} className="space-y-3 page-break-inside-avoid">
                <div className="flex items-start gap-3">
                  <span className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    Q{i + 1}
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed flex-1">
                    {q.stem}
                  </p>
                </div>

                <div className="pl-7 space-y-1.5">
                  {q.options.map((opt) => (
                    <div
                      key={opt.label}
                      className={`text-xs p-2 rounded-lg border ${
                        opt.label === q.correctAnswer
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 font-semibold text-emerald-950 dark:text-emerald-200'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <strong className="mr-2">({opt.label})</strong> {opt.text}
                      {opt.label === q.correctAnswer && (
                        <span className="ml-2 text-[10px] text-emerald-600 font-bold">✓ Gabarito</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pl-7 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-indigo-600 dark:text-indigo-400 block mb-1">Explicação Pedagógica:</strong>
                    {q.explanation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
