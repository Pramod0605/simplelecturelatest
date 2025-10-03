// Structured Data (JSON-LD) generators for SEO

export const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "SimpleLecture",
  "description": "India's first AI-powered learning platform for board exams, entrance tests, and skill development",
  "url": "https://9b289e9b-2c66-4e4a-8ec5-e3ca4d126fbb.lovableproject.com",
  "logo": "https://lovable.dev/opengraph-image-p98pqg.png",
  "sameAs": [
    "https://twitter.com/lovable_dev",
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "availableLanguage": ["English", "Hindi"]
  }
});

export const generateCourseSchema = (course: {
  name: string;
  description: string;
  provider: string;
  price?: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "Course",
  "name": course.name,
  "description": course.description,
  "provider": {
    "@type": "Organization",
    "name": course.provider
  },
  ...(course.price && {
    "offers": {
      "@type": "Offer",
      "price": course.price,
      "priceCurrency": "INR"
    }
  })
});

export const generateBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const generateWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "SimpleLecture",
  "url": "https://9b289e9b-2c66-4e4a-8ec5-e3ca4d126fbb.lovableproject.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://9b289e9b-2c66-4e4a-8ec5-e3ca4d126fbb.lovableproject.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
});

export const generateFAQSchema = (faqs: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});
