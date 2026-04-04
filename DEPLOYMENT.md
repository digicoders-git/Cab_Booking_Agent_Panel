# 🚀 Deployment Guide - Agent Panel

## 📋 Environment Setup

### **Local Development**
```bash
# Use .env.development (automatically used by Vite)
npm run dev
```

### **Production Build**
```bash
# Use .env.production (automatically used by Vite)
npm run build
```

---

## 🔧 Environment Variables

### **Production (.env.production)**
```env
VITE_API_BASE_URL=https://api.kwikcabs.in
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBEss4wpsQ0o9WPBjDgHsSByUzFuo2oSNE
```

### **Development (.env.development)**
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBEss4wpsQ0o9WPBjDgHsSByUzFuo2oSNE
```

---

## 🖼️ Image URL Fix

**Problem:** Images not loading on production server

**Solution:** All image URLs now use `API_BASE_URL` from environment variables

**Files Fixed:**
- ✅ `AgentProfile.jsx` - Profile image
- ✅ `AgentDashboard.jsx` - Dashboard profile card
- ✅ `CreateBooking.jsx` - Cab images
- ✅ `BookingTable.jsx` - Car category images

**Helper Function:**
```javascript
import { API_BASE_URL } from '../../api/agentApi';

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath; // Already full URL
  return `${API_BASE_URL}/uploads/${imagePath}`;
};
```

---

## 📦 Build & Deploy

### **Step 1: Build for Production**
```bash
npm run build
```

### **Step 2: Preview Build Locally**
```bash
npm run preview
```

### **Step 3: Deploy to Server**
Upload `dist/` folder to your hosting provider (Vercel, Netlify, etc.)

---

## 🔍 Troubleshooting

### **Images not loading?**
1. Check `.env` file has correct `VITE_API_BASE_URL`
2. Restart dev server after changing `.env`
3. Clear browser cache
4. Check backend CORS settings allow your frontend domain

### **API calls failing?**
1. Verify backend is running at `https://api.kwikcabs.in`
2. Check network tab in browser DevTools
3. Verify token is being sent in Authorization header

---

## 🌐 Production URLs

- **Frontend:** https://your-frontend-domain.com
- **Backend API:** https://api.kwikcabs.in
- **Image CDN:** https://api.kwikcabs.in/uploads/

---

## 📝 Notes

- Vite automatically uses `.env.production` when running `npm run build`
- Vite automatically uses `.env.development` when running `npm run dev`
- Never commit `.env` files with sensitive keys to Git
- Use `.env.example` as template for team members
