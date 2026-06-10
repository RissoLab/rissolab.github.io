"use client";

import config from "@/config/config.json";
import { markdownify } from "@/lib/utils/textConverter";
import React, { useEffect, useState } from "react";

const { enable, content, expire_days } = config.announcement;

const Cookies = {
  set: (name: string, value: string, options: any = {}) => {
    if (typeof document === "undefined") return;

    const defaults = { path: "/" };
    const opts = { ...defaults, ...options };

    if (typeof opts.expires === "number") {
      opts.expires = new Date(Date.now() + opts.expires * 864e5);
    }
    if (opts.expires instanceof Date) {
      opts.expires = opts.expires.toUTCString();
    }

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    for (const key in opts) {
      if (!opts[key]) continue;
      cookieString += `; ${key}`;
      if (opts[key] !== true) {
        cookieString += `=${opts[key]}`;
      }
    }

    document.cookie = cookieString;
  },

  get: (name: string): string | null => {
    if (typeof document === "undefined") return null;

    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
      const [key, value] = cookie.split("=");
      if (decodeURIComponent(key) === name) {
        return decodeURIComponent(value);
      }
    }
    return null;
  },

  remove: (name: string, options: any = {}) => {
    Cookies.set(name, "", { ...options, expires: -1 });
  },
};

const Announcement: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = setTimeout(() => {
      if (enable && content && !Cookies.get("announcement-close")) {
        setIsVisible(true);
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const handleClose = () => {
    Cookies.set("announcement-close", "true", {
      expires: expire_days,
    });
    setIsVisible(false);
  };

  if (!enable || !content || !isVisible) {
    return null;
  }

  return (
    <div className="relative z-999 border-b border-white/60 bg-white/50 px-4 py-4 pr-12 shadow-sm backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-darkmode-body/50 md:text-lg">
      <p dangerouslySetInnerHTML={markdownify(content)} />
      <button
        onClick={handleClose}
        className="absolute top-1/2 right-4 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/70 bg-white/40 text-xl transition-colors duration-200 hover:bg-white/80 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
        aria-label="Close announcement"
      >
        &times;
      </button>
    </div>
  );
};

export default Announcement;
