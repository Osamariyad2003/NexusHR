import React, { useState } from 'react';
import {
  Search,
  User,
  HelpCircle,
  CreditCard,
  ClipboardList,
  Command,
  PhoneCall,
  DollarSign,
  Newspaper,
  Settings,
  ChevronRight,
  ChevronLeft,
  Calendar,
  ThumbsUp,
  Info,
  Lock,
  Mail,
  MessageSquare,
  FileText,
  ExternalLink
} from 'lucide-react';
import { SHORTCUTS } from '../../utils/keyboardShortcuts';

export default function HelpCenterManagerView() {
  // Navigation sub-view state: 'catalog' | 'faq' | 'privacy' | 'shortcuts' | 'support' | 'profile' | 'checklists' | 'pricing' | 'news' | 'integrations'
  const [subView, setSubView] = useState('catalog');
  const [searchQuery, setSearchQuery] = useState('');

  // Helpful thumbs up votes state
  const [votes, setVotes] = useState({
    q1: 30,
    q2: 44,
    q3: 52,
    q4: 28,
  });

  const handleVote = (qId) => {
    setVotes((prev) => ({ ...prev, [qId]: prev[qId] + 1 }));
  };

  // Category Cards List matching Screen 131
  const categories = [
    {
      id: 'get-started',
      view: 'faq',
      title: 'Get Started',
      description: 'Learn your way around NexusHR',
      icon: User,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      id: 'faq',
      view: 'faq',
      title: 'FAQ',
      description: 'Frequently Asked Questions',
      icon: HelpCircle,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      id: 'employee-profile',
      view: 'faq',
      title: 'Employee Profile',
      description: 'Instructions for employees',
      icon: CreditCard,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      id: 'checklists',
      view: 'faq',
      title: 'Checklists - On/offboarding',
      description: 'Instructions for employees',
      icon: ClipboardList,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      id: 'keyboard-shortcut',
      view: 'shortcuts',
      title: 'Keyboard Shortcut',
      description: 'Instructions for employees',
      icon: Command,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      id: 'contact-support',
      view: 'support',
      title: 'Contact Support',
      description: 'Get support if you having trouble',
      icon: PhoneCall,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      id: 'pricing-plan',
      view: 'privacy',
      title: 'Pricing Plan',
      description: 'Information about pricing plan',
      icon: DollarSign,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      id: 'company-news',
      view: 'faq',
      title: 'Company News',
      description: 'Latest news about unpixel studio',
      icon: Newspaper,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      id: 'integrations',
      view: 'privacy',
      title: 'Integrations',
      description: 'Setting integration third party',
      icon: Settings,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
  ];

  // Keyboard Shortcuts List matching Screen 134
  // Same list the global key handler uses, so the table always matches what works
  const shortcuts = SHORTCUTS;

  const filteredCategories = categories.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* SCREEN 131: HELP CENTER OVERVIEW CATALOG */}
      {subView === 'catalog' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Help Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                What can we help you with?
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search what you need"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
          </div>

          {/* Quick Footer Links Banner */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500 border-b border-slate-200 pb-3">
            <button onClick={() => setSubView('privacy')} className="hover:text-emerald-600 transition-colors">
              Privacy Policy
            </button>
            <span>•</span>
            <button onClick={() => setSubView('shortcuts')} className="hover:text-emerald-600 transition-colors">
              Keyboard Shortcuts
            </button>
            <span>•</span>
            <button onClick={() => setSubView('support')} className="hover:text-emerald-600 transition-colors">
              Customer Support
            </button>
          </div>

          {/* 3x3 Grid matching Screen 131 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => setSubView(item.view)}
                  className="p-6 rounded-3xl border border-slate-200/80 bg-white hover:border-emerald-500/60 hover:shadow-card transition-all cursor-pointer group space-y-4"
                >
                  <div className={`w-10 h-10 rounded-2xl ${item.iconBg} border flex items-center justify-center shrink-0 shadow-xs`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-sm tracking-tight group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SCREEN 132: HELP CENTER - FAQ */}
      {subView === 'faq' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
                <button onClick={() => setSubView('catalog')} className="hover:text-slate-700">
                  Help Center
                </button>
                <span>&gt;</span>
                <span className="text-slate-700 font-bold">FAQ's</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Frequently Asked Questions <Info className="w-5 h-5 text-slate-400" />
              </h1>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search what you need"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
          </div>

          <div className="space-y-4">
            {/* FAQ Item 1 */}
            <div className="p-6 sm:p-8 rounded-3xl border border-slate-200/80 bg-white space-y-4 shadow-card">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                What is an HR management platform?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                An HR management platform is a software solution designed to streamline and automate various HR-related tasks such as payroll processing, employee record keeping, benefits administration, and performance management.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Updated over a week ago</span>
                </div>
                <button
                  onClick={() => handleVote('q1')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 font-bold transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{votes.q1}</span>
                </button>
              </div>
            </div>

            {/* FAQ Item 2 */}
            <div className="p-6 sm:p-8 rounded-3xl border border-slate-200/80 bg-white space-y-4 shadow-card">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                What are the benefits of using an HR management platform?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                Using an HR management platform can help save time, reduce errors, and improve efficiency in HR operations. It can also improve communication between employees and HR, enhance compliance with regulations, and provide insights into HR metrics.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Updated over a week ago</span>
                </div>
                <button
                  onClick={() => handleVote('q2')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 font-bold transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{votes.q2}</span>
                </button>
              </div>
            </div>

            {/* FAQ Item 3 */}
            <div className="p-6 sm:p-8 rounded-3xl border border-slate-200/80 bg-white space-y-4 shadow-card">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                How do I choose the right HR management platform for my organization?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                When choosing an HR management platform, consider your organization's specific needs, budget, and goals. Evaluate different platforms based on features, ease of use, customer support, security, and integration with other systems.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Updated over a week ago</span>
                </div>
                <button
                  onClick={() => handleVote('q3')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 font-bold transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{votes.q3}</span>
                </button>
              </div>
            </div>

            {/* FAQ Item 4 */}
            <div className="p-6 sm:p-8 rounded-3xl border border-slate-200/80 bg-white space-y-4 shadow-card">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                How do I implement an HR management platform?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                Implementing an HR management platform typically involves setting up the software, configuring settings, migrating data, and training employees. The implementation timeline and process may vary depending on the platform and vendor.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Updated over a week ago</span>
                </div>
                <button
                  onClick={() => handleVote('q4')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 font-bold transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{votes.q4}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 133: HELP CENTER - PRIVACY POLICY */}
      {subView === 'privacy' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
                <button onClick={() => setSubView('catalog')} className="hover:text-slate-700">
                  Help Center
                </button>
                <span>&gt;</span>
                <span className="text-slate-700 font-bold">Privacy Policy</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Privacy Policy <Info className="w-5 h-5 text-slate-400" />
              </h1>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search what you need"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-slate-200/80 bg-white space-y-6 shadow-card max-w-5xl">
            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Introduction</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                NexusHR is committed to protecting your privacy and the confidentiality of your personal information. This Privacy Policy describes how we collect, use, and disclose your personal information in connection with our HR management platform, NexusHR. By using NexusHR, you consent to the collection, use, and disclosure of your personal information in accordance with this Privacy Policy.
              </p>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-5">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Collection and Use of Personal Information</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We collect personal information from you when you use NexusHR, such as your name, contact information, employment history, and other HR-related data. We use this information to provide you with our HR management services, including payroll processing, benefits administration, employee record keeping, and performance management.
              </p>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-5">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Disclosure of Personal Information</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We may disclose your personal information to third-party service providers who assist us in providing our HR management services, such as payroll processors, benefits providers, and performance management software vendors. We may also disclose your personal information to comply with legal obligations, such as responding to subpoenas or court orders.
              </p>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-5">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Security</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We take reasonable steps to protect your personal information from unauthorized access, use, or disclosure. We use a variety of security measures, including encryption and firewalls, to safeguard your information. However, no data transmission over the Internet can be guaranteed to be 100% secure, and we cannot ensure or warrant the security of any information you transmit to us.
              </p>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-5">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Access and Correction of Personal Information</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You have the right to access and correct your personal information held by us. You can do so by logging into your account on NexusHR or by contacting us at the contact information provided below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 134: HELP CENTER - KEYBOARD SHORTCUT */}
      {subView === 'shortcuts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
                <button onClick={() => setSubView('catalog')} className="hover:text-slate-700">
                  Help Center
                </button>
                <span>&gt;</span>
                <span className="text-slate-700 font-bold">Keyboard Shortcut</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Keyboard Shortcut For NexusHR <Info className="w-5 h-5 text-slate-400" />
              </h1>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search what you need"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-slate-200/80 bg-white space-y-6 shadow-card max-w-5xl">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                A list of Keyboard Shortcuts to help you navigate NexusHR quicker
              </h2>
              <p className="text-xs text-slate-500">
                Here are {shortcuts.length} keyboard shortcuts that you can use on NexusHR to save your time.
              </p>
            </div>

            {/* Table matching Screen 134 */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Shortcuts Key on Windows</th>
                    <th className="py-3.5 px-6">Shortcuts Key on MacOS</th>
                    <th className="py-3.5 px-6">Header title</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {shortcuts.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-800">
                        <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700">
                          {row.win}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-800">
                        <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700">
                          {row.mac}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-700 font-semibold">
                        {row.title}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs font-bold text-slate-500 pt-2">
              Note : Shortcuts work on any page once you are signed in.
            </p>
          </div>
        </div>
      )}

      {/* SCREEN 135: HELP CENTER - CONTACT SUPPORT */}
      {subView === 'support' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
                <button onClick={() => setSubView('catalog')} className="hover:text-slate-700">
                  Help Center
                </button>
                <span>&gt;</span>
                <span className="text-slate-700 font-bold">Contact Support</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Customer Contact Support <Info className="w-5 h-5 text-slate-400" />
              </h1>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search what you need"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-slate-200/80 bg-white space-y-6 shadow-card max-w-5xl">
            <p className="text-xs text-slate-600 font-medium">
              If you have any trouble getting started or during usage, please reach out to us using the following support channels.
            </p>

            <div className="space-y-2 border-t border-slate-100 pt-5">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Intercom Live Chat System</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Please describe your problems in the Live Chat, our chat specialists will answer your questions. We work from 9:00 to 18:00 (GMT +7), Monday to Friday. You are welcome to leave us messages if our specialists are not online.
              </p>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-5">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Submit a Ticket</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Send your concerns or question in the email <a href="mailto:contact@nexushr.com" className="text-emerald-600 font-bold hover:underline">contact@nexushr.com</a>, our Customer Support team will get back to you as soon as possible.
              </p>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-800">Relate :</h3>
              <div className="space-y-2 text-xs font-semibold text-emerald-600">
                <p className="hover:underline cursor-pointer flex items-center gap-1">
                  <span>Complete Guide to Set up NexusHR</span>
                </p>
                <p className="hover:underline cursor-pointer">Company Domain</p>
                <p className="hover:underline cursor-pointer">Activate Account</p>
                <p className="hover:underline cursor-pointer">About NexusHR</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
