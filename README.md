# Atelier — Circular Fashion & Digital Wardrobe Platform

**Live Site:** [atelier-lime-tau.vercel.app](https://atelier-lime-tau.vercel.app)

Atelier is an interactive, scrapbook-styled web platform built to make everyday fashion more circular—helping users organize what they already own, style new outfits, repair garments with local tailors, and swap or thrift pre-loved pieces.

## Features
- **Digital Closet & Outfit Generator:** Private wardrobe management with category filters, garment editing, customizable outfit slots, piece locking/swapping, and AI-powered styling & fabric-care notes.
- **Circular Care AI Assistant:** Floating Gemini-powered care stylist offering fabric washing guides, DIY mending tips, and circular next steps.
- **Lookbook & Profiles:** Personal outfit lookbooks, customizable tailor/designer studio profiles with workshop locations, and follower/following connections.
- **Circular Marketplace & Cart:** Pre-loved clothing listings with image uploads and UPI checkout flow.
- **Local Tailors & Events:** Searchable directory of local tailors/designers and community clothing swaps & repair workshops with private RSVPs.
- **Community & Style Forums:** Home feed, style forums, member search, and interactive discussions.

## Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend & Auth:** Supabase (PostgreSQL, Row Level Security, Google & Email Auth)
- **Media Storage:** Cloudinary
- **AI & Deployment:** Google Gemini API via Vercel Serverless Functions (`/api/atelier-ai.js`)