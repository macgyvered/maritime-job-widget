/**
 * Maritime Job Market Widget
 * Automatically displays live job market data from Google Sheets
 * Updates: Every Monday via automated pipeline
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
            // Your public Google Sheets API URL (CSV format)
            apiUrl: 'https://docs.google.com/spreadsheets/d/1uZuWup1L7uwQjb-7SyKLw0zzJ30W9a4Kz9iIi8LISgY/gviz/tq?tqx=out:csv&sheet=MaritimeReport',
            refreshInterval: 300000, // Refresh every 5 minutes (optional)
            showLocations: 5, // Show top 5 locations
            showJobTitles: 10, // Show top 10 job titles
            showCompanies: 5, // Show top 5 companies
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
        
        // Optional: Auto-refresh data periodically
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
            // Check if we have cached data from localStorage
            const cachedData = this.getCachedData();
            if (cachedData) {
                this.data = cachedData.data;
                this.lastUpdate = new Date(cachedData.timestamp);
                console.log('Maritime Widget: Using cached data');
                return true;
            }

            // Fetch fresh data if no cache or cache expired
            console.log('Maritime Widget: Fetching fresh data from Google Sheets');
            const response = await fetch(this.options.apiUrl);
            const csvText = await response.text();
            this.data = this.parseCSVData(csvText);
            this.lastUpdate = new Date();
            
            // Cache the data for 1 hour
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
            const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

            // Cache is valid for 1 hour
            if (cacheAge < oneHour) {
                return parsed;
            }
            
            // Cache expired
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
            // Continue without caching - not critical
        }
    }

    parseCSVData(csvText) {
        const lines = csvText.split('\n');
        const data = {
            summary: {},
            locations: [],
            jobTitles: [],
            companies: [],
            lastUpdated: null
        };

        // Parse the CSV data based on MaritimeReport structure
        let currentSection = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cells = this.parseCSVLine(line);
            
            // Identify sections by headers
            if (line.includes('MARITIME JOB MARKET SUMMARY')) {
                currentSection = 'summary';
                continue;
            } else if (line.includes('JOB DISTRIBUTION BY LOCATION')) {
                currentSection = 'locations';
                i++; // Skip header row
                continue;
            } else if (line.includes('TOP SKILLS')) {
                currentSection = 'skills';
                i++; // Skip header row
                continue;
            } else if (line.includes('HIRING COMPANIES')) {
                currentSection = 'companies';
                i++; // Skip header row
                continue;
            }

            // Parse data based on current section
            if (currentSection === 'summary' && cells.length >= 2) {
                const label = cells[0].toLowerCase();
                if (label.includes('total active jobs')) {
                    data.summary.totalJobs = parseInt(cells[1].replace(/,/g, '')) || 0;
                } else if (label.includes('bay area jobs')) {
                    data.summary.bayAreaJobs = parseInt(cells[1].replace(/,/g, '')) || 0;
                } else if (label.includes('last updated')) {
                    data.lastUpdated = cells[1];
                }
            } else if (currentSection === 'locations' && cells.length >= 2) {
                const location = cells[0];
                const count = parseInt(cells[1].replace(/,/g, '')) || 0;
                if (location && count > 0 && data.locations.length < this.options.showLocations) {
                    data.locations.push({ location, count });
                }
            } else if (currentSection === 'companies' && cells.length >= 2) {
                const company = cells[0];
                const count = parseInt(cells[1].replace(/,/g, '')) || 0;
                if (company && count > 0 && data.companies.length < this.options.showCompanies) {
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

        const { summary, locations, companies, lastUpdated } = this.data;

        this.container.innerHTML = `
            <div class="maritime-widget">
                <!-- Header -->
                <div class="maritime-header">
                    <h2 class="maritime-title">
                        <span class="anchor-icon">⚓</span>
                        Maritime Job Market Overview
                    </h2>
                    <p class="maritime-subtitle">Live data from maritime employers nationwide</p>
                </div>

                <!-- Summary Stats -->
                <div class="maritime-stats">
                    <div class="stat-card stat-primary">
                        <div class="stat-icon">💼</div>
                        <div class="stat-content">
                            <div class="stat-value">${this.formatNumber(summary.totalJobs)}</div>
                            <div class="stat-label">Active Maritime Jobs</div>
                        </div>
                    </div>
                    
                    <div class="stat-card stat-secondary">
                        <div class="stat-icon">📍</div>
                        <div class="stat-content">
                            <div class="stat-value">${this.formatNumber(summary.bayAreaJobs)}</div>
                            <div class="stat-label">Bay Area Opportunities</div>
                        </div>
                    </div>
                </div>

                <!-- Two Column Layout -->
                <div class="maritime-grid">
                    <!-- Top Locations -->
                    <div class="maritime-section">
                        <h3 class="section-title">
                            <span class="section-icon">🌊</span>
                            Top Hiring Locations
                        </h3>
                        <div class="location-list">
                            ${this.renderLocations(locations)}
                        </div>
                    </div>

                    <!-- Top Companies -->
                    <div class="maritime-section">
                        <h3 class="section-title">
                            <span class="section-icon">🚢</span>
                            Top Hiring Companies
                        </h3>
                        <div class="company-list">
                            ${this.renderCompanies(companies)}
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="maritime-footer">
                    <p class="update-time">Last updated: ${lastUpdated || 'Recently'}</p>
                    <p class="update-schedule">Data refreshes every Monday</p>
                </div>
            </div>
        `;
    }

    renderLocations(locations) {
        if (!locations || locations.length === 0) {
            return '<p class="no-data">No location data available</p>';
        }

        return locations.map((item, index) => `
            <div class="list-item">
                <span class="item-rank">${index + 1}</span>
                <span class="item-name">${this.escapeHtml(item.location)}</span>
                <span class="item-count">${this.formatNumber(item.count)} jobs</span>
            </div>
        `).join('');
    }

    renderCompanies(companies) {
        if (!companies || companies.length === 0) {
            return '<p class="no-data">No company data available</p>';
        }

        return companies.map((item, index) => `
            <div class="list-item">
                <span class="item-rank">${index + 1}</span>
                <span class="item-name">${this.escapeHtml(item.company)}</span>
                <span class="item-count">${this.formatNumber(item.count)} jobs</span>
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

// Auto-initialize if data-maritime-widget attribute is present
document.addEventListener('DOMContentLoaded', function() {
    const autoWidgets = document.querySelectorAll('[data-maritime-widget]');
    autoWidgets.forEach(element => {
        new MaritimeJobWidget(element.id);
    });
});
