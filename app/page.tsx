'use client';

import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Github, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'url' | 'document'>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [ghToken, setGhToken] = useState('');
  const [repo, setRepo] = useState(''); // format: owner/repo
  const [path, setPath] = useState('quizzes'); // target directory in repo
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('ghToken', ghToken);
    formData.append('repo', repo);
    formData.append('path', path);

    if (activeTab === 'url') {
      formData.append('type', 'url');
      formData.append('url', url);
    } else {
      if (!file) {
        setStatus({ type: 'error', msg: 'Please select a document to upload.' });
        setLoading(false);
        return;
      }
      formData.append('type', 'document');
      formData.append('file', file);
    }

    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process quiz');

      setStatus({
        type: 'success',
        msg: `Quiz generated and committed successfully! View file at: ${data.commitUrl}`,
      });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full text-indigo-400 text-sm font-medium">
            <Sparkles className="w-4 h-4" /> AI-Powered Quiz Generator
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Studyd
          </h1>
          <p className="text-slate-400 text-lg">
            Turn any URL or document into a structured Markdown quiz committed directly to GitHub.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
          
          {/* GitHub Config Section */}
          <div className="space-y-4 border-b border-slate-800 pb-6">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Github className="w-4 h-4" /> GitHub Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Personal Access Token</label>
                <input
                  type="password"
                  required
                  placeholder="ghp_..."
                  value={ghToken}
                  onChange={(e) => setGhToken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Repository (owner/repo)</label>
                <input
                  type="text"
                  required
                  placeholder="username/my-quizzes"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Input Type Selector */}
          <div className="space-y-4">
            <div className="flex border-b border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'url'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <LinkIcon className="w-4 h-4" /> From URL
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('document')}
                className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'document'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-4 h-4" /> Upload Document
              </button>
            </div>

            {/* URL Input */}
            {activeTab === 'url' ? (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Article or Documentation URL</label>
                <input
                  type="url"
                  required={activeTab === 'url'}
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            ) : (
              /* Document Input */
              <div>
                <label className="block text-xs text-slate-400 mb-1">Text or Markdown File (.txt, .md)</label>
                <input
                  type="file"
                  required={activeTab === 'document'}
                  accept=".txt,.md,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            {loading ? (
              <span>Generating & Committing...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate & Push to GitHub
              </>
            )}
          </button>

          {/* Status Feedback */}
          {status && (
            <div
              className={`p-4 rounded-xl flex items-start gap-3 border ${
                status.type === 'success'
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <span className="text-sm break-all">{status.msg}</span>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
