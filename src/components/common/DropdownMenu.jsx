import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * A button that opens a menu of actions. Closes on outside click, Escape, or after choosing.
 *   <DropdownMenu label={<>Action <ChevronDown/></>} items={[{ label: 'Edit', onSelect }, { divider: true }, { label: 'Delete', danger: true, onSelect }]} />
 * Items may set `disabled` and `hint` (shown as a tooltip).
 * `side` opens the menu beside the button instead of below it, drawn over the page so a scrolling
 * parent (like the collapsed sidebar) can't clip it.
 */
export default function DropdownMenu({ label, items, buttonClassName = '', menuClassName = '', align = 'left', side = false, ariaLabel, title }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const root = useRef(null);
  const menu = useRef(null);

  const toggle = () => {
    if (side && !open) {
      const r = root.current.getBoundingClientRect();
      setPos({ top: r.top, left: r.right + 8 });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!root.current?.contains(e.target) && !menu.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); root.current?.querySelector('button')?.focus(); } };
    // A side menu is placed once, so close it rather than leave it behind when the page moves
    const onMove = (e) => { if (!menu.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    if (side) { window.addEventListener('scroll', onMove, true); window.addEventListener('resize', onMove); }
    menu.current?.querySelector('[role="menuitem"]:not([disabled])')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open, side]);

  // Arrow keys move between items
  const onMenuKey = (e) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const list = [...menu.current.querySelectorAll('[role="menuitem"]:not([disabled])')];
    const at = list.indexOf(document.activeElement);
    list[(at + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length]?.focus();
  };

  const list = (
    <div
      ref={menu}
      role="menu"
      onKeyDown={onMenuKey}
      style={side && pos ? { top: pos.top, left: pos.left } : undefined}
      className={`min-w-[12rem] rounded-xl border border-slate-200 bg-white py-1 shadow-xl ${
        side ? 'fixed z-50' : `absolute z-30 mt-2 ${align === 'right' ? 'right-0' : 'left-0'}`
      } ${menuClassName}`}
    >
      {items.filter(Boolean).map((item, i) => (item.divider ? (
        <div key={`d${i}`} className="my-1 border-t border-slate-100" />
      ) : (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          title={item.hint}
          onClick={() => { setOpen(false); item.onSelect(); }}
          className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:bg-slate-50 ${
            item.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      )))}
    </div>
  );

  return (
    <div ref={root} className="relative inline-block w-full">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={ariaLabel} title={title} onClick={toggle} className={buttonClassName}>
        {label}
      </button>
      {open && (side ? createPortal(list, document.body) : list)}
    </div>
  );
}
