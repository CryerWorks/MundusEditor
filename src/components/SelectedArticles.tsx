import React from 'react';
import { Article } from '../types';
import '../styles/SelectedArticles.css';

interface SelectedArticlesProps {
    selectedArticles: Article[];
    onGenerateMerged: () => void;
    onClearSelection: () => void;
}

const SelectedArticles: React.FC<SelectedArticlesProps> = ({
    selectedArticles,
    onGenerateMerged,
    onClearSelection
}) => {
    const hasSelectedArticles = selectedArticles.length > 0;
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Auto-expand when first article is selected
    React.useEffect(() => {
        if (hasSelectedArticles) {
            setIsExpanded(true);
        } else {
            setIsExpanded(false);
        }
    }, [hasSelectedArticles]);

    const getClassName = () => {
        if (!hasSelectedArticles) return 'hidden';
        return `${isExpanded ? 'visible' : 'minimized'}`;
    };

    return (
        <div 
            className={`content-block ${getClassName()}`} 
            id="selectedArticlesBlock"
            onClick={() => !isExpanded && setIsExpanded(true)}
            onMouseLeave={() => hasSelectedArticles && setIsExpanded(false)}
        >
            <h2>Selected Articles</h2>
            <div className="selected-actions">
                <button 
                    className="action-btn generate"
                    onClick={(e) => {
                        e.stopPropagation();
                        onGenerateMerged();
                    }}
                    disabled={!hasSelectedArticles}
                >
                    Generate Merged Writeup
                </button>
                <button 
                    className="action-btn clear"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClearSelection();
                    }}
                    disabled={!hasSelectedArticles}
                >
                    Clear Selection
                </button>
            </div>
            <div className="selected-articles-list">
                {!hasSelectedArticles ? (
                    <p className="no-articles">No articles selected</p>
                ) : (
                    <ul>
                        {selectedArticles.map(article => (
                            <li key={article.id} className="selected-article-item">
                                <span className="article-title">{article.title}</span>
                                <span className="article-source">{article.source}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default SelectedArticles; 