# Mondzorg Sloterweg Dashboard

A comprehensive CRM dashboard for Mondzorg Sloterweg dental practice. This repository contains two versions of the dashboard:

## 📁 Repository Structure

```
mondzorg-dashboard/
├── v1/                    # Original HTML/JS Dashboard
│   ├── dashboard.html     # Main analytics dashboard
│   ├── dashboard-inbox.html # Email inbox interface
│   ├── js/
│   │   ├── dashboard.js
│   │   ├── dashboard-gmail.js
│   │   └── dashboard-inbox.js
│   ├── server.js          # Express backend server
│   ├── gmail-service.js   # Gmail API integration
│   └── gemini-service.js  # AI categorization service
│
├── v2/                    # Modern React Dashboard (CRM)
│   ├── src/
│   │   ├── components/
│   │   │   ├── inbox/     # Unified inbox (Email + WhatsApp)
│   │   │   ├── patients/  # Patient management
│   │   │   ├── campaigns/ # Marketing campaigns
│   │   │   ├── automation/# Workflow automation
│   │   │   ├── analytics/ # Analytics & reporting
│   │   │   └── settings/  # Settings management
│   │   ├── store/         # Zustand state management
│   │   └── types/         # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## 🚀 Version 1 (v1) - Classic Dashboard

A lightweight HTML/JavaScript dashboard with:

- **Email Integration**: Gmail API for inbox management
- **AI Categorization**: Gemini AI for automatic email classification
- **Analytics**: Chart.js visualizations
- **Dark Mode**: Theme toggle support

### Running v1

```bash
cd v1
npm install
node server.js
```

Open `http://localhost:4000/dashboard.html`

## ⚡ Version 2 (v2) - Modern CRM Dashboard

A full-featured React CRM built with:

- **React 18** + TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Socket.io** for real-time updates

### Features

- 📧 **Unified Inbox**: Email + WhatsApp in one view
- 👥 **Patient Management**: Full CRM capabilities
- 📊 **Analytics**: Advanced reporting dashboard
- 📢 **Campaigns**: Email/SMS marketing tools
- 🤖 **Automation**: Workflow builder with drag-and-drop
- ⚙️ **Settings**: Practice configuration

### Running v2

```bash
cd v2
npm install
npm run dev
```

Open `http://localhost:5173`

### Building for Production

```bash
cd v2
npm run build
```

## 🔧 Environment Setup

### Gmail API (Required for v1)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable Gmail API
3. Create OAuth 2.0 credentials
4. Download as `gmail-credentials.json`
5. Place in `v1/` directory

### Backend API (Required for v2)

v2 expects a backend API running at `http://localhost:4000`. You can use the v1 server or set up your own backend.

## 📄 License

Private - Mondzorg Sloterweg

## 👥 Authors

- Mondzorg Sloterweg Development Team

