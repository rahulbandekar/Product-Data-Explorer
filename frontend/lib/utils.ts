export function formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  }
  
  export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  
  export function getImageUrl(url: string): string {
    if (!url) return '/placeholder-book.jpg';
    if (url.startsWith('http')) return url;
    return `https://www.worldofbooks.com${url}`;
  }