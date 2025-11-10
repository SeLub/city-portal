# 🏙️ City Portal — Full-Stack Classifieds Platform

A modern, scalable city portal for classified listings (goods, jobs, autos, real estate), user management, business directory, and community features — built with a cutting-edge **Next.js 15 (App Router)** frontend and **NestJS** backend, backed by **PostgreSQL** and **Tebi.io** (S3-compatible object storage).

![City Portal Dashboard](https://tebi.io/img/illustration.webp)

---

## 🚀 Features

### ✅ Core Functionality
- **User Authentication**: Secure JWT-based login with HTTP-only cookies
- **Profile Management**: Avatar upload with automatic replacement and Tebi CDN delivery
- **Classified Listings**: Create, edit, and manage listings across 4 categories:
  - Goods
  - Jobs
  - Autos
  - Real Estate
- **Image Uploads**: Drag & drop image uploader for listings (up to 10 images per listing)
- **Business Directory**: Verified business profiles with logos and contact info
- **Admin Dashboard**: Inspired by [Listee Template](https://listee.dreamstechnologies.com/html/admin/signin.html)

### 🔐 Security
- Secure cookie-based sessions (`HttpOnly`, `SameSite=Lax`)
- Argon2 password hashing
- Role-based access control (`USER`, `BUSINESS`, `MODERATOR`, `ADMIN`)
- File validation (MIME type, extension, size)

### ☁️ File Storage
- **Tebi.io integration** for geo-distributed, high-speed object storage
- Automatic public CDN URLs (`https://s3.tebi.io/{bucket}/...`)
- Structured prefixes: `public/listings/autos/{id}/01.jpg`
- Orphaned file cleanup on image replacement

### 🛠️ Developer Experience
- Monorepo with `pnpm` workspaces
- Dockerized PostgreSQL (`db/docker-compose.yml`)
- Swagger API documentation (`/api/docs`)
- Type-safe Prisma ORM
- Tailwind CSS + shadcn-inspired UI
- Full TypeScript (strict mode)

---

## 📦 Tech Stack

| Layer | Technology |
|------|-----------|
| **Frontend** | Next.js 15 (App Router), React Server Components, Tailwind CSS, `fetch` |
| **Backend** | NestJS, Prisma ORM, PostgreSQL, JWT, Passport.js |
| **Storage** | Tebi.io (S3-compatible), Geo-distributed CDN |
| **Auth** | Secure HTTP-only cookies, Argon2 hashing |
| **Infrastructure** | Docker (PostgreSQL), Docker Compose |
| **Dev Tools** | Swagger, ESLint, Prettier, VS Code recommended |

---

## 🚦 Getting Started

### Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker & Docker Compose
- [Tebi.io](https://tebi.io) account (free tier available)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/city-portal.git
cd city-portal
pnpm install

2. Set Up Environment Files 
Backend (.env)

# apps/backend/.env
PORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5440/cityportal?schema=public"
JWT_SECRET="your_32_byte_strong_secret_here_1234567890ab"

# Tebi S3-compatible storage
TEIBI_ENDPOINT=https://s3.tebi.io
TEIBI_ACCESS_KEY=your_tebi_access_key
TEIBI_SECRET_KEY=your_tebi_secret_key
TEIBI_BUCKET=your-city-portal-bucket

Frontend (.env.local) 
env
 
 
1
2
3
# apps/frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
 
 

    💡 Generate JWT_SECRET with:   
    bash
     

     
    1
    openssl rand -hex 32
     
     
     

3. Start PostgreSQL 
bash
 
 
1
2
cd db
docker-compose up -d
 
 
4. Run Migrations 
bash
 
 
1
2
cd apps/backend
pnpm prisma migrate dev --name init
 
 
5. Start Services 

Terminal 1 (Backend): 
bash
 
 
1
2
cd apps/backend
pnpm run dev
 
 

Terminal 2 (Frontend): 
bash
 
 
1
2
cd apps/frontend
pnpm run dev
 
 
6. Access the App 

    Frontend: http://localhost:3000 
    Backend API: http://localhost:3001 
    Swagger Docs: http://localhost:3001/api/docs 

🗂️ Project Structure 
 
 
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
city-portal/
├── apps/
│   ├── backend/              # NestJS server
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   ├── prisma/
│   │   │   └── common/services/  # FileService, etc.
│   │   └── prisma/schema.prisma
│   │
│   └── frontend/             # Next.js 15 App Router
│       ├── src/app/
│       │   ├── (auth)/       # Auth pages (login, register)
│       │   ├── (dashboard)/  # Admin dashboard layout
│       │   ├── profile/      # User profile page
│       │   └── listings/     # Listing CRUD pages
│       └── src/components/
│
├── db/                       # PostgreSQL via Docker
│   ├── docker-compose.yml
│   └── docker-compose.env
│
└── package.json              # pnpm workspaces root
 
 
 
🧪 Testing Endpoints 
Auth 
bash
 
 
1
2
3
4
5
6
7
8
9
10
11
12
13
# Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secure123"}'

# Login → sets `auth_token` cookie
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secure123"}' \
  -c cookies.txt

# Get profile
curl http://localhost:3001/auth/me -b cookies.txt
 
 
File Upload (Avatar) 
bash
 
 
1
2
3
curl -X POST http://localhost:3001/auth/upload/avatar \
  -b cookies.txt \
  -F "file=@avatar.jpg"
 
 
 
🛡️ Tebi.io Bucket Policy 

For full functionality, apply this bucket policy in your Tebi client panel: 
json
 
 
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
⌄
⌄
⌄
⌄
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowFullAccess",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-city-portal-bucket/*"
    }
  ]
}
 
 

    Replace your-city-portal-bucket with your actual bucket name. 
     

 
📈 Future Roadmap 

    Forum & Blog modules
    Stripe payment integration
    Email notifications (Resend / SMTP)
    Advanced search with filters
    Mobile app (React Native)
    Multi-city support
    Admin moderation tools
     

 
🤝 Contributing 

PRs welcome! Please follow: 

    Feature branches (feature/xyz)
    Conventional commits
    Type-safe code
    Update README if needed
     

 
📄 License 

MIT © 2025 — Built with ❤️ for open, connected communities. 
 

Made with:
Next.js  • NestJS  • Prisma  • Tebi.io  • PostgreSQL  • Tailwind CSS  