const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }))
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      throw error
    }
  }

  // Gmail endpoints
  async getGmailStatus() {
    return this.request<{ success: boolean; authenticated: boolean }>('/gmail/status')
  }

  async getGmailAuthUrl() {
    return this.request<{ url: string }>('/gmail/auth-url')
  }

  async syncGmail() {
    return this.request<{ success: boolean; count: number }>('/gmail/sync', { method: 'POST' })
  }

  async disconnectGmail() {
    return this.request<{ success: boolean }>('/gmail/disconnect', { method: 'POST' })
  }

  // Email endpoints
  async getEmails(params?: { folder?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.folder) searchParams.set('folder', params.folder)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    
    const query = searchParams.toString()
    const response = await this.request<{ success: boolean; data: any[] }>(`/submissions${query ? `?${query}` : ''}`)
    // Transform the response to match expected format
    return { emails: response.data || [], total: (response.data || []).length }
  }

  async getEmail(id: number) {
    return this.request<any>(`/submissions/${id}`)
  }

  async sendEmail(data: { to: string; subject: string; body: string; replyTo?: string }) {
    return this.request<{ success: boolean }>('/gmail/send', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async markEmailRead(id: number) {
    return this.request<{ success: boolean }>(`/gmail/mark-read`, {
      method: 'POST',
      body: JSON.stringify({ id }),
    })
  }

  async archiveEmail(id: number) {
    return this.request<{ success: boolean }>(`/gmail/archive`, {
      method: 'POST',
      body: JSON.stringify({ id }),
    })
  }

  async starEmail(id: number, starred: boolean) {
    return this.request<{ success: boolean }>(`/submissions/${id}/star`, {
      method: 'POST',
      body: JSON.stringify({ starred }),
    })
  }

  // WhatsApp endpoints
  async getWhatsAppStatus() {
    return this.request<{ connected: boolean; status: string; hasQR: boolean }>('/whatsapp/status')
  }

  async connectWhatsApp() {
    return this.request<{ success: boolean; connected?: boolean; qr?: string; message?: string; error?: string }>('/whatsapp/connect', { method: 'POST' })
  }

  async getWhatsAppQR() {
    return this.request<{ success: boolean; qr?: string; connected?: boolean }>('/whatsapp/qr')
  }

  async disconnectWhatsApp() {
    return this.request<{ success: boolean }>('/whatsapp/disconnect', { method: 'POST' })
  }

  async getWhatsAppChats() {
    return this.request<{ chats: any[] }>('/whatsapp/chats')
  }

  async getWhatsAppMessages(chatId: string, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    
    const query = searchParams.toString()
    return this.request<{ messages: any[] }>(`/whatsapp/messages/${chatId}${query ? `?${query}` : ''}`)
  }

  async sendWhatsAppMessage(data: { chatId: string; message: string; mediaUrl?: string }) {
    return this.request<{ success: boolean; messageId: string }>('/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Patient endpoints
  async getPatients(params?: { page?: number; limit?: number; search?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)
    
    const query = searchParams.toString()
    return this.request<{ patients: any[]; total: number }>(`/patients${query ? `?${query}` : ''}`)
  }

  async getPatient(id: number) {
    return this.request<any>(`/patients/${id}`)
  }

  async createPatient(data: any) {
    return this.request<{ id: number }>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePatient(id: number, data: any) {
    return this.request<{ success: boolean }>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deletePatient(id: number) {
    return this.request<{ success: boolean }>(`/patients/${id}`, {
      method: 'DELETE',
    })
  }

  async getPatientCommunications(id: number) {
    return this.request<{ emails: any[]; whatsapp: any[] }>(`/patients/${id}/communications`)
  }

  // Campaign endpoints
  async getCampaigns() {
    return this.request<{ campaigns: any[] }>('/campaigns')
  }

  async getCampaign(id: number) {
    return this.request<any>(`/campaigns/${id}`)
  }

  async createCampaign(data: any) {
    return this.request<{ id: number }>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCampaign(id: number, data: any) {
    return this.request<{ success: boolean }>(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async sendCampaign(id: number) {
    return this.request<{ success: boolean }>(`/campaigns/${id}/send`, {
      method: 'POST',
    })
  }

  // Segment endpoints
  async getSegments() {
    return this.request<{ segments: any[] }>('/segments')
  }

  async createSegment(data: any) {
    return this.request<{ id: number }>('/segments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Automation endpoints
  async getAutomations() {
    return this.request<{ automations: any[] }>('/automations')
  }

  async createAutomation(data: any) {
    return this.request<{ id: number }>('/automations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async toggleAutomation(id: number, active: boolean) {
    return this.request<{ success: boolean }>(`/automations/${id}/${active ? 'activate' : 'deactivate'}`, {
      method: 'POST',
    })
  }

  // Analytics endpoints
  async getAnalyticsOverview(params?: { startDate?: string; endDate?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    
    const query = searchParams.toString()
    return this.request<any>(`/analytics/overview${query ? `?${query}` : ''}`)
  }

  async getSubmissionsStats() {
    return this.request<any>('/submissions/stats')
  }

  // AI endpoints
  async categorizeMessage(data: { message: string; subject?: string }) {
    return this.request<{ category: string; confidence: number }>('/ai/categorize', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getSuggestedReply(data: { message: string; context?: string }) {
    return this.request<{ reply: string }>('/ai/suggest-reply', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const api = new ApiClient(API_BASE)

