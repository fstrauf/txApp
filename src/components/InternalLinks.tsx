import Link from 'next/link'

interface InternalLinksProps {
  currentPage?: string
  variant?: 'footer' | 'sidebar' | 'inline'
}

export function InternalLinks({ currentPage, variant = 'footer' }: InternalLinksProps) {
  const importantLinks = [
    { href: '/', label: 'Personal Finance Health Check', priority: 'high' },
    { href: '/personal-finance', label: 'Financial Assessment', priority: 'high' },
    { href: '/demo', label: 'AI Categorization Demo', priority: 'high' },
    { href: '/blog', label: 'Financial Freedom Blog', priority: 'high' },
    { href: '/integrations', label: 'Banking Integrations', priority: 'medium' },
    { href: '/pricing', label: 'Pricing & Plans', priority: 'medium' },
    { href: '/api-landing', label: 'Developer API', priority: 'medium' },
    { href: '/about', label: 'About ExpenseSorted', priority: 'low' },
    { href: '/support', label: 'Help & Support', priority: 'low' }
  ]

  const blogLinks = [
    { href: '/blog/private-expense-tracking-without-big-tech', label: 'Private Expense Tracking' },
    { href: '/blog/nz-budget-template-google-sheets-2025', label: 'Free NZ Budget Template' },
    { href: '/blog/financial-wellness-beyond-budgets-true-freedom', label: 'Financial Wellness Guide' },
    { href: '/blog/budgeting-apps-nz-privacy-guide-2025', label: 'Budgeting Apps Privacy Guide' },
    { href: '/blog/financial-freedom-trust-nz-guide-2025', label: 'NZ Trust Guide' }
  ]

  // Filter out current page
  const filteredLinks = importantLinks.filter(link => link.href !== currentPage)
  const filteredBlogLinks = blogLinks.filter(link => link.href !== currentPage)

  if (variant === 'inline') {
    return (
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Explore More Financial Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredLinks.slice(0, 6).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-primary hover:text-primary-dark font-medium transition-colors"
            >
              → {link.label}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'sidebar') {
    return (
      <nav className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Key Pages</h4>
          <ul className="space-y-1">
            {filteredLinks.slice(0, 5).map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Popular Articles</h4>
          <ul className="space-y-1">
            {filteredBlogLinks.slice(0, 4).map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    )
  }

  // Footer variant
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">Financial Tools</h4>
        <ul className="space-y-2">
          {filteredLinks.filter(l => l.priority === 'high').map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-gray-600 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">Integrations</h4>
        <ul className="space-y-2">
          {filteredLinks.filter(l => l.priority === 'medium').map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-gray-600 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        <h4 className="font-semibold text-gray-900 mb-4">Popular Articles</h4>
        <ul className="space-y-2">
          {filteredBlogLinks.slice(0, 4).map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-gray-600 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default InternalLinks
