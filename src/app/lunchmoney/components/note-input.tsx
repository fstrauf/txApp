'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Transaction } from './types';

type NoteInputProps = {
  transaction: Transaction;
  handleNoteChange: (transactionId: string, newNote: string) => Promise<void>;
  updatingNoteId: string | null;
};

const NoteInput = ({ transaction, handleNoteChange, updatingNoteId }: NoteInputProps) => {
  const [note, setNote] = useState(transaction.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialNote = transaction.notes || ''; // Store initial note

  // Keep local state in sync if the transaction prop updates from parent
  useEffect(() => {
    // Only update if the external note changes AND we are not currently saving
    // This prevents overwriting user input during save or if save fails
    if (transaction.notes !== note && !isSaving) {
      setNote(transaction.notes || '');
    }
    // Intentionally excluding `note` from dependencies to avoid loop on local typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction.notes, isSaving]);

  const triggerSave = useCallback(async () => {
    // Prevent concurrent saves
    if (isSaving) {
      console.log("Save trigger skipped: Already saving.");
      return;
    }

    // Only save if the note has actually changed
    if (note === initialNote) {
      console.log("Note unchanged, skipping save.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await handleNoteChange(transaction.lunchMoneyId, note);
      // Success! The parent component (TransactionList) will update the transaction state
      // which will flow back down via props. We don't need to setNote here.
      console.log(`Note saved successfully for tx ${transaction.lunchMoneyId}`);
    } catch (err) {
      console.error('Error saving note:', err);
      setError(err instanceof Error ? err.message : 'Failed to save note');
      // Optional: Revert local state on error? Or keep user's input?
      // setNote(initialNote); // Option to revert
    } finally {
      setIsSaving(false);
    }
  }, [note, initialNote, handleNoteChange, transaction.lunchMoneyId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission if wrapped in form
      triggerSave();
      (e.target as HTMLInputElement).blur(); // Remove focus after Enter
    } else if (e.key === 'Escape') {
      // Optional: Revert changes on Escape
      setNote(initialNote);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleBlur = () => {
    // No need for the check here anymore, triggerSave handles concurrency
    triggerSave();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value);
    // Clear error on typing
    if (error) setError(null);
  };

  const isCurrentlyUpdating = updatingNoteId === transaction.lunchMoneyId || isSaving;

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={note}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Add a note..."
        disabled={isCurrentlyUpdating}
        className={`w-full px-2 py-1 text-sm border rounded-md shadow-sm focus:ring-primary focus:border-primary transition-colors duration-150 ${
          isCurrentlyUpdating
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400 focus:border-primary focus:ring-1 focus:ring-primary'
        } ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
        aria-label={`Note for transaction ${transaction.description}`}
      />
      {isCurrentlyUpdating && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

export default NoteInput; 