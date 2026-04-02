"use client";

import { useState } from "react";
import { ALL_STATUSES, tourStatusLabel, tourStatusColor, tourStatusIcon } from "@/lib/utils";

interface StatusPickerProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  disabled?: boolean;
}

export default function StatusPicker({ currentStatus, onStatusChange, disabled }: StatusPickerProps) {
  const [open, setOpen] = useState(false);

  function handleSelect(status: string) {
    if (status !== currentStatus) {
      onStatusChange(status);
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setOpen(!open)}
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all active:scale-95 ${tourStatusColor(currentStatus)} ${disabled ? "opacity-50" : ""}`}
      >
        {tourStatusLabel(currentStatus)}
        {!disabled && (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-sand-200 p-4 pb-8 animate-in slide-in-from-bottom">
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
        </>
      )}
    </div>
  );
}
