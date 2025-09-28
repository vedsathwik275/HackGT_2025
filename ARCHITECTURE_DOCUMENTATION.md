# NFL Field Mapper Architecture Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [System Components](#system-components)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Deployment Architecture](#deployment-architecture)
6. [Security Architecture](#security-architecture)
7. [Performance Architecture](#performance-architecture)
8. [Scalability Architecture](#scalability-architecture)
9. [Integration Architecture](#integration-architecture)
10. [Development Architecture](#development-architecture)

---

## Architecture Overview

The NFL Field Mapper system follows a **microservices architecture** with three main components:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NFL Field Mapper Architecture                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐│
│   │                 │         │                 │         │                 ││
│   │   Frontend      │◄───────►│   Backend       │         │   Live Data     ││
│   │   (Mobile)      │         │   (Mapping)     │         │   (Analytics)   ││
│   │                 │         │                 │         │                 ││
│   │  React Native   │         │  Node.js/Express│         │  Python/Flask   ││
│   │  Expo Platform  │         │  Vercel Deploy  │         │  Render Deploy  ││
│   │                 │         │                 │         │                 ││
│   └─────────────────┘         └─────────────────┘         └─────────────────┘│
│            │                           │                           │         │
│            │                           │                           │         │
│   ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐│
│   │                 │         │                 │         │                 ││
│   │  External APIs  │         │   Database      │         │   AI Services   ││
│   │                 │         │                 │         │                 ││
│   │  • Roboflow     │         │  • Supabase     │         │  • OpenAI GPT-5 ││
│   │  • Camera APIs  │         │  • PostgreSQL   │         │  • ESPN APIs    ││
│   │  • File System  │         │  • Real-time    │         │  • Web Scraping ││
│   │                 │         │                 │         │                 ││
│   └─────────────────┘         └─────────────────┘         └─────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Architectural Principles

1. **Separation of Concerns**: Each service handles a specific domain
2. **Loose Coupling**: Services communicate via well-defined APIs
3. **High Cohesion**: Related functionality is grouped together
4. **Scalability**: Each component can scale independently
5. **Resilience**: Graceful degradation when services are unavailable

---

## Technology Stack

### Frontend (Mobile Application)

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | React Native | 0.81.4 | Cross-platform mobile development |
| **Platform** | Expo | ~54.0.10 | Development and deployment platform |
| **UI Library** | React Native Elements | Latest | UI components and styling |
| **Navigation** | Custom State Management | - | Screen navigation and routing |
| **Graphics** | React Native SVG | ^15.13.0 | Field visualization and graphics |
| **Camera** | Expo Camera | ~17.0.8 | Image capture functionality |
| **Storage** | AsyncStorage | ^2.2.0 | Local data persistence |
| **HTTP Client** | Fetch API | Native | API communication |
| **State Management** | React Hooks | Native | Application state management |

### Backend (Coordinate Mapping Service)

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Node.js | Latest | JavaScript runtime environment |
| **Framework** | Express.js | ^4.18.2 | Web application framework |
| **Validation** | Express Validator | ^7.0.1 | Input validation and sanitization |
| **Security** | Helmet | ^7.1.0 | Security headers and protection |
| **CORS** | CORS | ^2.8.5 | Cross-origin resource sharing |
| **Logging** | Morgan | ^1.10.0 | HTTP request logging |
| **File Upload** | Multer | ^1.4.5-lts.1 | File upload handling |
| **Environment** | Dotenv | ^16.3.1 | Environment variable management |
| **Database Client** | Supabase JS | ^2.45.2 | Database operations |
| **Deployment** | Vercel | Latest | Serverless deployment platform |

### Live Data Service (Analytics API)

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Python | 3.12 | Programming language |
| **Framework** | Flask | Latest | Web application framework |
| **CORS** | Flask-CORS | Latest | Cross-origin resource sharing |
| **AI Integration** | OpenAI | Latest | AI-powered analysis |
| **Web Scraping** | BeautifulSoup4 | Latest | HTML parsing and scraping |
| **HTTP Client** | Requests | Latest | HTTP requests |
| **Environment** | Python-dotenv | Latest | Environment variable management |
| **Caching** | Custom Smart Cache | - | Intelligent data caching |
| **Deployment** | Render | Latest | Cloud application platform |

### Database and Storage

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Primary Database** | Supabase (PostgreSQL) | Play data storage and retrieval |
| **Real-time Features** | Supabase Real-time | Live data synchronization |
| **Authentication** | Supabase Auth | User authentication (future) |
| **File Storage** | Local File System | Temporary file storage |
| **Caching** | In-Memory Cache | Performance optimization |

### External Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| **Roboflow** | Computer vision and player detection | REST API |
| **OpenAI GPT-5** | AI analysis and natural language processing | REST API |
| **ESPN** | Live sports data and statistics | Web scraping |
| **Vercel** | Backend deployment and hosting | Platform |
| **Render** | Live data service deployment | Platform |
| **Supabase** | Database and backend services | SDK |

---

## System Components

### 1. Mobile Application Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Mobile App Architecture                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │                 │  │                 │  │                 │             │
│  │    Screens      │  │   Components    │  │     Hooks       │             │
│  │                 │  │                 │  │                 │             │
│  │  • HomeScreen   │  │  • FieldViz     │  │  • useDetection │             │
│  │  • CameraScreen │  │  • ProcessStatus│  │  • useImage     │             │
│  │  • AnalyzeScreen│  │  • StatsPanel   │  │  • useNavigation│             │
│  │  • ChatScreen   │  │  • Header       │  │                 │             │
│  │                 │  │                 │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│           │                     │                     │                     │
│           └─────────────────────┼─────────────────────┘                     │
│                                 │                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │                 │  │                 │  │                 │             │
│  │    Services     │  │   Navigation    │  │     Utils       │             │
│  │                 │  │                 │  │                 │             │
│  │  • CoordMapper  │  │  • App.js       │  │  • Constants    │             │
│  │  • LiveDataAPI  │  │  • State Mgmt   │  │  • Helpers      │             │
│  │  • PlaysAPI     │  │  • Screen Router│  │  • Validators   │             │
│  │                 │  │                 │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Key Components:

- **App.js**: Main application orchestrator with navigation logic
- **Screens**: Individual screen components with specific functionality
- **Components**: Reusable UI components for consistent design
- **Hooks**: Custom React hooks for state management and side effects
- **Services**: API clients for external service communication

### 2. Backend Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Backend Service Architecture                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │                 │  │                 │  │                 │             │
│  │     Routes      │  │   Middleware    │  │    Services     │             │
│  │                 │  │                 │  │                 │             │
│  │  • Coordinates  │  │  • Error Handler│  │  • CoordMapper  │             │
│  │  • Plays        │  │  • Request Log  │  │  • Supabase     │             │
│  │  • Health       │  │  • Validation   │  │  • File Export  │             │
│  │                 │  │  • CORS         │  │                 │             │
│  │                 │  │  • Security     │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│           │                     │                     │                     │
│           └─────────────────────┼─────────────────────┘                     │
│                                 │                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │                 │  │                 │  │                 │             │
│  │   Controllers   │  │     Models      │  │     Utils       │             │
│  │                 │  │                 │  │                 │             │
│  │  • Process      │  │  • Detection    │  │  • Math Helpers │             │
│  │  • Map          │  │  • Player       │  │  • Validators   │             │
│  │  • Export       │  │  • Field        │  │  • Constants    │             │
│  │  • Classify     │  │  • Coverage     │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Core Algorithms:

1. **Coordinate Mapping**: Converts pixel coordinates to field-relative yards
2. **Team Classification**: Automatically classifies players as offense/defense
3. **Line of Scrimmage Detection**: Estimates optimal line placement
4. **Coverage Analysis**: Advanced defensive scheme recognition
5. **Field Dimension Calculation**: Automatic scaling and calibration

### 3. Live Data Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Live Data Service Architecture                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │                 │  │                 │  │                 │             │
│  │   API Server    │  │     Scrapers    │  │   AI Analysis   │             │
│  │                 │  │                 │  │                 │             │
│  │  • Flask App    │  │  • NFL Scraper  │  │  • Chat Session │             │
│  │  • Chat Routes  │  │  • College      │  │  • Defensive    │             │
│  │  • Health Check │  │  • ESPN Parser  │  │    Coaching     │             │
│  │  • Stats API    │  │                 │  │  • OpenAI GPT-5 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│           │                     │                     │                     │
│           └─────────────────────┼─────────────────────┘                     │
│                                 │                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │                 │  │                 │  │                 │             │
│  │  Cache Manager  │  │  Data Processor │  │   Web Interface │             │
│  │                 │  │                 │  │                 │             │
│  │  • Smart Cache  │  │  • Game Parser  │  │  • Chat Server  │             │
│  │  • TTL Management│  │  • Player Stats │  │  • Test UI      │             │
│  │  • Query Opt    │  │  • Team Data    │  │  • Debug Tools  │             │
│  │                 │  │                 │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Key Features:

1. **Smart Caching**: Intelligent cache management with TTL optimization
2. **Multi-Sport Support**: Both NFL and college football data
3. **Real-time Scraping**: Live data from ESPN with error handling
4. **AI Integration**: OpenAI GPT-5 for natural language analysis
5. **Defensive Coaching**: Specialized AI for formation analysis

---

## Data Flow Architecture

### 1. Image Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Image Processing Data Flow                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [User Captures Image] ──► [Mobile App] ──► [Image Processing]              │
│           │                      │                    │                     │
│           │                      │                    ▼                     │
│           │                      │            [Roboflow API]                │
│           │                      │                    │                     │
│           │                      │                    ▼                     │
│           │                      │          [Player Detections]             │
│           │                      │                    │                     │
│           │                      │                    ▼                     │
│           │                      │          [Backend Processing]            │
│           │                      │                    │                     │
│           │                      │                    ▼                     │
│           │                      │         [Coordinate Mapping]             │
│           │                      │                    │                     │
│           │                      │                    ▼                     │
│           │                      │        [Team Classification]             │
│           │                      │                    │                     │
│           │                      │                    ▼                     │
│           │                      │         [Coverage Analysis]              │
│           │                      │                    │                     │
│           │                      │                    ▼                     │
│           │                      ◄────────── [Mapped Data]                 │
│           │                                                                 │
│           ▼                                                                 │
│    [Field Visualization] ──► [Play Storage] ──► [Supabase Database]        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Live Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Live Data Flow                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [ESPN APIs] ──► [Web Scrapers] ──► [Data Processing] ──► [Smart Cache]     │
│       │               │                    │                    │           │
│       │               │                    │                    ▼           │
│       │               │                    │            [Cache Manager]     │
│       │               │                    │                    │           │
│       │               │                    │                    ▼           │
│       │               │                    │            [Query Optimization]│
│       │               │                    │                    │           │
│       │               │                    ▼                    ▼           │
│       │               │            [Game Data] ◄──────── [Cached Data]      │
│       │               │                    │                               │
│       │               │                    ▼                               │
│       │               │            [OpenAI GPT-5]                          │
│       │               │                    │                               │
│       │               │                    ▼                               │
│       │               │            [AI Analysis]                           │
│       │               │                    │                               │
│       │               │                    ▼                               │
│       │               └──────────► [Mobile App Chat]                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Play Storage Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Play Storage Data Flow                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Analyzed Play Data] ──► [Mobile App] ──► [Backend API]                   │
│           │                     │                │                         │
│           │                     │                ▼                         │
│           │                     │        [Input Validation]                │
│           │                     │                │                         │
│           │                     │                ▼                         │
│           │                     │        [Supabase Client]                 │
│           │                     │                │                         │
│           │                     │                ▼                         │
│           │                     │      [PostgreSQL Database]               │
│           │                     │                │                         │
│           │                     │                ▼                         │
│           │                     │        [Storage Confirmation]            │
│           │                     │                │                         │
│           │                     ◄────────────────┘                         │
│           │                                                                 │
│           ▼                                                                 │
│    [Play Retrieval] ──► [Home Screen] ──► [Saved Plays List]               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Production Deployment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Production Deployment                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │                 │  │                 │  │                 │             │
│  │   Mobile App    │  │  Backend API    │  │  Live Data API  │             │
│  │                 │  │                 │  │                 │             │
│  │  Expo Platform  │  │  Vercel Deploy  │  │  Render Deploy  │             │
│  │  • iOS Build    │  │  • Serverless   │  │  • Docker       │             │
│  │  • Android Build│  │  • Auto-scale   │  │  • Always-on    │             │
│  │  • OTA Updates  │  │  • Global CDN   │  │  • Health Check │             │
│  │                 │  │  • Edge Runtime │  │  • Auto-restart │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│           │                     │                     │                     │
│           │                     │                     │                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │                 │  │                 │  │                 │             │
│  │  App Stores     │  │   Database      │  │  External APIs  │             │
│  │                 │  │                 │  │                 │             │
│  │  • iOS App Store│  │  • Supabase     │  │  • OpenAI       │             │
│  │  • Google Play  │  │  • PostgreSQL   │  │  • Roboflow     │             │
│  │  • Expo Go      │  │  • Real-time    │  │  • ESPN         │             │
│  │                 │  │  • Backups      │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Deployment Specifications

#### Mobile App (Expo)
- **Platform**: Expo Application Services (EAS)
- **Build**: Cloud-based builds for iOS and Android
- **Distribution**: App stores and Expo Go for development
- **Updates**: Over-the-air (OTA) updates for rapid deployment
- **Environment**: Production, staging, and development builds

#### Backend API (Vercel)
- **Platform**: Vercel serverless functions
- **Runtime**: Node.js 18.x
- **Scaling**: Automatic scaling based on demand
- **CDN**: Global edge network for low latency
- **Environment Variables**: Secure configuration management
- **Monitoring**: Built-in analytics and logging

#### Live Data API (Render)
- **Platform**: Render cloud application platform
- **Runtime**: Python 3.12
- **Container**: Docker-based deployment
- **Scaling**: Vertical scaling with persistent instances
- **Health Checks**: Automatic health monitoring
- **Environment**: Secure environment variable management

### Infrastructure Components

| Component | Service | Configuration |
|-----------|---------|---------------|
| **DNS** | Cloudflare/Vercel | Custom domains with SSL |
| **CDN** | Vercel Edge Network | Global content delivery |
| **Database** | Supabase | Managed PostgreSQL with backups |
| **Monitoring** | Built-in Platform Tools | Logs, metrics, and alerts |
| **Security** | Platform Security | HTTPS, CORS, input validation |

---

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Security Architecture                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        Application Security                             ││
│  │  • Input Validation  • XSS Protection  • CSRF Protection               ││
│  │  • SQL Injection Prevention  • Rate Limiting  • Error Handling         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                      │                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         API Security                                   ││
│  │  • HTTPS Encryption  • CORS Configuration  • API Key Management        ││
│  │  • Request Validation  • Response Sanitization  • Timeout Handling     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                      │                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                       Infrastructure Security                          ││
│  │  • Platform Security  • Environment Variables  • Network Security      ││
│  │  • Database Security  • Backup Encryption  • Access Control           ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Security Measures

#### Application Level
- **Input Validation**: Express-validator for all API inputs
- **XSS Protection**: Helmet.js security headers
- **CORS Configuration**: Strict origin policies
- **Error Handling**: Sanitized error responses
- **Data Sanitization**: Clean user inputs and outputs

#### API Level
- **HTTPS Enforcement**: All communications encrypted
- **API Key Management**: Secure storage of external API keys
- **Request Timeouts**: Prevent resource exhaustion
- **Rate Limiting**: Platform-level protection
- **Authentication**: Supabase auth integration (future)

#### Infrastructure Level
- **Environment Variables**: Secure configuration management
- **Database Security**: Supabase row-level security
- **Network Security**: Platform-managed firewalls
- **Backup Encryption**: Encrypted database backups
- **Access Control**: Role-based access to resources

---

## Performance Architecture

### Performance Optimization Strategies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Performance Architecture                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │                 │  │                 │  │                 │             │
│  │   Frontend      │  │    Backend      │  │   Live Data     │             │
│  │                 │  │                 │  │                 │             │
│  │  • Lazy Loading │  │  • Efficient    │  │  • Smart Cache  │             │
│  │  • Image Opt    │  │    Algorithms   │  │  • Query Opt    │             │
│  │  • State Mgmt   │  │  • Memory Mgmt  │  │  • Batch Proc   │             │
│  │  • Component    │  │  • Response     │  │  • TTL Mgmt     │             │
│  │    Optimization │  │    Compression  │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Performance Metrics

| Component | Metric | Target | Current |
|-----------|--------|--------|---------|
| **Mobile App** | App Launch Time | < 3s | ~2.5s |
| **Mobile App** | Image Processing | < 10s | ~8s |
| **Backend API** | Response Time | < 500ms | ~300ms |
| **Live Data API** | AI Response | < 5s | ~3.5s |
| **Database** | Query Time | < 100ms | ~50ms |

### Optimization Techniques

#### Frontend Optimizations
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Compression and caching
- **State Management**: Efficient React hooks usage
- **Memory Management**: Proper cleanup of resources
- **Bundle Optimization**: Code splitting and tree shaking

#### Backend Optimizations
- **Algorithm Efficiency**: Optimized coordinate mapping
- **Memory Management**: Efficient data structures
- **Response Compression**: Gzip compression enabled
- **Database Optimization**: Efficient queries and indexing
- **Caching**: In-memory caching for frequent operations

#### Live Data Optimizations
- **Smart Caching**: Intelligent TTL management
- **Query Optimization**: Efficient data filtering
- **Batch Processing**: Bulk operations for better performance
- **Connection Pooling**: Efficient resource utilization
- **Async Processing**: Non-blocking operations

---

## Scalability Architecture

### Horizontal Scaling Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Scalability Architecture                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         Load Distribution                               ││
│  │                                                                         ││
│  │   [Load Balancer] ──► [Backend Instance 1] ──► [Database Pool]         ││
│  │         │             [Backend Instance 2]                             ││
│  │         │             [Backend Instance N]                             ││
│  │         │                                                               ││
│  │         └──────────► [Live Data Instance 1] ──► [Cache Cluster]        ││
│  │                     [Live Data Instance 2]                             ││
│  │                     [Live Data Instance N]                             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        Auto-Scaling Triggers                           ││
│  │                                                                         ││
│  │  • CPU Usage > 70%        • Memory Usage > 80%                         ││
│  │  • Request Queue > 100    • Response Time > 1s                         ││
│  │  • Error Rate > 5%        • Custom Metrics                             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Scaling Strategies

#### Current Implementation
- **Backend**: Vercel serverless auto-scaling
- **Live Data**: Render vertical scaling
- **Database**: Supabase managed scaling
- **Mobile**: Client-side optimization

#### Future Scaling Plans
- **Microservices**: Break down into smaller services
- **Container Orchestration**: Kubernetes deployment
- **Database Sharding**: Horizontal database scaling
- **CDN Integration**: Global content distribution
- **Caching Layer**: Redis for distributed caching

### Capacity Planning

| Component | Current Capacity | Scaling Trigger | Max Capacity |
|-----------|------------------|-----------------|--------------|
| **Backend API** | 1000 req/min | CPU > 70% | Auto-scale |
| **Live Data API** | 100 concurrent | Memory > 80% | 4x instances |
| **Database** | 100 connections | Connection > 80% | Auto-scale |
| **Mobile Users** | 1000 concurrent | N/A | Unlimited |

---

## Integration Architecture

### External Service Integrations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Integration Architecture                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │                 │  │                 │  │                 │             │
│  │   Roboflow      │  │    OpenAI       │  │     ESPN        │             │
│  │                 │  │                 │  │                 │             │
│  │  • Computer     │  │  • GPT-5 Model  │  │  • Live Scores  │             │
│  │    Vision       │  │  • Chat API     │  │  • Player Stats │             │
│  │  • Player       │  │  • Analysis     │  │  • Game Data    │             │
│  │    Detection    │  │  • Coaching     │  │  • Team Info    │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│           │                     │                     │                     │
│           ▼                     ▼                     ▼                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        API Gateway Layer                               ││
│  │                                                                         ││
│  │  • Request Routing    • Rate Limiting    • Error Handling              ││
│  │  • Authentication    • Response Caching  • Monitoring                  ││
│  │  • Load Balancing    • Circuit Breaker   • Logging                     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      Application Services                               ││
│  │                                                                         ││
│  │  [Mobile App] ◄──► [Backend API] ◄──► [Live Data API]                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Patterns

#### API Integration
- **REST APIs**: Standard HTTP-based communication
- **JSON Format**: Consistent data exchange format
- **Error Handling**: Graceful degradation on failures
- **Retry Logic**: Automatic retry with exponential backoff
- **Circuit Breaker**: Prevent cascade failures

#### Data Integration
- **Real-time Updates**: WebSocket connections (future)
- **Batch Processing**: Bulk data operations
- **Data Transformation**: Format conversion between services
- **Validation**: Input/output data validation
- **Caching**: Reduce external API calls

#### Service Integration
- **Service Discovery**: Dynamic service location
- **Health Checks**: Monitor service availability
- **Load Balancing**: Distribute requests efficiently
- **Monitoring**: Track integration performance
- **Alerting**: Notify on integration failures

---

## Development Architecture

### Development Environment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Development Architecture                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │                 │  │                 │  │                 │             │
│  │  Local Mobile   │  │  Local Backend  │  │ Local Live Data │             │
│  │                 │  │                 │  │                 │             │
│  │  • Expo Dev     │  │  • Node.js      │  │  • Python Flask │             │
│  │  • Hot Reload   │  │  • Nodemon      │  │  • Debug Mode   │             │
│  │  • Device Test  │  │  • Local DB     │  │  • Test Data    │             │
│  │                 │  │                 │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│           │                     │                     │                     │
│           └─────────────────────┼─────────────────────┘                     │
│                                 │                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │                 │  │                 │  │                 │             │
│  │   Development   │  │     Testing     │  │    Deployment   │             │
│  │     Tools       │  │     Tools       │  │     Tools       │             │
│  │                 │  │                 │  │                 │             │
│  │  • VS Code      │  │  • Jest         │  │  • GitHub       │             │
│  │  • Git          │  │  • Supertest    │  │  • Vercel CLI   │             │
│  │  • ESLint       │  │  • Pytest      │  │  • Render CLI   │             │
│  │  • Prettier     │  │  • Mock APIs    │  │  • Expo CLI     │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Development Workflow

#### Version Control
- **Git**: Distributed version control
- **GitHub**: Repository hosting and collaboration
- **Branching**: Feature branches with pull requests
- **Code Review**: Mandatory review process
- **CI/CD**: Automated testing and deployment

#### Development Tools
- **IDE**: Visual Studio Code with extensions
- **Linting**: ESLint for JavaScript, Pylint for Python
- **Formatting**: Prettier for consistent code style
- **Debugging**: Built-in debuggers and logging
- **Testing**: Jest, Supertest, Pytest frameworks

#### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full workflow testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Vulnerability scanning

### Deployment Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Deployment Pipeline                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Code Commit] ──► [GitHub] ──► [CI/CD Pipeline] ──► [Automated Tests]     │
│                       │               │                      │             │
│                       │               │                      ▼             │
│                       │               │              [Test Results]        │
│                       │               │                      │             │
│                       │               │                      ▼             │
│                       │               │              [Build Process]       │
│                       │               │                      │             │
│                       │               │                      ▼             │
│                       │               │              [Deployment]          │
│                       │               │                      │             │
│                       │               │                      ▼             │
│                       │               └──────────► [Production]            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

This comprehensive architecture documentation provides a complete view of the NFL Field Mapper system's technical implementation, from high-level design decisions to detailed deployment strategies.
