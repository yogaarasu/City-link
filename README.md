# 🏙️ City-Link

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

> **A full-stack civic-tech platform designed to bridge the gap between citizens and local administration through a transparent, map-based reporting workflow.**

🔗 **Live Project:** [citylink-tn.vercel.app](https://citylink-tn.vercel.app/)  
💻 **GitHub Repository:** [yogaarasu/City-link](https://github.com/yogaarasu/City-link)

---

## 📖 Overview

City-Link is an end-to-end civic issue management system engineered specifically for Tamil Nadu districts. Built with the MERN stack and TypeScript, it empowers citizens to report public grievances with exact geolocation coordinates, while providing municipalities with data-driven dashboards for transparent, accountable resolution. 

*Note: This is a final year academic proof-of-concept project demonstrating enterprise-level software architecture.*

## ✨ Core Features

* **📍 Map-Based Reporting:** Interactive issue pinning using Leaflet (OpenStreetMap) with reverse geocoding for address auto-fill.
* **🛡️ Role-Based Access Control (RBAC):** Secure, multi-tier workflows for Citizens, City Admins (District-level), and Super Admins (State-level).
* **🤖 Smart Duplicate Detection:** Automated radius-checking algorithms to prevent repetitive reports, allowing users to upvote existing issues instead.
* **🌍 Bilingual i18n Support:** Native English and Tamil (தமிழ்) localization for an inclusive user experience.
* **🚦 Rate-Limiting & Security:** Upstash Redis integration to prevent spam, combined with strict Zod validation and profanity filtering.
* **📧 Automated Notifications:** Nodemailer integration for Email OTP verification and real-time status updates (Pending → Verified → In Progress → Resolved).

## 🛠️ Tech Stack

### Frontend (Client)
* **Core:** React 19, Vite, TypeScript
* **Styling & UI:** Tailwind CSS, Shadcn UI (Radix Primitives)
* **State & Data Fetching:** Zustand, TanStack Query (React Query)
* **Forms & Validation:** React Hook Form, Zod
* **Mapping:** Leaflet, React-Leaflet

### Backend (Server)
* **Core:** Node.js, Express 5
* **Database:** MongoDB with Mongoose ORM
* **Authentication:** JSON Web Tokens (JWT), bcryptjs
* **Caching & Security:** Upstash Redis
* **Media & Email:** Cloudinary (Image storage), Nodemailer

---

## 🚀 Getting Started (Local Development)

Follow these steps to set up the project locally. The project uses `pnpm` for optimal package management.

### Prerequisites
* Node.js (v18 or higher)
* MongoDB Instance (Local or Atlas)
* Cloudinary Account (for image uploads)
* Upstash Redis Account

### 1. Clone the repository
```bash
git clone [https://github.com/yogaarasu/City-link.git](https://github.com/yogaarasu/City-link.git)
cd City-link
