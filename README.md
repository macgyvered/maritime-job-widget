# ⚓ Maritime Job Market Widget

**Automatically display live maritime job market data on your website**

![Maritime Widget](https://img.shields.io/badge/Status-Production%20Ready-green) ![WordPress Compatible](https://img.shields.io/badge/WordPress-Compatible-blue) ![Auto Updates](https://img.shields.io/badge/Updates-Automated-brightgreen)

---

## 🌊 What It Does

This widget displays real-time maritime job market analytics on your website, pulling data directly from your automated Google Sheets pipeline that updates every Monday.

**Live Data Displayed:**
- 💼 Total active maritime job listings
- 📍 Bay Area job opportunities
- 🌊 Top 5 hiring locations
- 🚢 Top 5 hiring companies
- 🕒 Last update timestamp

---

## ✨ Features

- ✅ **Fully Automated** - Zero maintenance required
- ✅ **Auto-Updates** - Syncs with your Google Sheets every Monday
- ✅ **Mobile Responsive** - Looks great on all devices
- ✅ **Maritime Theme** - Professional nautical styling
- ✅ **Lightweight** - Fast loading (~10KB total)
- ✅ **WordPress Ready** - Easy integration in 5 minutes
- ✅ **Customizable** - Adjust colors, counts, and refresh rates

---

## 🚀 Quick Start

### For WordPress:

1. **Upload files** to your WordPress theme folder:
   - `maritime-widget.js`
   - `maritime-widget.css`

2. **Add to your page** (use Custom HTML block):
```html
<link rel="stylesheet" href="/wp-content/themes/YOUR-THEME/maritime-widget.css">
<div id="maritime-jobs-widget" data-maritime-widget></div>
<script src="/wp-content/themes/YOUR-THEME/maritime-widget.js"></script>
```

3. **Publish** - That's it! 🎉

📖 [Full WordPress Integration Guide →](WORDPRESS_INTEGRATION_GUIDE.md)

---

## 📁 File Structure

```
maritime-widget/
├── maritime-widget.js          # Main widget JavaScript
├── maritime-widget.css         # Maritime-themed styling
├── index.html                  # Demo page (for testing)
├── WORDPRESS_INTEGRATION_GUIDE.md  # Detailed setup instructions
└── README.md                   # This file
```

---

## 🎨 Customization

### Show More Items

```html
<script>
new MaritimeJobWidget('maritime-jobs-widget', {
    showLocations: 10,   // Show top 10 locations
    showCompanies: 10    // Show top 10 companies
});
</script>
```

### Auto-Refresh Data

```html
<script>
new MaritimeJobWidget('maritime-jobs-widget', {
    refreshInterval: 300000  // Refresh every 5 minutes
});
</script>
```

### Custom Colors

Edit `maritime-widget.css`:
```css
.maritime-title { color: #YOUR-COLOR; }
.stat-primary { border-left: 5px solid #YOUR-COLOR; }
```

---

## 🔄 How It Works

```mermaid
graph LR
    A[Job Scrapers] --> B[Google Apps Script]
    B --> C[Python Analytics Pipeline]
    C --> D[MaritimeReport Sheet]
    D --> E[Website Widget]
    E --> F[Visitors See Live Data]
```

**Your Automated Pipeline:**
1. ✅ Apps Script merges ActiveJobs + SecondaryJobs (Mondays 1 AM)
2. ✅ Python processes analytics (report_generator.py)
3. ✅ Creates MaritimeReport sheet with structured data
4. ✅ Widget fetches fresh data on each page load

**Result:** Completely hands-off, always up-to-date! 🎯

---

## 📊 Data Source

**Google Sheet:** `1uZuWup1L7uwQjb-7SyKLw0zzJ30W9a4Kz9iIi8LISgY`  
**Sheet Name:** `MaritimeReport`  
**Update Schedule:** Every Monday at 1 AM (automated)  
**API Format:** CSV via Google Sheets API

The widget reads from your publicly accessible MaritimeReport sheet, which contains:
- Summary metrics (total jobs, bay area jobs)
- Location breakdowns with job counts
- Company breakdowns with job counts
- Last updated timestamp

---

## 🐛 Troubleshooting

### Widget not showing?
1. Check browser console (F12) for errors
2. Verify file paths are correct
3. Ensure div ID matches: `maritime-jobs-widget`

### Data not loading?
1. Test API URL directly in browser
2. Verify Google Sheet is publicly readable
3. Check if weekly pipeline ran successfully

### Styling issues?
1. Confirm CSS file loaded (check Network tab in browser)
2. Look for WordPress theme conflicts
3. Try adding `!important` to critical styles

📖 [Full Troubleshooting Guide →](WORDPRESS_INTEGRATION_GUIDE.md#-troubleshooting)

---

## 📱 Responsive Design

The widget automatically adapts to screen size:

- **Desktop** (>768px): Two-column grid layout
- **Tablet** (768px): Stacked columns with full-width cards
- **Mobile** (<480px): Vertical stack, optimized for small screens

---

## 🔐 Security

**Public Data:**
- ✅ MaritimeReport sheet (aggregated analytics only)
- ✅ Widget files (JavaScript and CSS)

**Private Data:**
- ✅ Google service account credentials (never exposed)
- ✅ ActiveJobs sheet (not accessible to widget)
- ✅ Raw job data (widget only sees summaries)

The widget has **read-only** access to summary analytics, not your raw job data.

---

## 🎯 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ IE11+ (with polyfills)

---

## 📈 Performance

**Load Time:** <2 seconds  
**File Size:** ~10KB total (5KB JS + 5KB CSS)  
**API Calls:** 1 per page load (+ optional auto-refresh)  
**Caching:** Browser caches files, data fetched fresh

**Optimization:**
- Minified for production
- Lazy loading of data
- Graceful error handling
- No external dependencies

---

## 🛠️ Technical Details

**Built With:**
- Vanilla JavaScript (ES6+)
- CSS3 with Flexbox/Grid
- Google Sheets API (CSV format)
- No external libraries or frameworks

**Features:**
- Async data fetching
- CSV parsing with quote handling
- Error boundary for API failures
- Auto-initialization via data attributes
- Customizable options object

---

## 📝 Integration Examples

### Standard WordPress Page
```html
<link rel="stylesheet" href="/wp-content/themes/your-theme/maritime-widget.css">
<div id="maritime-jobs-widget" data-maritime-widget></div>
<script src="/wp-content/themes/your-theme/maritime-widget.js"></script>
```

### Elementor Page Builder
Add HTML widget with:
```html
<link rel="stylesheet" href="YOUR-CSS-URL">
<div id="maritime-jobs-widget" data-maritime-widget></div>
<script src="YOUR-JS-URL"></script>
```

### Theme Functions (functions.php)
```php
function enqueue_maritime_widget() {
    wp_enqueue_style('maritime-widget', get_template_directory_uri() . '/maritime-widget.css');
    wp_enqueue_script('maritime-widget', get_template_directory_uri() . '/maritime-widget.js', array(), '1.0', true);
}
add_action('wp_enqueue_scripts', 'enqueue_maritime_widget');
```

Then add to page:
```html
<div id="maritime-jobs-widget" data-maritime-widget></div>
```

---

## 🎉 Demo

Open `index.html` in a browser to see the widget in action with:
- Live data from your Google Sheet
- Full styling and animations
- Responsive design across devices
- Complete integration examples

---

## 📞 Support

**Documentation:**
- [WordPress Integration Guide](WORDPRESS_INTEGRATION_GUIDE.md) - Detailed setup instructions
- [Demo Page](index.html) - Working example with integration code
- This README - Quick reference

**Need Help?**
- Check the troubleshooting section in the WordPress guide
- Review the demo page for working examples
- Test the API URL directly to verify data access

---

## 🚀 Deployment Checklist

Before going live:

- [ ] Files uploaded to correct location
- [ ] CSS and JS paths verified in integration code
- [ ] Widget appears on test page
- [ ] Data loads correctly
- [ ] Mobile view tested
- [ ] Desktop view tested
- [ ] Last updated timestamp displays
- [ ] Google Sheet is publicly accessible
- [ ] Weekly pipeline running successfully

---

## 📄 License

This widget is part of your Maritime Job Market Report System. Use it freely on your maritime career website.

---

## 🔮 Future Enhancements

Potential features for future versions:
- [ ] Job title search/filter
- [ ] Interactive charts (Chart.js integration)
- [ ] Historical trend visualization
- [ ] Salary range displays
- [ ] Email alerts for new high-value jobs
- [ ] Export data to PDF/CSV

---

**Built with ⚓ for the maritime industry**

*Last Updated: November 2025*
