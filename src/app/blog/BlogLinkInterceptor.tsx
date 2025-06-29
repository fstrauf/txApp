"use client";

import { useState, useEffect } from "react";
import SheetDownloadPopup from "@/app/components/shared/SheetDownloadPopup";

export default function BlogLinkInterceptor({
  templateSpreadsheetId,
}: {
  templateSpreadsheetId?: string;
}) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href="/fuck-you-money-sheet"]');
      if (link) {
        e.preventDefault();
        setIsPopupOpen(true);
      }
    };

    // Find all links in the blog content
    const content = document.querySelector(".blog-content");
    if (content) {
      // Use event delegation on the content container
      content.addEventListener("click", handleLinkClick as EventListener);

      return () => {
        content.removeEventListener("click", handleLinkClick as EventListener);
      };
    }
  }, []);

  return (
    <SheetDownloadPopup
      isOpen={isPopupOpen}
      setIsOpen={setIsPopupOpen}
      templateSpreadsheetId={templateSpreadsheetId}
    />
  );
} 