/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface ComparisonRow {
  feature: string;
  category1: string; // e.g., Internet Best-Effort
  category2: string; // e.g., ATM CBR
  category3?: string; // e.g., ATM ABR
}

interface ComparisonTableProps {
  title: string;
  categoryNames: string[]; // [label1, label2, optional label3]
  rows: ComparisonRow[];
}

export function ComparisonTable({ title, categoryNames, rows }: ComparisonTableProps) {
  const showThree = categoryNames.length === 3;

  return (
    <div id="comparison-table-wrapper" className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm my-6">
      {title && (
        <div className="bg-slate-50 border-b border-slate-150 px-5 py-3.5">
          <h4 className="text-sm font-bold text-slate-700">{title}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table id="comparison-table" className="w-full text-left text-xs border-collapse font-sans">
          <thead>
            <tr className="bg-slate-100/60 font-bold text-slate-600 border-b border-slate-200/60">
              <th className="p-4 font-semibold uppercase tracking-wider">比較項目 (Feature)</th>
              <th className="p-4 font-semibold uppercase tracking-wider">{categoryNames[0]}</th>
              <th className="p-4 font-semibold uppercase tracking-wider">{categoryNames[1]}</th>
              {showThree && (
                <th className="p-4 font-semibold uppercase tracking-wider">{categoryNames[2]}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 duration-200">
                <td className="p-4 font-bold text-slate-800 bg-slate-50/30">{row.feature}</td>
                <td className="p-4 leading-relaxed font-normal">{row.category1}</td>
                <td className="p-4 leading-relaxed font-normal">{row.category2}</td>
                {showThree && (
                  <td className="p-4 leading-relaxed font-normal">{row.category3}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
