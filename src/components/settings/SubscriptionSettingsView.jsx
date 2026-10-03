import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ExternalLink, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-500 text-white',
  TRIALING: 'bg-sky-500 text-white',
  PAST_DUE: 'bg-amber-500 text-white',
  UNPAID: 'bg-rose-500 text-white',
  INCOMPLETE: 'bg-amber-500 text-white',
  CANCELED: 'bg-slate-400 text-white',
  NONE: 'bg-slate-200 text-slate-600'
};
const LIVE = ['ACTIVE', 'TRIALING', 'PAST_DUE', 'UNPAID', 'INCOMPLETE'];
const money = (amount, currency = 'USD') => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount ?? 0);
const day = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const humanize = (s) => String(s || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

/**
 * The company's NexusHR plan, billed through Stripe. Subscribing opens Stripe's hosted Checkout;
 * when Stripe sends the browser back, the server confirms the payment with Stripe before the plan
 * shows as active. Card changes and receipts live in Stripe's Billing Portal.
 */
export default function SubscriptionSettingsView() {
  const { showToast, employees } = useApp();
  const [activeTab, setActiveTab] = useState('plan');
  const [billing, setBilling] = useState(null);
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState(null);
  const [interval, setBillingInterval] = useState('MONTHLY');
  const [busy, setBusy] = useState(''); // what is in progress: a plan id, 'cancel', 'resume', 'portal', 'confirm'
  const [error, setError] = useState('');
  const handledReturn = useRef(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [b, p] = await Promise.all([api.getBilling(), api.getBillingPlans()]);
      setBilling(b);
      setPlans(p);
      if (b.interval) setBillingInterval(b.interval);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Back from Stripe Checkout (?billing=success&session_id=... or ?billing=cancelled)
  useEffect(() => {
    if (handledReturn.current) return;
    handledReturn.current = true;
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get('billing');
    const sessionId = params.get('session_id');
    const clearUrl = () => window.history.replaceState(null, '', window.location.pathname);
    if (outcome === 'success' && sessionId) {
      setBusy('confirm');
      api.confirmCheckout(sessionId)
        .then((res) => {
          if (res.confirmed) showToast(`You're subscribed to ${res.billing.plan_name}. Thank you!`, 'success');
          else showToast('Stripe has not confirmed the payment yet. This page will show the plan once it does.', 'info');
          setBilling((prev) => ({ ...prev, ...res.billing }));
        })
        .catch((err) => showToast(err.message, 'error'))
        .finally(() => { setBusy(''); clearUrl(); load(); });
    } else if (outcome === 'cancelled') {
      showToast('Checkout cancelled. Nothing was charged.', 'info');
      clearUrl();
    }
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (activeTab !== 'history') return;
    api.getInvoices().then(setInvoices, (err) => { setInvoices([]); showToast(err.message, 'error'); });
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasPlan = billing && LIVE.includes(billing.status);
  const people = (employees || []).filter((e) => e.status !== 'TERMINATED').length;

  const choosePlan = async (plan) => {
    setError('');
    if (hasPlan) {
      const price = interval === 'ANNUAL' ? plan.price_annual : plan.price_monthly;
      if (!window.confirm(`Switch to ${plan.name} (${money(price, plan.currency)} / ${interval === 'ANNUAL' ? 'year' : 'month'})? Stripe prorates the difference on your next invoice.`)) return;
      setBusy(plan.id);
      try {
        const res = await api.changePlan(plan.id, interval);
        setBilling(res.data);
        showToast(res.message, 'success');
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy('');
      }
      return;
    }
    setBusy(plan.id);
    try {
      const res = await api.startCheckout(plan.id, interval, `${window.location.origin}/`);
      window.location.assign(res.checkout_url); // Stripe's hosted payment page
    } catch (err) {
      setError(err.message);
      setBusy('');
    }
  };

  const setCancel = async (cancel) => {
    if (cancel && !window.confirm(`End the subscription on ${day(billing.current_period_end)}? You keep the plan until then and can resume before that date.`)) return;
    setBusy(cancel ? 'cancel' : 'resume');
    setError('');
    try {
      const res = cancel ? await api.cancelSubscription() : await api.resumeSubscription();
      setBilling(res.data);
      showToast(res.message, 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const openPortal = async () => {
    setBusy('portal');
    setError('');
    try {
      window.location.assign(await api.openBillingPortal(`${window.location.origin}/`));
    } catch (err) {
      setError(err.message);
      setBusy('');
    }
  };

  const tabButton = (id, label) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`pb-3 text-xs font-bold transition-all relative ${activeTab === id ? 'text-emerald-700 font-black' : 'text-slate-500 hover:text-slate-800'}`}
    >
      {label}
      {activeTab === id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />}
    </button>
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Subscription
          {billing?.mode === 'test' && <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">Stripe test mode</span>}
        </h2>
        {billing?.stripe_customer_id && (
          <button onClick={openPortal} disabled={busy === 'portal'} className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-60">
            {busy === 'portal' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Payment method & receipts
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      <div className="flex border-b border-slate-200/80 gap-6">
        {tabButton('plan', 'Plan')}
        {tabButton('history', 'Invoices')}
      </div>

      {error && (
        <p role="alert" className="text-xs font-semibold text-rose-600 flex items-start gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {activeTab === 'plan' && (
        <div className="space-y-6">
          {!billing && !error && <p className="text-xs text-slate-400">Loading your plan…</p>}
          {busy === 'confirm' && <p className="text-xs text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Confirming your payment with Stripe…</p>}

          {billing && !billing.configured && (
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-xs text-amber-900">
              Billing isn't set up on this server yet (the administrator needs to add the Stripe keys), so plans can't be bought here.
            </div>
          )}

          {billing && (
            <div data-testid="current-plan" className="p-6 rounded-2xl border border-slate-200/90 bg-white space-y-4 max-w-2xl">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="font-black text-base text-slate-900 tracking-tight">{billing.plan_name || 'No plan yet'}</span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[billing.status] || STATUS_STYLES.NONE}`}>
                  {billing.status === 'NONE' ? 'Not subscribed' : humanize(billing.status)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div><span className="text-slate-400 font-medium block">Current employees</span><span className="font-bold text-slate-800">{people}</span></div>
                {hasPlan && <div><span className="text-slate-400 font-medium block">Price</span><span className="font-bold text-slate-800">{money(billing.amount, billing.currency)} / {billing.interval === 'ANNUAL' ? 'year' : 'month'}</span></div>}
                {hasPlan && (
                  <div>
                    <span className="text-slate-400 font-medium block">{billing.cancel_at_period_end ? 'Ends on' : 'Renews on'}</span>
                    <span className="font-bold text-slate-800">{day(billing.current_period_end)}</span>
                  </div>
                )}
              </div>
              {billing.status === 'PAST_DUE' && <p className="text-xs font-semibold text-amber-700">The last payment failed. Update the card under "Payment method & receipts".</p>}
              {hasPlan && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {billing.cancel_at_period_end ? (
                    <button onClick={() => setCancel(false)} disabled={!!busy} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60">
                      {busy === 'resume' ? 'Resuming…' : 'Keep my subscription'}
                    </button>
                  ) : (
                    <button onClick={() => setCancel(true)} disabled={!!busy} className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-60">
                      {busy === 'cancel' ? 'Cancelling…' : 'Cancel subscription'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {billing?.configured && plans.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-sm font-black text-slate-900">{hasPlan ? 'Change plan' : 'Choose a plan'}</h3>
                <div role="group" aria-label="Billing interval" className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                  {[['MONTHLY', 'Monthly'], ['ANNUAL', 'Yearly']].map(([id, label]) => (
                    <button key={id} onClick={() => setBillingInterval(id)} aria-pressed={interval === id} className={`px-3 py-1.5 rounded-lg ${interval === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const price = interval === 'ANNUAL' ? plan.price_annual : plan.price_monthly;
                  const current = hasPlan && billing.plan_id === plan.id && billing.interval === interval;
                  const tooSmall = people > plan.employee_limit;
                  return (
                    <div key={plan.id} data-testid={`plan-${plan.id}`} className={`p-5 rounded-2xl border space-y-4 flex flex-col ${current ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'}`}>
                      <div>
                        <h4 className="font-black text-slate-900">{plan.name}</h4>
                        <p className="text-[11px] text-slate-400">Up to {plan.employee_limit.toLocaleString()} employees</p>
                      </div>
                      <p className="text-2xl font-black text-slate-900">{money(price, plan.currency)}<span className="text-xs font-bold text-slate-400"> / {interval === 'ANNUAL' ? 'year' : 'month'}</span></p>
                      <ul className="space-y-1.5 text-xs text-slate-600 flex-1">
                        {plan.features.map((f) => <li key={f} className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />{f}</li>)}
                      </ul>
                      <button
                        onClick={() => choosePlan(plan)}
                        disabled={current || tooSmall || !!busy}
                        title={tooSmall ? `Your company has ${people} people; this plan allows ${plan.employee_limit}.` : undefined}
                        className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 flex items-center justify-center gap-2"
                      >
                        {busy === plan.id && <Loader2 className="w-4 h-4 animate-spin" />}
                        {current ? 'Current plan' : tooSmall ? 'Too small for your team' : hasPlan ? 'Switch to this plan' : 'Subscribe'}
                      </button>
                    </div>
                  );
                })}
              </div>
              {!hasPlan && <p className="text-[11px] text-slate-400">You'll pay on Stripe's secure page; NexusHR never sees your card details.</p>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          {invoices === null && <p className="p-6 text-xs text-slate-400">Loading invoices…</p>}
          {invoices?.length === 0 && <p className="p-6 text-xs text-slate-500">No invoices yet. They appear here after the first payment.</p>}
          {invoices?.length > 0 && (
            <table className="w-full text-left border-collapse" data-testid="invoices">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-6">Invoice</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Period</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-4 px-6 font-bold text-slate-800 font-mono">{inv.number || inv.id}</td>
                    <td className="py-4 px-6 text-slate-600">{day(inv.created_at)}</td>
                    <td className="py-4 px-6 text-slate-600">{day(inv.period_start)} – {day(inv.period_end)}</td>
                    <td className="py-4 px-6 font-bold text-slate-800">{money(inv.status === 'PAID' ? inv.amount_paid : inv.amount_due, inv.currency)}</td>
                    <td className="py-4 px-6"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{humanize(inv.status)}</span></td>
                    <td className="py-4 px-6 text-right">
                      {inv.hosted_invoice_url && <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1">View <ExternalLink className="w-3 h-3" /></a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
