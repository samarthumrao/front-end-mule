import { useState } from 'react';

import UploadArea from '../components/UploadArea';
import SystemReadiness from '../components/SystemReadiness';
import DataSchemaTable from '../components/DataSchemaTable';

import ActionBar from '../components/ActionBar';

export default function IngestionPage({ onAnalysisComplete }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleAnalyze() {
        if (!file) return;
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            onAnalysisComplete?.(data);
        } catch (err) {
            console.error('Upload error:', err);
            alert('Failed to upload and analyze file. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-6">

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Data Ingestion</h1>
                <p className="text-gray-500">Securely upload financial transaction logs for muling detection analysis.</p>
            </div>

            {/* Main Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    <UploadArea onFileSelect={setFile} />
                    <DataSchemaTable />
                </div>

                {/* Right Column (1/3) */}
                <div className="space-y-6">
                    <SystemReadiness />

                </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6">
                <ActionBar
                    hasFile={!!file}
                    loading={loading}
                    onAnalyze={handleAnalyze}
                    onCancel={() => setFile(null)}
                />
            </div>
        </div>
    );
}
