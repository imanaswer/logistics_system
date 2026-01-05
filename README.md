<div align="center">

  <img src="https://capsule-render.vercel.app/api?type=waving&color=0f172a&height=300&section=header&text=Logistics%20ERP&fontSize=90&fontColor=ffffff&desc=Freight%20Forwarding%20Management%20System&descSize=20&fontAlign=50" alt="Logistics ERP Banner" />

  <br/>

  ![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
  ![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
  ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

  <br/>

  <p align="center">
    <strong>A modern, full-stack solution for managing Sea, Air, and Land freight operations.</strong>
    <br />
    <a href="#-key-features"><strong>Explore the features »</strong></a>
    <br />
    <br />
    <a href="#-demo">View Demo</a>
    ·
    <a href="#-getting-started">Report Bug</a>
    ·
    <a href="#-getting-started">Request Feature</a>
  </p>
</div>

---

## 📦 About The Project

**Logistics ERP** is a comprehensive dashboard designed to streamline the complex operations of freight forwarding. Unlike legacy systems, this application focuses on a **high-contrast, aesthetic UI** and **automated workflows** to reduce manual entry errors.

It handles everything from **Job Card creation** to **VAT-compliant Invoicing** and **Manifest generation**.

### ✨ Key Features

* **🚚 Multi-Modal Job Tracking:** Seamlessly manage Sea, Air, and Land freight jobs.
* **💰 Automated Invoicing:** One-click PDF generation with auto-calculated VAT (5%) and totals.
* **🧾 VAT Compliance:** Dedicated fields for Client VAT numbers and Tax Registration checks.
* **🔍 Smart Search:** Instant filtering of jobs by ID, Client Name, or Status.
* **📱 WhatsApp Integration:** Send updates to clients directly from the dashboard.
* **🔒 Secure Auditing:** Track every edit, deletion, and creation with user timestamps.

---

## 💻 Tech Stack

This project is built using a robust, scalable stack:

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 14](https://nextjs.org/) | React framework for high-performance UI. |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS for rapid, modern design. |
| **Backend** | [Django REST Framework](https://www.django-rest-framework.org/) | Secure and scalable API management. |
| **Database** | [PostgreSQL](https://www.postgresql.org/) / SQLite | Relational database for structured data. |
| **PDF Engine** | [React-To-Print](https://www.npmjs.com/package/react-to-print) | Pixel-perfect invoice rendering. |

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

* Node.js (v18+)
* Python (v3.10+)

### 1. Backend Setup (Django)

```bash
# Clone the repository
git clone [https://github.com/your-username/logistics-erp.git](https://github.com/your-username/logistics-erp.git)
cd logistics-erp/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the server
python manage.py runserver




# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start the development server
npm run dev


https://logistics-backend-848b.onrender.com/admin/api/chargetype/add/