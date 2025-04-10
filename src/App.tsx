import React, { useState } from 'react';
import NewsBlock from './components/NewsBlock';
import EditorBlock from './components/EditorBlock';
import SelectedArticles from './components/SelectedArticles';
import Header from './components/Header';
import { Article, CountryCode, Writeup } from './types';
import { summarizeMergedArticles } from './api/newsApi';
import './App.css';

const App: React.FC = () => {
    const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
    const [writeups, setWriteups] = useState<Writeup[]>([]);
    const [selectedDatabase, setSelectedDatabase] = useState<CountryCode>('SWE');

    const handleArticleSelect = (article: Article) => {
        setSelectedArticles(prev => {
            const exists = prev.some(a => a.id === article.id);
            if (exists) {
                return prev.filter(a => a.id !== article.id);
            } else {
                return [...prev, article];
            }
        });
    };

    const handleClearSelection = () => {
        setSelectedArticles([]);
    };

    const handleGenerateMerged = async () => {
        if (selectedArticles.length === 0) return;
        
        try {
            const result = await summarizeMergedArticles(selectedArticles, '');
            
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
            
            // Create a new writeup in the correct format with source attribution
            const newWriteup: Writeup = {
                id: Date.now(),
                title: headline,
                content: `<p><strong>${headline}</strong></p><p>${summary}</p>${sourceAttribution}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                articles: result.articles
            };
            
            // Use the same update handler as NewsBlock
            handleWriteupUpdate(newWriteup);
        } catch (error) {
            console.error('Error generating merged writeup:', error);
            alert(`Failed to generate merged writeup: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleWriteupUpdate = (writeup: Writeup) => {
        setWriteups(prev => {
            const existingIndex = prev.findIndex(w => w.id === writeup.id);
            if (existingIndex >= 0) {
                const newWriteups = [...prev];
                newWriteups[existingIndex] = writeup;
                return newWriteups;
            } else {
                return [...prev, writeup];
            }
        });
    };

    const handleDatabaseChange = (database: CountryCode) => {
        setSelectedDatabase(database);
        setSelectedArticles([]);
        setWriteups([]);
    };

    return (
        <div className="app">
            <Header 
                selectedDatabase={selectedDatabase}
                onDatabaseChange={handleDatabaseChange}
            />
            <div className="app-content">
                <SelectedArticles 
                    selectedArticles={selectedArticles}
                    onGenerateMerged={handleGenerateMerged}
                    onClearSelection={handleClearSelection}
                />
                <NewsBlock
                    country={selectedDatabase}
                    onArticleSelect={handleArticleSelect}
                    selectedArticles={selectedArticles}
                    onWriteupGenerated={handleWriteupUpdate}
                />
                <EditorBlock
                    selectedArticles={selectedArticles}
                    onWriteupGenerated={handleWriteupUpdate}
                    writeups={writeups}
                />
            </div>
        </div>
    );
};

export default App;
