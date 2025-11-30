import React, { useState, ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  variant?: 'line' | 'enclosed' | 'pills';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  variant = 'line',
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const variantStyles = {
    line: {
      container: 'border-b border-gray-200',
      tab: 'border-b-2 border-transparent hover:text-primary-600',
      active: 'border-primary-500 text-primary-600',
    },
    enclosed: {
      container: 'bg-gray-100 rounded-lg p-1',
      tab: 'rounded-md hover:bg-white',
      active: 'bg-white text-primary-600 shadow-sm',
    },
    pills: {
      container: 'space-x-2',
      tab: 'rounded-full hover:bg-gray-100',
      active: 'bg-primary-500 text-white',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={className}>
      <div className={`flex ${styles.container}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-2 font-medium text-sm transition-colors
              ${styles.tab}
              ${activeTab === tab.id ? styles.active : 'text-gray-600'}
            `}
          >
            <div className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-4">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

