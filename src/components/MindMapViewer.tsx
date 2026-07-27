import React, { useState } from 'react';
import { MindMapData, MindMapNode } from '../types';
import { Sparkles, ChevronDown, ChevronRight, Layers } from 'lucide-react';

interface MindMapViewerProps {
  data: MindMapData;
  onRefresh?: () => void;
  isGenerating?: boolean;
}

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  indigo: {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-700',
  },
  emerald: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700',
  },
  amber: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
  },
  rose: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-700',
  },
  sky: {
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-300 dark:border-sky-700',
  },
  purple: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700',
  },
};

export const MindMapNodeItem: React.FC<{ node: MindMapNode; depth?: number }> = ({
  node,
  depth = 0,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const style = colorMap[node.color || 'indigo'] || colorMap.indigo;

  return (
    <div className="flex flex-col items-center">
      <div
        onClick={() => hasChildren && setCollapsed(!collapsed)}
        className={`px-3.5 py-2 rounded-xl border ${style.bg} ${style.border} ${style.text} shadow-xs font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
          hasChildren ? 'cursor-pointer hover:opacity-90' : ''
        }`}
      >
        <span>{node.label}</span>
        {hasChildren && (
          <span className="opacity-70">
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        )}
      </div>

      {hasChildren && !collapsed && (
        <div className="flex flex-col items-center w-full mt-2">
          {/* Vertical line connecting parent to children container */}
          <div className="w-0.5 h-4 bg-slate-300 dark:bg-slate-700" />

          {/* Children container */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 pt-2 border-t border-slate-300 dark:border-slate-700 relative">
            {node.children!.map((child) => (
              <MindMapNodeItem key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const MindMapViewer: React.FC<MindMapViewerProps> = ({ data, onRefresh, isGenerating }) => {
  if (!data) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 text-slate-100 space-y-4 my-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Mapa Mental Visual
            </h4>
            <p className="text-sm font-semibold text-white">{data.centralTopic}</p>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Regerando...' : 'Regerar IA'}</span>
          </button>
        )}
      </div>

      {/* Diagram Canvas */}
      <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-x-auto min-h-[160px] flex items-center justify-center">
        <MindMapNodeItem node={data.root} />
      </div>
    </div>
  );
};
