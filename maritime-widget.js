/**
 * Maritime Job Market Widget
 * Displays live maritime job market data from Google Sheets
 * Auto-updates: Every Monday at 2:30 AM EST
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
            // Public Google Sheets CSV export URL
            apiUrl: 'https://docs.google.com/spreadsheets/d/1uZuWup1L7uwQjb-7SyKLw0zzJ30W9a4Kz9iIi8LISgY/gviz/tq?tqx=out:csv&sheet=MaritimeReport_Data',
            refreshInterval: 3600000, // Refresh every hour
            showTopItems: 10, // Show top 10 items for each category
            ...options
        };

        this.data = null;
        this.init();
    }

    async init() {
        this.showLoading();
        await this.loadData();
        this.render();
        
        // Auto-refresh periodically
        if (this.options.refreshInterval) {
            setInterval(() => {
                this.loadData().then(() => this.render());
            }, this.options.refreshInterval);
        }
    }

    showLoading() {
        this.container.innerHTML = `
            <div class="maritime-widget">
                <div class="widget-loading">
                    <div class="loading-spinner"></div>
                    <p>Loading maritime job data...</p>
                </div>
            </div>
        `;
    }

    async loadData() {
        try {
            // Check cache first (1 hour)
            const cached = this.getCachedData();
            if (cached) {
                this.data = cached;
                console.log('Maritime Widget: Using cached data');
                return true;
            }

            // Fetch fresh data
            console.log('Maritime Widget: Fetching data from Google Sheets');
            const response = await fetch(this.options.apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvText = await response.text();
            this.data = this.parseCSVData(csvText);
            
            // Cache the data
            this.cacheData(this.data);
            
            return true;
        } catch (error) {
            console.error('Maritime Widget: Failed to load data', error);
            this.showError(error.message);
            return false;
        }
    }

    parseCSVData(csvText) {
        const lines = csvText.trim().split('\n');
        const data = {
            totalJobs: 0,
            californiaJobs: 0,
            lastUpdated: '',
            topCities: [],
            topJobs: [],
            topCompanies: []
        };

        let currentSection = null;

        for (let i = 0; i < lines.length; i++) {
            const cells = this.parseCSVLine(lines[i]);
            
            // Skip empty lines
            if (cells.length === 0 || cells.every(cell => !cell)) {
                continue;
            }

            const section = cells[0];
            const metric = cells[1];
            const value = cells[2];

            // Parse Summary section
            if (section === 'Summary') {
                if (metric === 'Total Active Job Openings') {
                    data.totalJobs = parseInt(value) || 0;
                } else if (metric === 'Job Openings in California') {
                    data.californiaJobs = parseInt(value) || 0;
                } else if (metric === 'Last Updated') {
                    data.lastUpdated = value;
                }
            }
            
            // Identify section headers
            else if (section === 'Section') {
                if (metric === 'City') {
                    currentSection = 'cities';
                } else if (metric === 'Job Title') {
                    currentSection = 'jobs';
                } else if (metric === 'Company Name') {
                    currentSection = 'companies';
                }
                continue;
            }
            
            // Parse data rows based on current section
            else if (currentSection === 'cities' && section === 'CA Cities') {
                if (data.topCities.length < this.options.showTopItems) {
                    data.topCities.push({
                        name: metric,
                        count: parseInt(value) || 0
                    });
                }
            }
            else if (currentSection === 'jobs' && section === 'Top Jobs') {
                if (data.topJobs.length < this.options.showTopItems) {
                    data.topJobs.push({
                        title: metric,
                        count: parseInt(value) || 0,
                        payRange: cells[3] || ''
                    });
                }
            }
            else if (currentSection === 'companies' && section === 'Top Companies') {
                if (data.topCompanies.length < this.options.showTopItems) {
                    data.topCompanies.push({
                        name: metric,
                        count: parseInt(value) || 0
                    });
                }
            }
        }

        console.log('Maritime Widget: Parsed data', data);
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

    getCachedData() {
        try {
            const cached = localStorage.getItem('maritime-widget-data');
            if (!cached) return null;

            const parsed = JSON.parse(cached);
            const cacheAge = Date.now() - parsed.timestamp;
            const oneHour = 60 * 60 * 1000;

            if (cacheAge < oneHour) {
                return parsed.data;
            }
            
            localStorage.removeItem('maritime-widget-data');
            return null;
        } catch (error) {
            return null;
        }
    }

    cacheData(data) {
        try {
            const cacheObject = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem('maritime-widget-data', JSON.stringify(cacheObject));
        } catch (error) {
            console.warn('Maritime Widget: Failed to cache data', error);
        }
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="maritime-widget">
                <div class="widget-error">
                    <p><strong>Unable to load job data</strong></p>
                    <p class="error-detail">${message || 'Please try again later'}</p>
                </div>
            </div>
        `;
    }

    render() {
        if (!this.data) {
            this.showError('No data available');
            return;
        }

        const { totalJobs, californiaJobs, lastUpdated, topCities, topJobs, topCompanies } = this.data;

        this.container.innerHTML = `
            <div class="maritime-widget">
                <div class="widget-header">
                    <h2 class="widget-title">Maritime Job Market Overview</h2>
                </div>

                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${this.formatNumber(totalJobs)}</div>
                        <div class="stat-label">Total Active Job Openings</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.formatNumber(californiaJobs)}</div>
                        <div class="stat-label">Job Openings in California</div>
                    </div>
                </div>

                <div class="content-grid">
                    <div class="content-card">
                        <h3 class="card-title">Jobs in Highest Demand</h3>
                        <div class="item-list">
                            ${this.renderJobsList(topJobs)}
                        </div>
                    </div>

                    <div class="content-card">
                        <h3 class="card-title">Top Hiring California Cities</h3>
                        <div class="item-list">
                            ${this.renderCitiesList(topCities)}
                        </div>
                    </div>

                    <div class="content-card">
                        <h3 class="card-title">Top Hiring Companies</h3>
                        <div class="item-list">
                            ${this.renderCompaniesList(topCompanies)}
                        </div>
                    </div>
                </div>

                <div class="widget-footer">
                    <p>Last updated: ${lastUpdated || 'Recently'} • Updates every Monday at 2:30 AM EST</p>
                </div>
            </div>
        `;
    }

    renderJobsList(jobs) {
        if (!jobs || jobs.length === 0) {
            return '<p class="no-data">No data available</p>';
        }

        return jobs.map(job => `
            <div class="list-item">
                <div class="item-info">
                    <span class="item-name">${this.escapeHtml(job.title)}</span>
                    ${job.payRange ? `<span class="item-detail">${this.escapeHtml(job.payRange)}</span>` : ''}
                </div>
                <span class="item-count">${job.count}</span>
            </div>
        `).join('');
    }

    renderCitiesList(cities) {
        if (!cities || cities.length === 0) {
            return '<p class="no-data">No data available</p>';
        }

        return cities.map(city => `
            <div class="list-item">
                <span class="item-name">${this.escapeHtml(city.name)}</span>
                <span class="item-count">${city.count}</span>
            </div>
        `).join('');
    }

    renderCompaniesList(companies) {
        if (!companies || companies.length === 0) {
            return '<p class="no-data">No data available</p>';
        }

        return companies.map(company => `
            <div class="list-item">
                <span class="item-name">${this.escapeHtml(company.name)}</span>
                <span class="item-count">${company.count}</span>
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

// Auto-initialize widgets with data-maritime-widget attribute
document.addEventListener('DOMContentLoaded', function() {
    const widgets = document.querySelectorAll('[data-maritime-widget]');
    widgets.forEach(element => {
        new MaritimeJobWidget(element.id);
    });
});
