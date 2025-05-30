// IndexNow implementation for instant search engine notifications
// This notifies Bing, Yandex, and other search engines immediately when content changes

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'your-indexnow-key-here'
const BASE_URL = 'https://www.expensesorted.com'

export async function notifyIndexNow(urls: string[]) {
  if (!INDEXNOW_KEY || INDEXNOW_KEY === 'your-indexnow-key-here') {
    console.log('IndexNow key not configured, skipping notification')
    return
  }

  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        host: 'www.expensesorted.com',
        key: INDEXNOW_KEY,
        urlList: urls.map(url => url.startsWith('http') ? url : `${BASE_URL}${url}`)
      })
    })

    if (response.ok) {
      console.log(`Successfully notified IndexNow for ${urls.length} URLs`)
    } else {
      console.error('IndexNow notification failed:', response.status)
    }
  } catch (error) {
    console.error('IndexNow notification error:', error)
  }
}

// Notify about all important pages
export async function notifyAllPages() {
  const urls = [
    '/',
    '/personal-finance',
    '/demo',
    '/blog',
    '/pricing',
    '/integrations',
    '/api-landing',
    '/about',
    '/support'
  ]
  
  await notifyIndexNow(urls)
}
