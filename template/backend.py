from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import codecs
import openai
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow frontend access

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# Serve static files
@app.route('/')
def serve_frontend():
    return send_from_directory('.', 'frontpagetest.html')

@app.route('/frontpagetest.css')
def serve_css():
    return send_from_directory('.', 'frontpagetest.css')

DATABASES = {
    'swe': 'swedish_news_URLs.db',
    'pol': 'polish_news_URLs.db', 
    'fin': 'finnish_news_URLs.db',
    'den': 'danish_news_URLs.db'
}

def get_db_connection(country_code):
    db_path = DATABASES.get(country_code.lower())
    if not db_path:
        raise ValueError("Unsupported country code")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    # Enable UTF-8 encoding for the connection
    conn.text_factory = str
    return conn

@app.route("/api/articles/<country>", methods=["GET"])
def get_articles(country):
    try:
        search_query = request.args.get('search', '')
        source = request.args.get('source', '')
        category = request.args.get('category', '')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        time_filter = request.args.get('time', '')  # Get time filter value
        
        conn = get_db_connection(country)
        
        # Build the time filter condition
        time_condition = ""
        time_params = []
        if time_filter:
            hours = int(time_filter)
            # Calculate the cutoff time using Python's datetime
            cutoff_time = (datetime.now() - timedelta(hours=hours)).isoformat()
            time_condition = "AND published >= ?"
            time_params = [cutoff_time]
        
        # First, get total count
        count_query = f"""
            SELECT COUNT(*) as total
            FROM articles 
            WHERE (? = '' OR LOWER(title) LIKE LOWER(?))
            AND (? = '' OR source = ?)
            AND (? = '' OR AI_tag = ?)
            {time_condition}
        """
        search_pattern = f"%{search_query}%"
        total_count = conn.execute(count_query, 
                                 (search_query, search_pattern,
                                  source, source,
                                  category, category) + tuple(time_params)).fetchone()['total']
        
        # Then get paginated results
        offset = (page - 1) * per_page
        query = f"""
            SELECT id, source, title, url, published, scraped_at, AI_tag as Category
            FROM articles 
            WHERE (? = '' OR LOWER(title) LIKE LOWER(?))
            AND (? = '' OR source = ?)
            AND (? = '' OR AI_tag = ?)
            {time_condition}
            ORDER BY published DESC
            LIMIT ? OFFSET ?
        """
        
        # Add time_params to the query parameters
        query_params = [
            search_query, search_pattern,
            source, source,
            category, category
        ] + time_params + [per_page, offset]
        
        articles = conn.execute(query, query_params).fetchall()
        conn.close()
        
        return jsonify({
            "articles": [dict(row) for row in articles],
            "total": total_count,
            "page": page,
            "per_page": per_page,
            "total_pages": (total_count + per_page - 1) // per_page
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/sources/<country>", methods=["GET"])
def get_sources(country):
    try:
        conn = get_db_connection(country)
        sources = conn.execute("SELECT DISTINCT source FROM articles").fetchall()
        conn.close()
        return jsonify([dict(row)["source"] for row in sources])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/categories/<country>", methods=["GET"])
def get_categories(country):
    try:
        conn = get_db_connection(country)
        categories = conn.execute("SELECT DISTINCT AI_tag as Category FROM articles WHERE AI_tag IS NOT NULL ORDER BY AI_tag").fetchall()
        conn.close()
        return jsonify([dict(row)["Category"] for row in categories])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/article-preview/<country>/<int:article_id>", methods=["GET"])
def get_article_preview(country, article_id):
    try:
        conn = get_db_connection(country)
        query = """
            SELECT title, url, published, source, AI_tag as Category
            FROM articles 
            WHERE id = ?
        """
        article = conn.execute(query, (article_id,)).fetchone()
        conn.close()
        
        if article:
            # Fetch webpage content with proper encoding
            try:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept-Charset': 'utf-8'
                }
                response = requests.get(article['url'], headers=headers, timeout=5)
                response.encoding = response.apparent_encoding or 'utf-8'
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Get meta description or first paragraph
                meta_desc = soup.find('meta', {'name': 'description'})
                if meta_desc:
                    description = meta_desc.get('content', '')
                else:
                    # Try to find the first paragraph
                    first_p = soup.find('p')
                    description = first_p.text if first_p else ''
                
                # Get favicon
                favicon = soup.find('link', {'rel': 'icon'}) or soup.find('link', {'rel': 'shortcut icon'})
                favicon_url = favicon['href'] if favicon else None
                if favicon_url and not favicon_url.startswith(('http://', 'https://')):
                    parsed_url = urlparse(article['url'])
                    favicon_url = f"{parsed_url.scheme}://{parsed_url.netloc}{favicon_url}"
                
                # Get main image if available
                main_image = soup.find('meta', {'property': 'og:image'})
                image_url = main_image['content'] if main_image else None
                
                return jsonify({
                    **dict(article),
                    'preview': {
                        'description': description[:300] + '...' if len(description) > 300 else description,
                        'favicon': favicon_url,
                        'image': image_url
                    }
                })
            except Exception as e:
                # If preview fails, return basic article info
                return jsonify(dict(article))
                
        return jsonify({"error": "Article not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/summarize", methods=["POST"])
def summarize_article():
    try:
        data = request.json
        article = data.get('article')
        instructions = data.get('instructions', 'Please provide a concise summary of the following news article, highlighting the key points and maintaining an objective tone.')
        selected_text = data.get('selected_text', '')
        
        if not article or not article.get('url'):
            return jsonify({"error": "Article URL is required"}), 400

        # Fetch article content
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Charset': 'utf-8'
        }
        response = requests.get(article['url'], headers=headers, timeout=10)
        response.encoding = response.apparent_encoding or 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract main content
        article_text = ''
        for p in soup.find_all('p'):
            article_text += p.get_text() + '\n'
        
        # If selected_text is provided, use it as the content to summarize
        content_to_summarize = selected_text if selected_text else article_text
        
        # Truncate text to avoid token limits
        content_to_summarize = content_to_summarize[:4000]
        
        # Create the prompt for GPT-3.5
        prompt = f"""Title: {article['title']}
Source: {article['source']}
Date: {article['published']}

{instructions}

Content to summarize:
{content_to_summarize}

Please provide a well-structured summary that includes:
1. Key points
2. Main arguments
3. STAY FACTUAL AND OBJECTIVE - avoid loaded language and only summarise the facts reported in original article
4. ONLY use British English - avoid Americanisms and other non-British English expressions. "Z" turn to "S" and "Center" turn to "Centre", Defence instead of Defense.
5. Keep it short and concise - maximum 200 words.

Summary:"""

        # Call OpenAI API using the new format
        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional news analyst providing concise, objective summaries of news articles."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=500
        )
        
        # Extract the summary from the response using the new format
        summary = response.choices[0].message.content
        
        return jsonify({
            "summary": summary,
            "article": article
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/summarize-merged", methods=["POST"])
def summarize_merged_articles():
    try:
        data = request.json
        articles = data.get('articles', [])
        instructions = data.get('instructions', 'Please provide a comprehensive summary of the following news articles, highlighting the key points and maintaining an objective tone.')
        selected_text = data.get('selected_text', '')
        
        if not articles or len(articles) == 0:
            return jsonify({"error": "At least one article is required"}), 400

        # Fetch content for all articles
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Charset': 'utf-8'
        }
        
        article_contents = []
        for article in articles:
            try:
                response = requests.get(article['url'], headers=headers, timeout=10)
                response.encoding = response.apparent_encoding or 'utf-8'
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract main content
                article_text = ''
                for p in soup.find_all('p'):
                    article_text += p.get_text() + '\n'
                
                # If selected_text is provided, use it as the content to summarize
                content_to_summarize = selected_text if selected_text else article_text
                
                # Truncate text to avoid token limits # Make scroll wheel / pages  
                content_to_summarize = content_to_summarize[:2000]  # Reduced limit for multiple articles
                article_contents.append({
                    'title': article['title'],
                    'source': article['source'],
                    'date': article['published'],
                    'content': content_to_summarize
                })
            except Exception as e:
                print(f"Error fetching article {article['url']}: {str(e)}")
                continue

        if not article_contents:
            return jsonify({"error": "Failed to fetch any article contents"}), 400

        # Create the prompt for GPT-3.5
        articles_text = "\n\n".join([
            f"""Article {i+1}:
Title: {article['title']}
Source: {article['source']}
Date: {article['date']}
Content: {article['content']}"""
            for i, article in enumerate(article_contents)
        ])

        prompt = f"""{instructions}

{articles_text}

Please provide a comprehensive summary that includes:
1. Key points from all articles
2. Main arguments and their connections
3. STAY FACTUAL AND OBJECTIVE - avoid loaded language and only summarise the facts reported in original articles
4. ONLY use British English - avoid Americanisms and other non-British English expressions. "Z" turn to "S" and "Center" turn to "Centre", Defence instead of Defense.
5. Keep it concise but comprehensive - maximum 400 words.
6. Highlight any patterns, connections, or contradictions between the articles.

Summary:"""

        # Call OpenAI API using the new format
        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional news analyst providing comprehensive, objective summaries of multiple related news articles."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=2000
        )
        
        # Extract the summary from the response using the new format
        summary = response.choices[0].message.content
        
        return jsonify({
            "summary": summary,
            "articles": articles
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)