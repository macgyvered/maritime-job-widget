/**
 * Maritime Job Market Widget v2.0
 * Modern glassmorphism design with comprehensive job market data
 * Auto-updates from Google Sheets every Monday
 */

class MaritimeJobWidget {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Maritime Widget: Container #${containerId} not found`);
            return;
        }

        // Configuration
        this.options = {
            apiUrl: 'https://docs.google.com/spreadsheets/d/1uZuWup1L7uwQjb-7SyKLw0zzJ30W9a4Kz9iIi8LISgY/gviz/tq?tqx=out:csv&sheet=MaritimeReport',
            refreshInterval: null, // Optional auto-refresh
            ...options
        };

        this.data = null;
        this.lastUpdate = null;
        
        this.init();
    }

    async init() {
        this.showLoading();
        await this.loadData();
        this.render();
        
        if (this.options.refreshInterval) {
            setInterval(() => this.loadData().then(() => this.render()), this.options.refreshInterval);
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

    async loadData() {
        try {
            const cachedData = this.getCachedData();
            if (cachedData) {
                this.data = cachedData.data;
                this.lastUpdate = new Date(cachedData.timestamp);
                console.log('Maritime Widget: Using cached data');
                return true;
            }

            console.log('Maritime Widget: Fetching fresh data from Google Sheets');
            const response = await fetch(this.options.apiUrl);
            const csvText = await response.text();
            this.data = this.parseCSVData(csvText);
            this.lastUpdate = new Date();
            
            this.cacheData(this.data);
            
            return true;
        } catch (error) {
            console.error('Maritime Widget: Failed to load data', error);
            this.showError();
            return false;
        }
    }

    getCachedData() {
        try {
            const cached = localStorage.getItem('maritime-widget-cache');
            if (!cached) return null;

            const parsed = JSON.parse(cached);
            const cacheAge = Date.now() - parsed.timestamp;
            const oneHour = 60 * 60 * 1000;

            if (cacheAge < oneHour) {
                return parsed;
            }
            
            localStorage.removeItem('maritime-widget-cache');
            return null;
        } catch (error) {
            console.error('Maritime Widget: Cache error', error);
            return null;
        }
    }

    cacheData(data) {
        try {
            const cacheObject = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem('maritime-widget-cache', JSON.stringify(cacheObject));
            console.log('Maritime Widget: Data cached for 1 hour');
        } catch (error) {
            console.error('Maritime Widget: Failed to cache data', error);
        }
    }

    parseCSVData(csvText) {
        const lines = csvText.split('\n');
        const data = {
            summary: {},
            jobTitles: [],
            companies: [],
            cities: []
        };

        let rowNumber = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            rowNumber = i + 1;
            
            if (!line) continue;

            const cells = this.parseCSVLine(line);
            
            // Row 3 = Total Active Jobs in column C
            if (rowNumber === 3 && cells.length >= 3) {
                const value = cells[2].replace(/,/g, '').replace(/"/g, '').trim();
                if (value && !isNaN(value)) {
                    data.summary.totalJobs = parseInt(value) || 0;
                }
            }
            
            // Row 10 = California jobs in column B
            if (rowNumber === 10 && cells.length >= 2) {
                const value = cells[1].replace(/,/g, '').replace(/"/g, '').trim();
                if (value && !isNaN(value)) {
                    data.summary.californiaJobs = parseInt(value) || 0;
                }
            }
            
            // Rows 18-27 = California cities (top 10)
            if (rowNumber >= 18 && rowNumber <= 27 && cells.length >= 2) {
                const city = cells[0].replace(/"/g, '').trim();
                const count = parseInt(cells[1].replace(/,/g, '').replace(/"/g, '')) || 0;
                
                if (city && city !== '' && city !== 'City' && count > 0) {
                    data.cities.push({ city, count });
                }
            }
            
            // Rows 53-62 = Job titles with pay ranges
            if (rowNumber >= 53 && rowNumber <= 62 && cells.length >= 2) {
                const jobTitle = cells[0].replace(/"/g, '').trim();
                const openings = parseInt(cells[1].replace(/,/g, '').replace(/"/g, '')) || 0;
                const payRange = cells.length >= 3 ? cells[2].replace(/"/g, '').trim() : '';
                
                if (jobTitle && jobTitle !== '' && jobTitle !== 'Job Title') {
                    data.jobTitles.push({ 
                        title: jobTitle, 
                        openings: openings,
                        payRange: payRange
                    });
                }
            }
            
            // Rows 67-76 = Top 10 companies
            if (rowNumber >= 67 && rowNumber <= 76 && cells.length >= 2) {
                const company = cells[0].replace(/"/g, '').trim();
                const count = parseInt(cells[1].replace(/,/g, '').replace(/"/g, '')) || 0;
                
                if (company && company !== '' && company !== 'Company Name' && count > 0) {
                    data.companies.push({ company, count });
                }
            }
        }

        return data;
    }

    parseCSVLine(line) {
        const cells = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                cells.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        cells.push(current.trim());
        return cells;
    }

    showError() {
        this.container.innerHTML = `
            <div class="maritime-widget-error">
                <p>Unable to load job market data. Please try again later.</p>
            </div>
        `;
    }

    render() {
        if (!this.data) {
            this.showError();
            return;
        }

        const { summary, jobTitles, companies, cities } = this.data;

        this.container.innerHTML = `
            <div class="maritime-widget">
                <!-- Header -->
                <div class="maritime-header">
                    <h2 class="maritime-title">
                        <span class="anchor-icon">⚓</span>
                        Current Bay Area Maritime Job Market
                    </h2>
                </div>

                <!-- Summary Stats -->
                <div class="maritime-stats">
                    <div class="stat-card">
                        <div class="stat-icon">💼</div>
                        <div class="stat-content">
                            <div class="stat-value">${this.formatNumber(summary.totalJobs)}</div>
                            <div class="stat-label">Active Maritime Jobs</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">📍</div>
                        <div class="stat-content">
                            <div class="stat-value">${this.formatNumber(summary.californiaJobs)}</div>
                            <div class="stat-label">Open Opportunities in California</div>
                        </div>
                    </div>
                </div>

                <!-- Three Column Grid -->
                <div class="maritime-grid-three">
                    <!-- Column 1: Job Titles -->
                    <div class="maritime-section">
                        <h3 class="section-title">
                            💼 Jobs in Highest Demand
                        </h3>
                        <div class="data-list">
                            ${this.renderJobTitlesWithPay(jobTitles)}
                        </div>
                    </div>

                    <!-- Column 2: Companies -->
                    <div class="maritime-section">
                        <h3 class="section-title">
                            🏢 Top Hiring Companies
                        </h3>
                        <div class="data-list">
                            ${this.renderCompanies(companies)}
                        </div>
                    </div>

                    <!-- Column 3: Cities -->
                    <div class="maritime-section">
                        <h3 class="section-title">
                            📍 Top California Locations
                        </h3>
                        <div class="data-list">
                            ${this.renderCities(cities)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderJobTitlesWithPay(jobTitles) {
        if (!jobTitles || jobTitles.length === 0) {
            return '<p class="no-data">No job data available</p>';
        }

        return jobTitles.map((job, index) => {
            const hasPay = job.payRange && job.payRange !== '' && job.payRange !== 'Not Specified';
            
            if (hasPay) {
                return `
                    <div class="list-item">
                        <div class="item-number">${index + 1}</div>
                        <div class="item-content">
                            <div class="item-title">${this.escapeHtml(job.title)} • ${job.payRange} • ${job.openings} Openings</div>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="list-item">
                        <div class="item-number">${index + 1}</div>
                        <div class="item-content">
                            <div class="item-title">${this.escapeHtml(job.title)} • ${job.openings} Openings</div>
                        </div>
                    </div>
                `;
            }
        }).join('');
    }

    renderCompanies(companies) {
        if (!companies || companies.length === 0) {
            return '<p class="no-data">No company data available</p>';
        }

        return companies.map((item, index) => `
            <div class="list-item">
                <div class="item-number">${index + 1}</div>
                <div class="item-content">
                    <div class="item-title">${this.escapeHtml(item.company)} • ${this.formatNumber(item.count)} jobs</div>
                </div>
            </div>
        `).join('');
    }

    renderCities(cities) {
        if (!cities || cities.length === 0) {
            return '<p class="no-data">No city data available</p>';
        }

        return cities.map((item, index) => `
            <div class="list-item">
                <div class="item-number">${index + 1}</div>
                <div class="item-content">
                    <div class="item-title">${this.escapeHtml(item.city)} • ${this.formatNumber(item.count)} jobs</div>
                </div>
            </div>
        `).join('');
    }

    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', function() {
    const autoWidgets = document.querySelectorAll('[data-maritime-widget]');
    autoWidgets.forEach(element => {
        new MaritimeJobWidget(element.id);
    });
});
