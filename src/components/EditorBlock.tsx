import React, { useState, useEffect } from 'react';
import { Article, Writeup } from '../types';
import { summarizeArticle, summarizeMergedArticles } from '../api/newsApi';
import TipTapEditor from './TipTapEditor';
import '../styles/EditorBlock.css';

interface EditorBlockProps {
    selectedArticles: Article[];
    onWriteupGenerated: (writeup: Writeup) => void;
    writeups: Writeup[];
}

const EditorBlock: React.FC<EditorBlockProps> = ({ 
    selectedArticles, 
    onWriteupGenerated,
    writeups
}) => {
    const [activeTab, setActiveTab] = useState<'writeups' | 'instructions'>('writeups');
    const [instructions, setInstructions] = useState(
        'Please provide a concise summary of the following news article, highlighting the key points and maintaining an objective tone.'
    );
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const savedInstructions = localStorage.getItem('writeupInstructions');
        if (savedInstructions) {
            setInstructions(savedInstructions);
        }
    }, []);

    const handleWriteupContentChange = (content: string, writeupId: number) => {
        const updatedWriteup = writeups.find(w => w.id === writeupId);
        if (updatedWriteup) {
            onWriteupGenerated({
                ...updatedWriteup,
                content: content,
                updated_at: new Date().toISOString()
            });
        }
    };

    const handleGenerateWriteup = async () => {
        if (selectedArticles.length === 0) return;

        setLoading(true);
        try {
            let result;
            if (selectedArticles.length === 1) {
                result = await summarizeArticle(selectedArticles[0], instructions);
                
                // Parse the response to extract headline and summary
                const headlineMatch = result.summary.match(/HEADLINE: (.*?)\n/);
                const summaryMatch = result.summary.match(/SUMMARY: (.*?)$/s);
                
                const headline = headlineMatch ? headlineMatch[1].trim() : result.article.title;
                const summary = summaryMatch ? summaryMatch[1].trim() : result.summary;
                
                // Create a new writeup in the correct format with source attribution
                const sourceAttribution = `<p><em>As reported by <a href="${result.article.url}" target="_blank">${result.article.source}</a></em></p>`;
                const newWriteup: Writeup = {
                    id: Date.now(),
                    title: headline,
                    content: `<p><strong>${headline}</strong></p><p>${summary}</p>${sourceAttribution}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    articles: [result.article]
                };
                
                onWriteupGenerated(newWriteup);
            } else {
                result = await summarizeMergedArticles(selectedArticles, instructions);
                
                // Parse the response to extract headline and summary
                const headlineMatch = result.summary.match(/HEADLINE: (.*?)\n/);
                const summaryMatch = result.summary.match(/SUMMARY: (.*?)$/s);
                
                const headline = headlineMatch ? headlineMatch[1].trim() : `Merged Writeup - ${selectedArticles.length} Articles`;
                const summary = summaryMatch ? summaryMatch[1].trim() : result.summary;
                
                // Create source attribution for all articles
                const sources = selectedArticles.map(article => 
                    `<a href="${article.url}" target="_blank">${article.source}</a>`
                ).join(', ');
                const sourceAttribution = `<p><em>As reported by ${sources}</em></p>`;
                
                const newWriteup: Writeup = {
                    id: Date.now(),
                    title: headline,
                    content: `<p><strong>${headline}</strong></p><p>${summary}</p>${sourceAttribution}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    articles: result.articles
                };
                
                onWriteupGenerated(newWriteup);
            }
        } catch (error) {
            console.error('Error generating writeup:', error);
            alert(`Failed to generate writeup: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="content-block editor-block" id="editorBlock">
            <h2>Editor</h2>
            <div className="editor-tabs">
                <div
                    className={`editor-tab ${activeTab === 'writeups' ? 'active' : ''}`}
                    onClick={() => setActiveTab('writeups')}
                >
                    Writeups
                </div>
                <div
                    className={`editor-tab ${activeTab === 'instructions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('instructions')}
                >
                    Writeup Instructions
                </div>
            </div>

            <div className={`editor-content ${activeTab === 'writeups' ? 'active' : ''}`}>
                <input
                    type="text"
                    className="search-bar"
                    placeholder="Search writeups..."
                />
                <div className="writeups-container">
                    {writeups.map(writeup => (
                        <div key={writeup.id} className="writeup-card">
                            <div className="writeup-header">
                                <div className="writeup-title">
                                    <h3>{writeup.title}</h3>
                                    <div className="writeup-meta">
                                        <span>Created: {new Date(writeup.created_at).toLocaleString()}</span>
                                        <span>Updated: {new Date(writeup.updated_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <TipTapEditor
                                content={writeup.content}
                                onChange={(content) => handleWriteupContentChange(content, writeup.id)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className={`editor-content ${activeTab === 'instructions' ? 'active' : ''}`}>
                <TipTapEditor
                    content={instructions}
                    onChange={setInstructions}
                />
                <button
                    className="save-btn"
                    onClick={() => {
                        localStorage.setItem('writeupInstructions', instructions);
                    }}
                >
                    Save Instructions
                </button>
            </div>

            {selectedArticles.length > 0 && (
                <button
                    id="mergedWriteupButton"
                    className="merged-writeup-button"
                    onClick={handleGenerateWriteup}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="progress-spinner"></div>
                            <span>Generating writeup...</span>
                        </>
                    ) : (
                        `Generate ${selectedArticles.length === 1 ? 'Writeup' : 'Merged Writeup'}`
                    )}
                </button>
            )}
        </div>
    );
};

export default EditorBlock; 