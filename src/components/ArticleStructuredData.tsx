import { useEffect } from 'react';
import { MedicalNews } from '../types';

interface ArticleStructuredDataProps {
  article: MedicalNews;
}

export default function ArticleStructuredData({ article }: ArticleStructuredDataProps) {
  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": article.summary,
      "image": article.image_url,
      "datePublished": article.published_at,
      "dateModified": article.published_at,
      "author": {
        "@type": "Organization",
        "name": article.source,
        "url": "https://mednewsai.com"
      },
      "publisher": {
        "@type": "Organization",
        "name": "MedNewsAI",
        "logo": {
          "@type": "ImageObject",
          "url": "https://mednewsai.com/logo.png"
        }
      },
      "articleSection": article.category,
      "keywords": `medical AI, ${article.category}, healthcare innovation, artificial intelligence`,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://mednewsai.com/article/${article.id}`
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    script.id = `article-structured-data-${article.id}`;
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById(`article-structured-data-${article.id}`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [article]);

  return null;
}
