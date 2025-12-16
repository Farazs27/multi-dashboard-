import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { 
  Mail, 
  MessageCircle, 
  Users, 
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Activity,
  Download,
  RefreshCw,
  Eye,
  MousePointer,
  Clock,
  Zap
} from 'lucide-react'
import { api } from '../../lib/api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

// Mock data
const emailPerformance = [
  { name: 'Mon', sent: 45, opened: 32, clicked: 12 },
  { name: 'Tue', sent: 52, opened: 38, clicked: 15 },
  { name: 'Wed', sent: 48, opened: 35, clicked: 18 },
  { name: 'Thu', sent: 61, opened: 45, clicked: 22 },
  { name: 'Fri', sent: 55, opened: 42, clicked: 19 },
  { name: 'Sat', sent: 32, opened: 24, clicked: 8 },
  { name: 'Sun', sent: 28, opened: 20, clicked: 6 },
]

const channelData = [
  { name: 'Email', value: 450, color: '#3b82f6' },
  { name: 'WhatsApp', value: 320, color: '#25d366' },
  { name: 'SMS', value: 85, color: '#8b5cf6' },
]

const trendData = [
  { month: 'Jul', emails: 320, whatsapp: 180, appointments: 45 },
  { month: 'Aug', emails: 380, whatsapp: 220, appointments: 52 },
  { month: 'Sep', emails: 420, whatsapp: 280, appointments: 58 },
  { month: 'Oct', emails: 480, whatsapp: 320, appointments: 65 },
  { month: 'Nov', emails: 520, whatsapp: 380, appointments: 72 },
  { month: 'Dec', emails: 580, whatsapp: 420, appointments: 78 },
]

const topCampaigns = [
  { name: 'Holiday Greetings', channel: 'email', sent: 450, opened: 312, clicked: 89, rate: 69.3 },
  { name: 'Appointment Reminders', channel: 'whatsapp', sent: 280, opened: 265, clicked: 0, rate: 94.6 },
  { name: 'Invisalign Promo', channel: 'email', sent: 180, opened: 98, clicked: 34, rate: 54.4 },
  { name: 'Recall Notices', channel: 'multi', sent: 320, opened: 245, clicked: 67, rate: 76.6 },
]

const categoryBreakdown = [
  { name: 'Appointments', count: 145, percentage: 35 },
  { name: 'Questions', count: 89, percentage: 21 },
  { name: 'Follow-ups', count: 67, percentage: 16 },
  { name: 'New Patients', count: 54, percentage: 13 },
  { name: 'Billing', count: 38, percentage: 9 },
  { name: 'Other', count: 25, percentage: 6 },
]

export default function AnalyticsView() {
  const [dateRange, setDateRange] = useState('7d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeMetric, setActiveMetric] = useState<'emails' | 'whatsapp' | 'appointments'>('emails')

  // Fetch stats from API
  const { data: stats, refetch } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: () => api.getSubmissionsStats(),
  })

  // Fetch emails for real data
  const { data: emailsData } = useQuery({
    queryKey: ['emails-analytics'],
    queryFn: () => api.getEmails(),
  })

  const emails = Array.isArray(emailsData) ? emailsData : (emailsData?.emails || emailsData?.data || [])
  const totalEmails = emails.length
  const unreadEmails = emails.filter((e: any) => e.read_status === 0 || !e.read_status).length
  const starredEmails = emails.filter((e: any) => e.starred === 1).length

  // Calculate category distribution from real data
  const categoryDistribution = emails.reduce((acc: any, email: any) => {
    const cat = email.category || 'Uncategorized'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  const realCategoryBreakdown = Object.entries(categoryDistribution)
    .map(([name, count]) => ({
      name,
      count: count as number,
      percentage: Math.round(((count as number) / totalEmails) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleExport = () => {
    // Create CSV export
    const headers = ['Metric', 'Value']
    const data = [
      ['Total Emails', totalEmails],
      ['Unread Emails', unreadEmails],
      ['Starred Emails', starredEmails],
      ...realCategoryBreakdown.map(c => [c.name, c.count])
    ]
    
    const csv = [headers, ...data].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 custom-scrollbar">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Track your communication performance</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="12m">Last 12 months</option>
            </select>
            
            <button
              onClick={handleRefresh}
              className="btn btn-secondary"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button onClick={handleExport} className="btn btn-primary">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Emails"
            value={totalEmails}
            change={12.5}
            icon={<Mail className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Unread"
            value={unreadEmails}
            change={-5.2}
            icon={<Eye className="w-5 h-5" />}
            color="amber"
          />
          <StatCard
            title="Starred"
            value={starredEmails}
            change={8.1}
            icon={<Activity className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            title="Categories"
            value={Object.keys(categoryDistribution).length}
            change={2.3}
            icon={<Zap className="w-5 h-5" />}
            color="green"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Email Performance */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Email Performance</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={emailPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Legend />
                <Bar dataKey="sent" fill="#3b82f6" name="Sent" radius={[4, 4, 0, 0]} />
                <Bar dataKey="opened" fill="#10b981" name="Opened" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicked" fill="#f59e0b" name="Clicked" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Channel Distribution */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Channel Distribution</h3>
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={280}>
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="flex-1 space-y-4">
                {channelData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{item.value}</span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({Math.round((item.value / channelData.reduce((a, b) => a + b.value, 0)) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Trend Chart */}
          <div className="card p-6 col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4">Communication Trends</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWhatsapp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25d366" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#25d366" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="emails" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorEmails)" 
                  name="Emails"
                />
                <Area 
                  type="monotone" 
                  dataKey="whatsapp" 
                  stroke="#25d366" 
                  fillOpacity={1} 
                  fill="url(#colorWhatsapp)" 
                  name="WhatsApp"
                />
                <Line 
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b' }}
                  name="Appointments"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* AI Categories - Real Data */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">AI Categories (Live)</h3>
            <div className="space-y-3">
              {realCategoryBreakdown.length > 0 ? realCategoryBreakdown.map((cat, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{cat.name}</span>
                    <span className="text-sm font-medium text-gray-900">{cat.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${cat.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500 text-center py-4">No category data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Campaigns Table */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top Campaigns</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Campaign</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Channel</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Sent</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Opened</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Clicked</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Open Rate</th>
              </tr>
            </thead>
            <tbody>
              {topCampaigns.map((campaign, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{campaign.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      campaign.channel === 'email' ? 'bg-blue-100 text-blue-700' :
                      campaign.channel === 'whatsapp' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {campaign.channel === 'email' && <Mail className="w-3 h-3" />}
                      {campaign.channel === 'whatsapp' && <MessageCircle className="w-3 h-3" />}
                      {campaign.channel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">{campaign.sent}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{campaign.opened}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{campaign.clicked}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-medium ${
                      campaign.rate >= 70 ? 'text-green-600' :
                      campaign.rate >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {campaign.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  change, 
  icon, 
  color 
}: { 
  title: string
  value: string | number
  change: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'amber'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm ${
          change >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {change >= 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  )
}

