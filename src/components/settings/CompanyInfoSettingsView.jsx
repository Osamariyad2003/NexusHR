import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

// The company profile stored on the server (tenant info); HR can edit it
export default function CompanyInfoSettingsView() {
  const { showToast } = useApp();

  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [overview, setOverview] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTenantInfo()
      .then((info) => {
        setCompanyName(info?.name || '');
        setWebsite(info?.website || '');
        setCountryCode(info?.phone_country_code || '+1');
        setPhone(info?.phone || '');
        setEmail(info?.support_email || '');
        setOverview(info?.overview || '');
        setLoaded(true);
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.updateTenantInfo({
        name: companyName.trim(),
        website: website.trim(),
        phone_country_code: countryCode,
        phone: phone.trim(),
        support_email: email.trim(),
        overview: overview.trim()
      });
      showToast('Company info saved.', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card space-y-6 font-sans">
      <h2 className="text-xl font-black text-slate-900">
        Company Info
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Name & Website */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Company Website <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                required
              />
              <Check className="w-4 h-4 text-emerald-600 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Contact Number <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-hidden"
              >
                <option value="+62">+62</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
              </select>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Contact Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* Company Overview */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Company Overview
          </label>
          <textarea
            rows={5}
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            className="w-full p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Submit */}
        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!loaded || saving}
            className="px-8 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
