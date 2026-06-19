import { useState, useRef, forwardRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FaUserCircle, FaUserPlus, FaUpload, FaUser, FaEnvelope, FaLock, FaPhone, FaIdCard, FaMapMarkerAlt, FaArrowRight, FaArrowLeft, FaCheckCircle, FaShieldAlt, FaUniversity } from 'react-icons/fa';
import { API_BASE_URL } from '../../api/agentApi';

const STEPS = ['Personal Info', 'Documents', 'Bank Details', 'Uploads'];

const InputField = forwardRef(({ label, icon: Icon, error, ...props }, ref) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />}
      <input
        ref={ref}
        className={`w-full ${Icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${error ? 'border-red-400' : 'border-gray-300'}`}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
));

const FileUpload = ({ label, name, accept = 'image/*', value, onChange, error }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <label className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50 ${error ? 'border-red-400' : 'border-gray-300'} ${value ? 'border-green-400 bg-green-50' : ''}`}>
      <input type="file" name={name} accept={accept} className="hidden" onChange={onChange} />
      {value ? (
        <>
          <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
          <span className="text-sm text-green-700 truncate">{value.name}</span>
        </>
      ) : (
        <>
          <FaUpload className="text-gray-400 text-lg flex-shrink-0" />
          <span className="text-sm text-gray-500">Click to upload {label}</span>
        </>
      )}
    </label>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export default function AgentRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    address: '', city: '', state: '', pincode: '',
    aadharNumber: '', panNumber: '',
    accountNumber: '', ifscCode: '', accountHolderName: '', bankName: '',
    image: null, aadhar: null, pan: null
  });

  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const addressRef = useRef(null);

  useEffect(() => {
    if (step === 1 && addressRef.current && window.google) {
      const autocomplete = new window.google.maps.places.Autocomplete(addressRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'in' }
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;

        let city = '', state = '', pincode = '';
        place.address_components.forEach(comp => {
          if (comp.types.includes('locality')) city = comp.long_name;
          if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
          if (comp.types.includes('postal_code')) pincode = comp.long_name;
        });

        setForm(prev => ({
          ...prev,
          address: place.formatted_address,
          city: city || prev.city,
          state: state || prev.state,
          pincode: pincode || prev.pincode
        }));
        setIsAddressSelected(true);
      });
    }
  }, [step]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm(prev => ({ ...prev, [name]: files ? files[0] : value }));
    if (name === 'address') setIsAddressSelected(false);
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (step === 0) {
      if (!form.name.trim()) errs.name = 'Name required';
      if (!form.email.trim()) errs.email = 'Email required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
      if (!form.phone.trim()) errs.phone = 'Phone required';
      else if (!/^\d{10}$/.test(form.phone)) errs.phone = '10 digit phone number';
      if (!form.password) errs.password = 'Password required';
      else if (form.password.length < 6) errs.password = 'Min 6 characters';
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    }
    if (step === 1) {
      if (!form.aadharNumber.trim()) errs.aadharNumber = 'Aadhar required';
      if (!form.panNumber.trim()) errs.panNumber = 'PAN required';
      if (!form.address.trim()) errs.address = 'Address required';
      if (!form.city.trim()) errs.city = 'City required';
      if (!form.state.trim()) errs.state = 'State required';
      if (!form.pincode.trim()) errs.pincode = 'Pincode required';
    }
    if (step === 2) {
      if (!form.accountNumber.trim()) errs.accountNumber = 'Account number required';
      if (!form.ifscCode.trim()) errs.ifscCode = 'IFSC code required';
      if (!form.accountHolderName.trim()) errs.accountHolderName = 'Account holder name required';
      if (!form.bankName.trim()) errs.bankName = 'Bank name required';
    }
    if (step === 3) {
      if (!form.image) errs.image = 'Profile photo required';
      if (!form.aadhar) errs.aadhar = 'Aadhar upload required';
      if (!form.pan) errs.pan = 'PAN upload required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    
    try {
      const data = new FormData();
      Object.keys(form).forEach(key => {
        if (key !== 'confirmPassword') {
          data.append(key, form[key]);
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/agents/self-register`, {
        method: 'POST',
        body: data
      });
      
      const resData = await response.json();
      
      if (response.ok && resData.success) {
        toast.success(resData.message || 'Registration submitted! Waiting for Admin Approval.');
        setTimeout(() => navigate('/agent/login'), 2000);
      } else {
        toast.error(resData.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration Error:', err);
      toast.error('Network Error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4 py-10">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-1 flex-shrink-0 shadow-sm">
              <FaUserPlus className="text-3xl text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Agent Registration</h1>
              <p className="text-blue-100 text-xs mt-1">Become a booking agent</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${i < step ? 'bg-green-400 text-white shadow-sm' : i === step ? 'bg-white text-blue-600 shadow-md ring-2 ring-blue-300' : 'bg-white/30 text-white'}`}>
                  {i < step ? <FaCheckCircle size={14} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-green-400' : 'bg-white/30'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-blue-100 text-xs mt-3 font-medium tracking-wide uppercase">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <InputField label="Full Name" name="name" icon={FaUser} value={form.name} onChange={handleChange} error={errors.name} />
              <InputField label="Email Address" name="email" icon={FaEnvelope} type="email" value={form.email} onChange={handleChange} error={errors.email} />
              <InputField label="Phone Number" name="phone" icon={FaPhone} value={form.phone} onChange={handleChange} error={errors.phone} maxLength={10} />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Password" name="password" icon={FaLock} type="password" value={form.password} onChange={handleChange} error={errors.password} />
                <InputField label="Confirm Password" name="confirmPassword" icon={FaLock} type="password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Aadhar Number" name="aadharNumber" icon={FaShieldAlt} value={form.aadharNumber} onChange={handleChange} error={errors.aadharNumber} maxLength={12} />
                <InputField label="PAN Number" name="panNumber" icon={FaIdCard} value={form.panNumber} onChange={handleChange} error={errors.panNumber} maxLength={10} />
              </div>
              <InputField 
                ref={addressRef}
                label="Home Address" 
                name="address" 
                icon={FaMapMarkerAlt} 
                value={form.address} 
                onChange={handleChange} 
                error={errors.address} 
                placeholder="Type your address..."
              />
              <div className="grid grid-cols-3 gap-3">
                <InputField label="City" name="city" value={form.city} onChange={handleChange} error={errors.city} />
                <InputField label="State" name="state" value={form.state} onChange={handleChange} error={errors.state} />
                <InputField label="Pincode" name="pincode" value={form.pincode} onChange={handleChange} error={errors.pincode} maxLength={6} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <InputField label="Bank Name" name="bankName" icon={FaUniversity} value={form.bankName} onChange={handleChange} error={errors.bankName} />
              <InputField label="Account Holder Name" name="accountHolderName" icon={FaUser} value={form.accountHolderName} onChange={handleChange} error={errors.accountHolderName} />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Account Number" name="accountNumber" value={form.accountNumber} onChange={handleChange} error={errors.accountNumber} />
                <InputField label="IFSC Code" name="ifscCode" value={form.ifscCode} onChange={handleChange} error={errors.ifscCode} maxLength={11} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-4 text-sm text-blue-800">
                Please upload clear, readable images of your documents to avoid rejection.
              </div>
              <FileUpload label="Profile Photo" name="image" value={form.image} onChange={handleChange} error={errors.image} />
              <div className="grid grid-cols-2 gap-4">
                <FileUpload label="Aadhar Card" name="aadhar" value={form.aadhar} onChange={handleChange} error={errors.aadhar} />
                <FileUpload label="PAN Card" name="pan" value={form.pan} onChange={handleChange} error={errors.pan} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 mt-4">
          {step > 0 && (
            <button onClick={back} className="flex-1 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors">
              <FaArrowLeft size={12} /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-sm">
              Next <FaArrowRight size={12} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all shadow-md disabled:opacity-50">
              {loading ? 'Processing...' : 'Submit Application'}
            </button>
          )}
        </div>

        {step === 0 && (
          <div className="px-6 pb-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/agent/login" className="text-blue-600 font-bold hover:underline transition-all">
                Login here
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
