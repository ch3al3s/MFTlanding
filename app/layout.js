export const metadata = {
  title: 'MyFortuneTracker — AI Wealth Intelligence',
  description: 'Track every asset, see what inaction costs you, and make decisions backed by 10,000 simulations. AI-powered wealth intelligence.',
  openGraph: {
    title: 'MyFortuneTracker — AI Wealth Intelligence',
    description: 'The intelligence layer between you and your wealth.',
    url: 'https://myfortunetracker.com',
    siteName: 'MyFortuneTracker',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#06101A' }}>
        {children}
      </body>
    </html>
  )
}
