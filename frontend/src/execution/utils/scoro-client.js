/**
 * Scoro API Unified Client for ANIMA (Corrected for V2 POST standard).
 */

const axios = require('axios');

class ScoroClient {
  constructor(credentials) {
    const { apiKey, companyId, baseUrl } = credentials;
    this.apiKey = apiKey;
    this.companyId = companyId;
    this.baseUrl = baseUrl ? (baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`) : 'https://proweb.scoro.com/api/v2/';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Helper to structure the Scoro V2 Request
   */
  async _post(module, requestData = {}) {
    try {
      const payload = {
        apiKey: this.apiKey,
        company_account_id: this.companyId,
        lang: 'eng',
        request: requestData
      };
      
      const response = await this.client.post(module, payload);
      
      // Scoro V2 returns { status: "OK", data: [...], ... }
      if (response.data.status !== 'OK') {
        throw new Error(response.data.messages?.join(', ') || 'Scoro API Error');
      }
      
      return response.data.data || [];
    } catch (err) {
      console.warn(`[SCORO-CLIENT] Error in ${module}:`, err.message);
      return [];
    }
  }

  /**
   * Projects
   */
  async listProjects(limit = 20) {
    return await this._post('projects/list', { limit });
  }

  async getProject(projectId) {
    const data = await this._post('projects/view', { id: projectId });
    return Array.isArray(data) ? data[0] : data;
  }

  /**
   * Tasks
   */
  async getTasks(projectId, limit = 50) {
    const request = { limit };
    if (projectId) request.filter = { project_id: projectId };
    return await this._post('tasks/list', request);
  }

  /**
   * Finance: Invoices
   */
  async getInvoices(limit = 10, filter = {}, sort = {}) {
    const request = { limit };
    if (filter && Object.keys(filter).length > 0) request.filter = filter;
    if (sort && Object.keys(sort).length > 0) request.sort = sort;
    return await this._post('invoices/list', request);
  }

  /**
   * Finance: Orders (Sales)
   */
  async getOrders(limit = 10, filter = {}, sort = {}) {
    const request = { limit };
    if (filter && Object.keys(filter).length > 0) request.filter = filter;
    if (sort && Object.keys(sort).length > 0) request.sort = sort;
    return await this._post('orders/list', request);
  }

  /**
   * Timesheets / Time Entries
   */
  async getTimeEntries(projectId, limit = 20) {
    const request = { limit };
    if (projectId) request.filter = { project_id: projectId };
    return await this._post('time_entries/list', request);
  }
}

module.exports = ScoroClient;
