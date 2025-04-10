import React, { useState, useEffect } from 'react';
import { Article, CountryCode, FilterState, Writeup } from '../types';
import { fetchArticles, fetchSources, fetchCategories, fetchArticlePreview, summarizeArticle } from '../api/newsApi';
import '../styles/NewsBlock.css';

interface NewsBlockProps {
    country: CountryCode;
    onArticleSelect: (article: Article) => void;
    selectedArticles: Article[];
    onWriteupGenerated: (writeup: Writeup) => void;
}

interface ArticlePreview {
    description: string;
    favicon: string | null;
    image: string | null;
}

const NewsBlock: React.FC<NewsBlockProps> = ({ country, onArticleSelect, selectedArticles, onWriteupGenerated }) => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [sources, setSources] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        source: '',
        category: '',
        time: '24'
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [previewArticle, setPreviewArticle] = useState<(Article & { preview?: ArticlePreview }) | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [generatingWriteup, setGeneratingWriteup] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [sourcesData, categoriesData, articlesData] = await Promise.all([
                    fetchSources(country),
                    fetchCategories(country),
                    fetchArticles(country, currentPage, filters)
                ]);

                setSources(sourcesData);
                setCategories(categoriesData);
                setArticles(articlesData.articles);
                setTotalPages(articlesData.total_pages);
            } catch (error) {
                console.error('Error loading data:', error);
            }
            setLoading(false);
        };

        loadData();
    }, [country, currentPage, filters]);

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const isArticleSelected = (article: Article) => {
        return selectedArticles.some(a => a.id === article.id);
    };

    const handleArticleClick = async (article: Article) => {
        if (previewArticle?.id === article.id) {
            setPreviewArticle(null);
            return;
        }

        setPreviewArticle({ ...article });
        setLoadingPreview(true);
        
        try {
            const previewData = await fetchArticlePreview(country, article.id);
            setPreviewArticle({ ...article, ...previewData });
        } catch (error) {
            console.error('Error loading article preview:', error);
            setPreviewArticle(null);
        }
        setLoadingPreview(false);
    };

    const handleCheckboxClick = (e: React.MouseEvent, article: Article) => {
        e.stopPropagation();
        onArticleSelect(article);
        
        // Force the SelectedArticles menu to expand
        const selectedArticlesBlock = document.getElementById('selectedArticlesBlock');
        if (selectedArticlesBlock) {
            selectedArticlesBlock.classList.remove('minimized');
            selectedArticlesBlock.classList.add('visible');
        }
    };

    const handleGenerateWriteup = async (e: React.MouseEvent, article: Article) => {
        e.stopPropagation();
        setGeneratingWriteup(true);
        try {
            const articleData: Article = {
                id: article.id,
                title: article.title,
                source: article.source,
                url: article.url,
                published: article.published,
                scraped_at: article.scraped_at,
                Category: article.Category
            };
            
            const result = await summarizeArticle(articleData, '');
            
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
            
            // Send the writeup to App.tsx
            onWriteupGenerated(newWriteup);
            
        } catch (error) {
            console.error('Error generating writeup:', error);
            alert(`Failed to generate writeup: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setGeneratingWriteup(false);
        }
    };

    return (
        <div className="content-block" id="newsBlock">
            <h2>News</h2>
            <div className="search-header">
                <span className="current-db">Database: {country}</span>
                <input
                    type="text"
                    className="search-bar"
                    placeholder="Search news articles..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                />
            </div>
            <div className="search-filters">
                <div className="filter-group">
                    <select
                        value={filters.source}
                        onChange={(e) => handleFilterChange('source', e.target.value)}
                    >
                        <option value="">All Sources</option>
                        {sources.map(source => (
                            <option key={source} value={source}>{source}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <select
                        value={filters.time}
                        onChange={(e) => handleFilterChange('time', e.target.value)}
                    >
                        <option value="24">Last 24 hours</option>
                        <option value="48">Last 48 hours</option>
                        <option value="72">Last 72 hours</option>
                        <option value="168">Last Week</option>
                    </select>
                </div>
            </div>
            {loading ? (
                <div className="progress-indicator">
                    <div className="progress-spinner"></div>
                    <p>Loading articles...</p>
                </div>
            ) : (
                <>
                    <div className="articles-grid">
                        {articles.map(article => (
                            <div
                                key={article.id}
                                className={`article-card${isArticleSelected(article) ? ' selected' : ''}${previewArticle?.id === article.id ? ' expanded' : ''}${loadingPreview && previewArticle?.id === article.id ? ' loading' : ''}`}
                                onClick={() => handleArticleClick(article)}
                            >
                                <div className="article-content">
                                    <h3>{article.title}</h3>
                                    <div className="article-info">
                                        <p>Source: {article.source}</p>
                                        <p>Category: {article.Category || 'Uncategorized'}</p>
                                        <p>Published: {new Date(article.published).toLocaleDateString()}</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="article-checkbox"
                                        checked={isArticleSelected(article)}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleCheckboxClick(e as unknown as React.MouseEvent, article);
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                    />
                                </div>
                                
                                {previewArticle?.id === article.id && (
                                    <div className="preview-content">
                                        {loadingPreview ? (
                                            <>
                                                <div className="preview-content-placeholder">
                                                    <div className="placeholder-line"></div>
                                                    <div className="placeholder-line"></div>
                                                    <div className="placeholder-line"></div>
                                                </div>
                                                <div className="progress-indicator">
                                                    <div className="progress-spinner"></div>
                                                    <p>Loading preview...</p>
                                                </div>
                                            </>
                                        ) : previewArticle.preview ? (
                                            <>
                                                {previewArticle.preview.image && (
                                                    <img 
                                                        src={previewArticle.preview.image} 
                                                        alt="article preview" 
                                                        className="preview-image"
                                                    />
                                                )}
                                                <p className="preview-description">
                                                    {previewArticle.preview.description || 'No preview available.'}
                                                    {previewArticle.preview.favicon && (
                                                        <img 
                                                            src={previewArticle.preview.favicon} 
                                                            alt="source icon" 
                                                            className="source-favicon"
                                                        />
                                                    )}
                                                </p>
                                                <div className="preview-actions">
                                                    <button
                                                        className="preview-action-btn generate"
                                                        onClick={(e) => handleGenerateWriteup(e, previewArticle)}
                                                        disabled={generatingWriteup}
                                                    >
                                                        {generatingWriteup ? 'Generating...' : 'Generate Writeup'}
                                                    </button>
                                                    <a
                                                        href={previewArticle.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="preview-action-btn read"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Read Full Article
                                                    </a>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="preview-description">No preview available.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="pagination-controls">
                        <button
                            className="pagination-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            Previous
                        </button>
                        <span id="pageInfo">Page {currentPage} of {totalPages}</span>
                        <button
                            className="pagination-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default NewsBlock; 