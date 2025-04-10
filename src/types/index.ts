export type CountryCode = 'SWE' | 'POL' | 'FIN' | 'DEN';

export interface Article {
    id: number;
    source: string;
    title: string;
    url: string;
    published: string;
    scraped_at: string;
    Category?: string;
    preview?: {
        description: string;
        favicon: string | null;
        image: string | null;
    };
}

export interface FilterState {
    search: string;
    source: string;
    category: string;
    time: string;
}

export interface Writeup {
    id: number;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    articles: Article[];
}

export interface ArticleResponse {
    articles: Article[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

export interface EditorState {
    activeTab: 'writeups' | 'instructions';
    instructions: string;
} 