"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ALL_STATUSES, tourStatusLabel, tourStatusColor, tourStatusIcon } from "@/lib/utils";

interface StatusPickerProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  disabled?: boolean;
}

export default function StatusPicker({ currentStatus, onStatusChange, disabled }: StatusPickerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function handleOpen(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setOpen(true);
  }

  function handleSelect(status: string) {
    if (status !== currentStatus) {
      onStatusChange(status);
    }
    setOpen(false);
  }

  function handleBackdropClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
  }

  const sheet = open && mounted ? createPortal(
    <div className="status-picker-overlay" onClick={handleBackdropClick}>
      <div className="status-picker-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-sand-200 rounded-full mx-auto mb-4" />
        <h3 className="font-semibold text-foreground text-center mb-4">Update Status</h3>
        <div className="grid grid-cols-2 gap-2">
          {ALL_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => handleSelect(status)}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                status === currentStatus
                  ? tourStatusColor(status) + " ring-2 ring-offset-1 ring-current"
                  : "bg-sand-50 text-sand-500 hover:bg-sand-100"
              }`}
            >
              <span>{tourStatusIcon(status)}</span>
              <span>{tourStatusLabel(status)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all active:scale-95 ${tourStatusColor(currentStatus)} ${disabled ? "opacity-50" : ""}`}
      >
        {tourStatusLabel(currentStatus)}
        {!disabled && (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      {sheet}
    </>
  );
}
