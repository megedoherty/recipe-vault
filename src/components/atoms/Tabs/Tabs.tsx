'use client';

import { KeyboardEvent, ReactNode, useId, useRef, useState } from 'react';

import styles from './Tabs.module.css';

interface TabsProps {
  label: string;
  tabs: readonly { id: string; label: string; content: ReactNode }[];
  defaultTabId?: string;
}

export default function Tabs({ label, tabs, defaultTabId }: TabsProps) {
  const [selectedId, setSelectedId] = useState(defaultTabId ?? tabs[0].id);
  const active = tabs.find((tab) => tab.id === selectedId) ?? tabs[0];
  const id = useId();
  const getTabId = (tabId: string) => `${id}-tab-${tabId}`;
  const getTabPanelId = (tabId: string) => `${id}-panel-${tabId}`;
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    const lastIndex = tabs.length - 1;
    const nextIndex = {
      ArrowRight: index === lastIndex ? 0 : index + 1,
      ArrowLeft: index === 0 ? lastIndex : index - 1,
      Home: 0,
      End: lastIndex,
    }[e.key];

    if (nextIndex === undefined) {
      return;
    }

    e.preventDefault();
    const next = tabs[nextIndex];
    setSelectedId(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <>
      <div role="tablist" aria-label={label} className={styles.tabList}>
        {tabs.map((tab, index) => {
          const isActive = tab.id === active.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              type="button"
              role="tab"
              id={getTabId(tab.id)}
              aria-selected={isActive}
              aria-controls={getTabPanelId(tab.id)}
              tabIndex={isActive ? 0 : -1}
              className={styles.tab}
              onClick={() => setSelectedId(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        key={active.id} // remount so state isn't shared between tabs rendering the same component
        role="tabpanel"
        id={getTabPanelId(active.id)}
        aria-labelledby={getTabId(active.id)}
      >
        {active.content}
      </div>
    </>
  );
}
