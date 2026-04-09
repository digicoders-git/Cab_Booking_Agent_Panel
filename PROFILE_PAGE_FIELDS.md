# 📋 Agent Profile Page - Complete Field Mapping

## 🎯 API Endpoint
```
GET /api/agents/profile
Authorization: Bearer <token>
```

---

## ✅ All Fields Displayed on Profile Page

### **1️⃣ Profile Card (Left Side)**

#### **Profile Image**
```javascript
agent.image → `${API_BASE_URL}/uploads/${agent.image}`
```
- ✅ Displayed in profile card
- ✅ Dynamic URL (works for localhost + production)
- ✅ Fallback: User icon with first letter of name

#### **Basic Info**
```javascript
agent.name          → Profile name
agent.email         → Email address
agent.phone         → Phone number
agent.isActive      → Active/Inactive badge
```

#### **Stats Grid (4 Cards)**
```javascript
agent.commissionPercentage  → Commission %
agent.walletBalance         → Wallet Balance (₹)
agent.totalEarnings         → Total Earnings (₹)
agent.totalBookings         → Total Bookings count
```

#### **Member Since**
```javascript
agent.createdAt → Formatted date (e.g., "5 Apr, 2024")
```

---

### **2️⃣ Personal Information (Right Side)**

#### **Editable Fields**
```javascript
agent.name      → Full Name (editable)
agent.phone     → Phone Number (editable)
agent.email     → Email Address (read-only)
agent.address   → Address (editable)
agent.city      → City (editable)
agent.state     → State (editable)
agent.pincode   → Pincode (editable)
```

#### **Password Change (Optional)**
```
New Password field
Confirm Password field
```

---

### **3️⃣ Bank Details Section**

```javascript
agent.bankDetails.bankName           → Bank Name
agent.bankDetails.accountHolderName  → Account Holder Name
agent.bankDetails.accountNumber      → Account Number (masked: ****1234)
agent.bankDetails.ifscCode           → IFSC Code
```

**Display Condition:** Only shows if `agent.bankDetails` exists

---

### **4️⃣ Documents Section**

```javascript
agent.documents.aadhar  → Aadhar Card (clickable link)
agent.documents.pan     → PAN Card (clickable link)
```

**Features:**
- ✅ Clickable links to view documents
- ✅ Opens in new tab
- ✅ Full URL: `${API_BASE_URL}/uploads/${document}`

**Display Condition:** Only shows if `agent.documents` exists

---

### **5️⃣ Account Information Footer**

```javascript
agent.createdAt      → Member since date
agent.updatedAt      → Last updated date
agent._id            → Agent ID (last 8 characters)
agent.totalBookings  → Total Bookings count
```

---

## 🔍 Console Logs (For Debugging)

When profile loads, check browser console for:

```javascript
🔍 Profile API Response: { success: true, agent: {...} }
👤 Agent Data: { _id, name, email, ... }
📸 Image: "1775414806870_image.png"
🏦 Bank Details: { bankName, accountNumber, ... }
📄 Documents: { aadhar, pan }
📊 Total Bookings: 25
💰 Total Earnings: 5000
```

---

## 📊 Field Coverage

| API Field | Displayed? | Location |
|-----------|-----------|----------|
| `_id` | ✅ Yes | Account Info (last 8 chars) |
| `name` | ✅ Yes | Profile Card + Form |
| `email` | ✅ Yes | Profile Card + Form (read-only) |
| `phone` | ✅ Yes | Profile Card + Form |
| `image` | ✅ Yes | Profile Card (with dynamic URL) |
| `commissionPercentage` | ✅ Yes | Stats Grid |
| `walletBalance` | ✅ Yes | Stats Grid |
| `isActive` | ✅ Yes | Status Badge |
| `documents.aadhar` | ✅ Yes | Documents Section |
| `documents.pan` | ✅ Yes | Documents Section |
| `address` | ✅ Yes | Personal Info Form |
| `city` | ✅ Yes | Personal Info Form |
| `state` | ✅ Yes | Personal Info Form |
| `pincode` | ✅ Yes | Personal Info Form |
| `bankDetails.accountNumber` | ✅ Yes | Bank Details Section |
| `bankDetails.ifscCode` | ✅ Yes | Bank Details Section |
| `bankDetails.accountHolderName` | ✅ Yes | Bank Details Section |
| `bankDetails.bankName` | ✅ Yes | Bank Details Section |
| `totalBookings` | ✅ Yes | Stats Grid + Account Info |
| `totalEarnings` | ✅ Yes | Stats Grid |
| `createdBy` | ❌ No | Not displayed (internal use) |
| `createdAt` | ✅ Yes | Account Info |
| `updatedAt` | ✅ Yes | Account Info |

---

## 🎨 UI Sections

### **Left Column (Profile Card)**
- Profile Image (with edit button in edit mode)
- Name, Email, Phone
- Active Status Badge
- 4 Stats Cards (Commission, Wallet, Earnings, Bookings)
- Member Since

### **Right Column (Main Content)**
- Personal Information Form
- Password Change Section (edit mode only)
- Bank Details Section (if available)
- Documents Section (if available)
- Account Information Footer

---

## 🔧 How to Test

1. **Start Server:**
   ```bash
   npm run dev
   ```

2. **Login as Agent:**
   ```
   http://localhost:5176/agent/login
   ```

3. **Go to Profile:**
   ```
   http://localhost:5176/agent/profile
   ```

4. **Check Console:**
   - Press F12
   - Go to Console tab
   - Look for 🔍 logs

5. **Verify All Fields:**
   - ✅ Profile image loading?
   - ✅ Stats showing correct numbers?
   - ✅ Bank details visible?
   - ✅ Documents clickable?
   - ✅ All personal info fields populated?

---

## 🐛 Troubleshooting

### **Image Not Loading?**
- Check console: `📸 Image: "filename.png"`
- Check URL: `${API_BASE_URL}/uploads/filename.png`
- Verify `.env` has correct `VITE_API_BASE_URL`

### **Bank Details Not Showing?**
- Check console: `🏦 Bank Details: {...}`
- If `null` or `undefined`, backend not sending data

### **Documents Not Showing?**
- Check console: `📄 Documents: {...}`
- If `null` or `undefined`, backend not sending data

---

## ✅ Summary

**Total Fields Displayed:** 22+ fields  
**Sections:** 5 major sections  
**Dynamic URLs:** Image + Documents  
**Editable Fields:** 7 fields  
**Read-only Fields:** 15+ fields  

**All API data properly mapped and displayed!** 🎉
