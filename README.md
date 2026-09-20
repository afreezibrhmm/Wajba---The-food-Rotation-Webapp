# WAJBA - Masjid Mahallu Food Management System

WAJBA is a zero-cost, multi-tenant web application designed for Islamic masjids to organize and streamline daily meal rotations (Padi/Mahallu) for teachers (Ustads).

---

## Features:

- Multi-Tenancy**: Isolated data for every registered masjid using a unique `masjid_id`[cite: 1].
- Role-Based Access**:
  - Admin: Enroll masjids, manage house rosters, assign schedules, and review live statuses[cite: 1].
  - House Head (Member): Log in via registered mobile number and secure 4-digit PIN to confirm or swap meal duty[cite: 1].
  - Madrasa Ustad: Access daily food schedules and meal information[cite: 1].
- Automated Duty Assignment: Assign meal dates and slots directly while registering a household.
- WhatsApp Direct Reminders: Send 1-day-before reminder alerts directly to house heads via `wa.me` deep links at zero cost[cite: 1].
- Zero-Cost Stack: Completely functional on free tiers with no paid SMS gateways or external server subscriptions required[cite: 1].

---

##  Tech Stack

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript[cite: 1]
- **Database & Realtime**: [Supabase](https://supabase.com/) (PostgreSQL + Realtime + Row Level Security)[cite: 1]
- **Alerts**: WhatsApp Web Direct (`wa.me`)[cite: 1]

## Accessible through the Live Web App Link:
https://wajba-webapp.vercel.app/
