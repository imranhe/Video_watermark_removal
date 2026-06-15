# [Project Name]

Brief project description (1-2 sentences).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- Feature 1: description
- Feature 2: description
- Feature 3: description

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | uni-App (Vue3 + Vite + TypeScript) |
| State Management | Pinia |
| Backend | Node.js / Express |
| Database | MySQL 5.7+ |
| Deployment | Docker + Docker Compose |

---

## Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Docker (optional, for production)

### Installation

```bash
# Clone the repository
git clone https://github.com/username/project-name.git
cd project-name

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev:h5
```

### Docker Deployment

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/guides/getting-started.md) | Quick setup guide |
| [API Reference](docs/api/reference.md) | Complete API documentation |
| [Components](docs/components/overview.md) | Component usage guide |
| [Deployment](docs/guides/deployment.md) | Production deployment guide |

See [docs/README.md](docs/README.md) for the full documentation index.

---

## Project Structure

```
project-name/
├── src/
│   ├── api/              # API interfaces
│   ├── components/       # Reusable components
│   ├── pages/            # Page views
│   ├── store/            # Pinia stores
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── server/               # Backend services
├── database/             # Database scripts
├── docs/                 # Documentation
└── package.json
```

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

---

## License

[MIT License](LICENSE)

---

*Last updated: YYYY-MM-DD*
