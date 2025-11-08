# Maritime Job Market Widget

Professional embeddable widget displaying live California & West Coast maritime job market data.

## 🎯 What This Widget Shows

**Top Stats (2 cards side-by-side):**
- Total Active Job Openings
- Job Openings in California

**Data Columns (3 cards side-by-side):**
- Jobs in Highest Demand (Top 10 job titles with pay ranges)
- Top Hiring California Cities (Top 10 cities by job count)
- Top Hiring Companies (Top 10 companies actively recruiting)

## 📊 Data Source

Automatically fetches from **MaritimeReport_Data** Google Sheet tab.  
Updates: **Every Monday at 2:30 AM EST**

## 🚀 Quick Integration

Add to your webpage:

```html
<link rel="stylesheet" href="https://macgyvered.github.io/maritime-job-widget/maritime-widget.css">
<div id="maritime-jobs-widget" data-maritime-widget></div>
<script src="https://macgyvered.github.io/maritime-job-widget/maritime-widget.js"></script>
```

## 🎨 Live Demo

**https://macgyvered.github.io/maritime-job-widget/**

## ✨ Features

- **Auto-Updates** - Data refreshes every Monday at 2:30 AM EST
- **Smart Caching** - 1-hour local cache to minimize API calls
- **Fully Responsive** - Desktop, tablet, mobile optimized
- **Professional Design** - Nunito Sans typography, clean layout
- **Zero Maintenance** - Set it and forget it
- **No Dependencies** - Pure vanilla JavaScript

## 📐 Specifications

- **Max Width**: 1200px (auto-centers)
- **Min Width**: 280px (mobile-friendly)
- **Font**: Nunito Sans (Google Fonts)
- **Colors**: Navy blue (#1e3a5f) primary
- **Layout**: Card-based responsive grid

## 🔧 Files

- `maritime-widget.js` - Widget logic
- `maritime-widget.css` - Styling
- `index.html` - Demo page
- `README.md` - Documentation

## 🌐 Browser Support

- Chrome, Firefox, Safari, Edge (latest)
- iOS Safari 12+
- Android Chrome 70+

## 🔒 Privacy

- No tracking or analytics
- No external dependencies
- Local caching only
- ~10KB total size

---

**Built for Maritime Career Hub**  
Last Updated: November 2025
