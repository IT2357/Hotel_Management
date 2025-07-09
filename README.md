```markdown
# 🏨 Hotel Management System

A powerful MERN-based solution designed to streamline hotel operations with role-based access, scalable architecture, and modern development tools.

---

## ⚙️ How to Use

Follow these steps to get the project up and running on your local machine:

### 0. Open Terminal from Project Folder

```bash
cd hotel_management
```

### 1. Install Root Dependencies

```bash
npm install
```

### 2. Install Subfolder Dependencies

```bash
npm run install-all
```

### 3. Start Development Mode

```bash
npm run dev
```

---

## 🚀 Push All Local Git Branches to Remote

Use this script to push all your local branches to the remote repository:

```bash
for branch in $(git branch | sed 's/* //'); do
  git push origin $branch
done
```

---

## 🗂️ Project Folder Structure

Below is a high-level overview of the project layout:

```
hotel-management-system/
├── backend/
│   ├── config/             # Database, cloud, Redis configs
│   ├── controllers/        # Modular controllers (auth, rooms, food, etc.)
│   ├── models/             # Database schemas and profiles
│   ├── routes/             # API route definitions
│   ├── middleware/         # Validation, authentication, error handling
│   ├── services/           # Business logic and 3rd-party integrations
│   ├── utils/              # Common utility functions
│   ├── tests/              # Unit, integration, and test data
│   ├── uploads/            # Static file uploads (images, docs, etc.)
│   ├── docs/               # API and deployment documentation
│   ├── .env, .gitignore, package.json, server.js, app.js
│
├── frontend/
│   ├── public/             # Public HTML and manifest
│   ├── src/
│   │   ├── components/     # All UI components (auth, booking, rooms, etc.)
│   │   ├── pages/          # Static and dynamic pages
│   │   ├── context/        # React contexts for global state
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API call handlers
│   │   ├── utils/          # Client-side utilities
│   │   ├── styles/         # CSS & theming
│   │   ├── assets/         # Fonts, icons, and images
│   │   └── App.jsx, index.js, etc.
│   ├── .env, .gitignore, package.json
│
├── shared/
│   ├── constants/          # Shared roles, statuses, validation config
│   ├── types/              # Shared data models
│   └── utils/              # Reusable utility methods
│
├── docs/                   # General documentation and screenshots
├── scripts/                # Seed, migrate, and backup scripts
├── docker-compose.yml
└── README.md
```

---

## 🧩 Key Features of This Structure

### ✅ Backend Highlights
- Modular controller structure with focus on scalability
- Middleware layers for validation, roles, and rate-limiting
- External service integrations (payment, notifications, analytics)
- Clean separation of concerns using services and utils

### 🎨 Frontend Highlights
- Role-specific dashboards for guests, staff, managers, and admins
- Reusable UI components and custom hooks
- Organized by feature and screen for easy scaling

### 🔗 Shared Resources
- DRY code using shared constants and utilities
- Type-based models to maintain consistency
- Easy-to-read formatting and expandable documentation

### 🧪 Development Toolkit
- Integrated unit and integration tests
- Environment configuration examples
- Deployment scripts and Docker support

---

## 🛠 Requirements

Make sure these are installed:

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/) (v8+)
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) *(optional)*

---

## 📬 Need Help?

If you encounter any issues:

- 📩 Open an issue on the GitHub repo

---

## 💡 License

This project is released under the MIT License.

---

## 🎉 Happy Hacking!

Thanks for exploring the Hotel Management System! Feel free to customize, contribute, and scale it to fit your needs.
```