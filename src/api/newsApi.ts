import { Article, CountryCode, FilterState } from '../types';

const API_BASE_URL = 'https://mundus-backend.onrender.com';

export const fetchArticles = async (country: CountryCode, page: number = 1, filters: FilterState) => {
    const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        search: filters.search,
        source: filters.source,
        category: filters.category,
        time: filters.time
    });

    const response = await fetch(`${API_BASE_URL}/api/articles/${country}?${params}`);
    if (!response.ok) {
        throw new Error('Failed to fetch articles');
    }
    return response.json();
};

export const fetchSources = async (country: CountryCode): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/api/sources/${country}`);
    if (!response.ok) {
        throw new Error('Failed to fetch sources');
    }
    return response.json();
};

export const fetchCategories = async (country: CountryCode): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/api/categories/${country}`);
    if (!response.ok) {
        throw new Error('Failed to fetch categories');
    }
    return response.json();
};

export const fetchArticlePreview = async (country: CountryCode, articleId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/article-preview/${country}/${articleId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch article preview');
    }
    return response.json();
};

export const summarizeArticle = async (article: Article, instructions: string, selectedText?: string): Promise<{ summary: string, article: Article }> => {
    try {
        console.log('Sending request to summarize article:', {
            url: article.url,
            title: article.title,
            source: article.source
        });

        const response = await fetch(`${API_BASE_URL}/api/summarize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                article: {
                    id: article.id,
                    title: article.title,
                    source: article.source,
                    url: article.url,
                    published: article.published,
                    Category: article.Category
                },
                instructions: instructions || 'Please provide a concise summary of the following news article, highlighting the key points and maintaining an objective tone.',
                selected_text: selectedText || ''
            })
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('Backend error response:', {
                status: response.status,
                statusText: response.statusText,
                errorData: responseData
            });
            throw new Error(
                `Failed to generate summary: ${responseData.error || response.statusText}\n` +
                `Error type: ${responseData.error_type || 'Unknown'}\n` +
                `Error details: ${responseData.error_args || 'No additional details'}`
            );
        }

        return {
            summary: responseData.summary,
            article: responseData.article
        };
    } catch (error) {
        console.error('Error in summarizeArticle:', error);
        throw error;
    }
};

export const summarizeMergedArticles = async (articles: Article[], instructions: string, selectedText?: string): Promise<{ summary: string, articles: Article[] }> => {
    try {
        console.log('Sending request to summarize merged articles:', {
            articleCount: articles.length
        });

        const response = await fetch(`${API_BASE_URL}/api/summarize-merged`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                articles: articles.map(article => ({
                    id: article.id,
                    title: article.title,
                    source: article.source,
                    url: article.url,
                    published: article.published,
                    Category: article.Category
                })),
                instructions: instructions || 'Please provide a comprehensive summary of the following news articles, highlighting the key points and maintaining an objective tone.',
                selected_text: selectedText || ''
            })
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('Backend error response:', {
                status: response.status,
                statusText: response.statusText,
                errorData: responseData
            });
            throw new Error(
                `Failed to generate summary: ${responseData.error || response.statusText}\n` +
                `Error type: ${responseData.error_type || 'Unknown'}\n` +
                `Error details: ${responseData.error_args || 'No additional details'}`
            );
        }

        return {
            summary: responseData.summary,
            articles: responseData.articles
        };
    } catch (error) {
        console.error('Error in summarizeMergedArticles:', error);
        throw error;
    }
}; 