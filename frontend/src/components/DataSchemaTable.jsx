import { Settings2, CheckCircle2 } from 'lucide-react';

const schema = [
    { name: 'transaction_id', type: 'String', format: 'Unique Identifier (UUID)', required: true },
    { name: 'sender_id', type: 'String', format: 'Account # or Wallet ID', required: true },
    { name: 'receiver_id', type: 'String', format: 'Account # or Wallet ID', required: true },
    { name: 'amount', type: 'Float', format: 'Values > 0.00', required: true },
    { name: 'timestamp', type: 'DateTime', format: 'ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)', required: true },
];

export default function DataSchemaTable() {
    return (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-5">
                <Settings2 className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-gray-900">Required Data Schema</h3>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                Column Name
                            </th>
                            <th className="text-left py-3 px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="text-left py-3 px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                Format / Note
                            </th>
                            <th className="text-right py-3 px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                Required
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {schema.map((row, i) => (
                            <tr key={row.name} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : ''}`}>
                                <td className="py-3.5 px-2">
                                    <code className="text-primary font-semibold text-[13px]">{row.name}</code>
                                </td>
                                <td className="py-3.5 px-2 text-gray-600">{row.type}</td>
                                <td className="py-3.5 px-2 text-gray-500">{row.format}</td>
                                <td className="py-3.5 px-2 text-right">
                                    {row.required && (
                                        <CheckCircle2 className="w-5 h-5 text-success ml-auto" />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
