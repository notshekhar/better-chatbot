"use client";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { useTheme } from "next-themes";
import { Fragment, useLayoutEffect, useState } from "react";
import type { JSX, ReactNode } from "react";
import { codeToHast } from "shiki/bundle/web";
import { safe } from "ts-safe";
import { jsx, jsxs } from "react/jsx-runtime";
import { cn } from "lib/utils";

export function CodeBlock({
  code,
  lang,
  fallback,
  className,
}: { code?: string; lang: string; fallback?: ReactNode; className?: string }) {
  const { theme } = useTheme();

  const [component, setComponent] = useState<JSX.Element | null>(null);

  useLayoutEffect(() => {
    safe()
      .map(async () => {
        const out = await codeToHast(code || "", {
          lang: lang,
          theme: theme == "dark" ? "dark-plus" : "github-light",
        });
        return toJsxRuntime(out, {
          Fragment,
          jsx,
          jsxs,
          components: {
            pre: (props) => (
              <pre
                {...props}
                lang={lang}
                style={undefined}
                className={cn(props.className, "text-xs", className)}
              >
                {props.children}
              </pre>
            ),
          },
        }) as JSX.Element;
      })
      .ifOk(setComponent);
  }, [theme, lang, code]);

  if (!code) return fallback;

  return component ?? fallback;
}
