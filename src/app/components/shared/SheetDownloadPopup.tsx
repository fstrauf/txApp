"use client";
import { useState, Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";

export default function SheetDownloadPopup({
  isOpen,
  setIsOpen,
  templateSpreadsheetId,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  templateSpreadsheetId?: string;
}) {
  const [email, setEmail] = useState("");
  const [subscribe, setSubscribe] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const posthog = usePostHog();

  useEffect(() => {
    if (isOpen) {
      posthog?.capture("sheet_download_popup_opened");
    }
  }, [isOpen, posthog]);

  const spreadsheetId =
    templateSpreadsheetId || "1zwvIEWCynocHpl3WGN7FToHsUuNaYStKjcZwh9ivAx4";
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing`;

  const handleSubmit = async () => {
    if (email && subscribe) {
      setIsLoading(true);
      setError("");
      try {
        posthog?.capture("sheet_download_email_submitted", { email });
        const response = await fetch("/api/createEmailContact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            source: "SPREADSHEET_POPUP",
            tags: ["spreadsheet-user-popup"],
          }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to subscribe.");
        }
      } catch (error: any) {
        setError(error.message);
        setIsLoading(false);
        return; // Stop execution if email submission fails
      }
      setIsLoading(false);
    }

    posthog?.capture("sheet_download_completed", {
      email_provided: !!(email && subscribe),
    });
    // Redirect to spreadsheet
    window.open(spreadsheetUrl, "_blank");
    setSubmitted(true);
    setIsOpen(false);
  };

  const handleSkip = () => {
    posthog?.capture("sheet_download_email_skipped");
    posthog?.capture("sheet_download_completed", { email_provided: false });
    window.open(spreadsheetUrl, "_blank");
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Get the Financial Freedom Spreadsheet
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Enter your email to get updates to the spreadsheet. Or, get it directly.
                  </p>
                </div>

                <div className="mt-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email (optional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="mt-4 flex items-center">
                  <input
                    id="subscribe"
                    type="checkbox"
                    checked={subscribe}
                    onChange={(e) => setSubscribe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="subscribe" className="ml-2 block text-sm text-gray-900">
                    Subscribe for updates and improvements.
                  </label>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                <div className="mt-6 space-y-2">
                   <Button
                      className="w-full"
                      onClick={handleSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Get the Spreadsheet"}
                    </Button>
                    <Button
                        className="w-full bg-transparent text-primary hover:bg-transparent hover:underline"
                        onClick={handleSkip}
                    >
                        No thanks, take me to the sheet
                    </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 