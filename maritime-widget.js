/**
 * Maritime Job Market Widget v2.0
 * Displays live job market data from Google Sheets
 * Enhanced with robust CSV parsing and error handling
 */

class MaritimeJobWidget {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container element '${containerId}' not found`);
            return;
        }
        
        // Configuration
        this.options = {
            sheetId: options.sheetId || '1uZuWup1L7uwQjb-7SyKLw0zzJ30W9a4Kz9iIi8LISgY',
            sheetName: options.sheetName || 'MaritimeReport',
            refreshInterval: options.refreshInterval || 3600000, // 1 hour default
            showTopN: options.showTopN || 10,
            debug: options.debug || false,
            ...options
        };
        
        // Build API URL
        this.apiUrl = `https://docs.google.com/spreadsheets/d/${this.options.sheetId}/gviz/tq?tqx=out:csv&sheet=${this.options.sheetName}`;
        
        // Data cache
        this.data = null;
        this.lastUpdate = null;
        
        // Auto-initialize
        this.init();
    }
    
    init() {
        this.log('Initializing Maritime Job Widget...');
        this.showLoading();
        this.loadData();
        
        // Set up auto-refresh
        if (this.options.refreshInterval > 0) {
            setInterval(() => this.loadData(), this.options.refreshInterval);
        }
    }
    
    log(message, data = null) {
        if (this.options.debug) {
            console.log(`[MaritimeWidget] ${message}`, data || '');
        }
    }
    
    showLoading() {
        this.container.innerHTML = `
            <div class="maritime-widget-loading">
                <div class="loading-spinner"></div>
                <p>Loading maritime job market data...</p>
            </div>
        `;
    }
    
    showError(message) {
        this.container.innerHTML = `
            <div class="maritime-widget-error">
                <p>⚠️ ${message}</p>
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
    }
    
    async loadData() {
        try {
            this.log('Fetching data from Google Sheets...');
            
            const response = await fetch(this.apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvText = await response.text();
            this.log('CSV data received', csvText.substring(0, 200));
            
            // Parse the CSV data
            this.data = this.parseCSV(csvText);
            this.lastUpdate = new Date();
            
            this.log('Data parsed successfully', this.data);
            
            // Render the widget
            this.render();
            
        } catch (error) {
            console.error('Error loading widget data:', error);
            this.showError('Unable to load job market data. Please try again later.');
        }
    }
    
    parseCSV(csvText) {
        /**
         * Robust CSV parser that handles the MaritimeReport structure:
         * - Section 1: Summary (lines 1-5)
         * - Section 2: Jobs by State (lines 7-13)
         * - Section 3: California Cities (lines 15-48)
         * - Section 4: Top 10 Job Titles (lines 50-62)
         * - Section 5: Top 10 Hiring Companies (lines 64-76)
         */
        
        const lines = csvText.split('\n').map(line => {
            // Parse CSV line handling quoted values
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            
            return result;
        });
        
        this.log('Parsed CSV lines', lines.length);
        
        // Initialize data structure
        const data = {
            summary: {},
            jobsByState: {},
            californiaJobs: {},
            caCities: [],
            topJobTitles: [],
            topCompanies: []
        };
        
        // Parse SUMMARY section (lines 3-5, 0-indexed: 2-4)
        if (lines.length > 4) {
            data.summary.totalJobs = parseInt(lines[2][1]) || 0;
            data.summary.weeklyChange = parseInt(lines[3][1]) || 0;
            data.summary.lastUpdated = lines[4][1] || 'Unknown';
            
            this.log('Summary parsed:', data.summary);
        }
        
        // Parse JOBS BY STATE section (lines 10-13, 0-indexed: 9-12)
        if (lines.length > 13) {
            data.jobsByState.california = parseInt(lines[9][1]) || 0;
            data.jobsByState.washington = parseInt(lines[10][1]) || 0;
            data.jobsByState.oregon = parseInt(lines[11][1]) || 0;
            data.jobsByState.otherStates = parseInt(lines[12][1]) || 0;
            
            // Calculate California jobs for summary
            data.californiaJobs.total = data.jobsByState.california;
            
            this.log('Jobs by state parsed:', data.jobsByState);
        }
        
        // Parse CALIFORNIA JOBS BY CITY section (starts at line 18, 0-indexed: 17)
        let cityStartIndex = 17;
        let cityEndIndex = cityStartIndex;
        
        // Find where California cities section ends (look for empty line)
        for (let i = cityStartIndex; i < lines.length; i++) {
            if (!lines[i][0] || lines[i][0].trim() === '') {
                cityEndIndex = i;
                break;
            }
            
            const city = lines[i][0];
            const count = parseInt(lines[i][1]) || 0;
            
            if (city && city !== 'City' && count > 0) {
                data.caCities.push({ city, count });
            }
        }
        
        this.log(`California cities parsed: ${data.caCities.length} cities`);
        
        // Parse TOP 10 JOB TITLES section (starts at line 53, 0-indexed: 52)
        // Skip header line and read next 10 jobs
        let jobTitleStartIndex = 52;
        
        for (let i = jobTitleStartIndex; i < jobTitleStartIndex + 10 && i < lines.length; i++) {
            const title = lines[i][0];
            const count = parseInt(lines[i][1]) || 0;
            const payRange = lines[i][2] || 'Not Specified';
            
            if (title && title !== 'Job Title' && title.trim() !== '') {
                data.topJobTitles.push({ 
                    title, 
                    count, 
                    payRange 
                });
            }
        }
        
        this.log(`Job titles parsed: ${data.topJobTitles.length} titles`);
        
        // Parse TOP 10 HIRING COMPANIES section (starts at line 67, 0-indexed: 66)
        // Skip header line and read next 10 companies
        let companyStartIndex = 66;
        
        for (let i = companyStartIndex; i < companyStartIndex + 10 && i < lines.length; i++) {
            const company = lines[i][0];
            const count = parseInt(lines[i][1]) || 0;
            
            if (company && company !== 'Company Name' && company.trim() !== '') {
                data.topCompanies.push({ 
                    company, 
                    count 
                });
            }
        }
        
        this.log(`Companies parsed: ${data.topCompanies.length} companies`);
        
        return data;
    }
    
    render() {
        if (!this.data) {
            this.showError('No data available to display');
            return;
        }
        
        const { summary, californiaJobs, topJobTitles, topCompanies, caCities } = this.data;
        
        // Build the widget HTML
        const html = `
            <div class="maritime-widget">
                <!-- Header -->
                <div class="maritime-header">
                    <span class="maritime-icon">⚓</span>
                    <h2>Current Bay Area Maritime Job Market</h2>
                </div>
                
                <!-- Summary Cards -->
                <div class="maritime-summary">
                    <div class="summary-card">
                        <div class="card-icon">💼</div>
                        <div class="card-content">
                            <div class="card-number">${summary.totalJobs.toLocaleString()}</div>
                            <div class="card-label">Active Maritime Jobs</div>
                        </div>
                    </div>
                    
                    <div class="summary-card">
                        <div class="card-icon">📍</div>
                        <div class="card-content">
                            <div class="card-number">${californiaJobs.total}</div>
                            <div class="card-label">Open Opportunities in California</div>
                        </div>
                    </div>
                </div>
                
                <!-- Three Column Layout -->
                <div class="maritime-columns">
                    <!-- Jobs in Highest Demand -->
                    <div class="maritime-column">
                        <h3><span class="column-icon">📦</span> Jobs in Highest Demand</h3>
                        <div class="item-list">
                            ${this.renderJobTitles(topJobTitles)}
                        </div>
                    </div>
                    
                    <!-- Top Hiring Companies -->
                    <div class="maritime-column">
                        <h3><span class="column-icon">🏢</span> Top Hiring Companies</h3>
                        <div class="item-list">
                            ${this.renderCompanies(topCompanies)}
                        </div>
                    </div>
                    
                    <!-- Top California Locations -->
                    <div class="maritime-column">
                        <h3><span class="column-icon">📍</span> Top California Locations</h3>
                        <div class="item-list">
                            ${this.renderLocations(caCities.slice(0, 10))}
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="maritime-footer">
                    <p>Last Updated: ${summary.lastUpdated}</p>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        this.log('Widget rendered successfully');
    }
    
    renderJobTitles(jobs) {
        return jobs.map((job, index) => `
            <div class="item-row">
                <div class="item-number">${index + 1}</div>
                <div class="item-name">${this.escapeHtml(job.title)}</div>
                <div class="item-badge">${job.count} Opening${job.count !== 1 ? 's' : ''}</div>
            </div>
        `).join('');
    }
    
    renderCompanies(companies) {
        return companies.map((company, index) => `
            <div class="item-row">
                <div class="item-number">${index + 1}</div>
                <div class="item-name">${this.escapeHtml(company.company)}</div>
                <div class="item-badge">${company.count} Opening${company.count !== 1 ? 's' : ''}</div>
            </div>
        `).join('');
    }
    
    renderLocations(cities) {
        return cities.map((city, index) => `
            <div class="item-row">
                <div class="item-number">${index + 1}</div>
                <div class="item-name">${this.escapeHtml(city.city)}</div>
                <div class="item-badge">${city.count} Job${city.count !== 1 ? 's' : ''}</div>
            </div>
        `).join('');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Auto-initialize if data-auto-init attribute is present
document.addEventListener('DOMContentLoaded', function() {
    const autoInitElements = document.querySelectorAll('[data-maritime-widget]');
    
    autoInitElements.forEach(element => {
        const sheetId = element.getAttribute('data-sheet-id');
        const options = sheetId ? { sheetId } : {};
        
        new MaritimeJobWidget(element.id, options);
    });
});
