"use client" 

import React, { Children, isValidElement, useRef } from 'react';
import clsx from 'clsx';
import { motion, useScroll, useTransform } from 'framer-motion';

interface StickyTabItemProps {
  title: string;
  id: string | number;
  children: React.ReactNode;
}

const StickyTabItem: React.FC<StickyTabItemProps> = () => {
  return null;
};

interface StickyTabsProps {
  children: React.ReactNode;
  mainNavHeight?: string;
  rootClassName?: string;
  navSpacerClassName?: string;
  sectionClassName?: string;
  stickyHeaderContainerClassName?: string;
  headerContentWrapperClassName?: string;
  headerContentLayoutClassName?: string;
  titleClassName?: string;
  contentLayoutClassName?: string;
}

const StickyTabs: React.FC<StickyTabsProps> & { Item: React.FC<StickyTabItemProps> } = ({
  children,
  mainNavHeight = '4rem',
  rootClassName = "bg-transparent",
  navSpacerClassName = "backdrop-blur-md",
  sectionClassName = "bg-transparent",
  stickyHeaderContainerClassName = "",
  headerContentWrapperClassName = "backdrop-blur-xl",
  headerContentLayoutClassName = "mx-auto max-w-6xl px-6 py-6 sm:px-8",
  titleClassName = "text-xl md:text-3xl font-bold tracking-tight",
  contentLayoutClassName = "mx-auto max-w-6xl px-6 py-24 sm:px-8",
}) => {
  const stickyTopValue = `calc(${mainNavHeight} - 1px)`;
  const navHeightStyle = { height: mainNavHeight };
  const stickyHeaderStyle = { top: stickyTopValue };

  return (
    <div className={clsx("relative w-full", rootClassName)}>
      {/* Initial Spacer to account for fixed main nav */}
      <div
        className={clsx(
          "sticky left-0 top-0 z-30 w-full",
          navSpacerClassName
        )}
        style={{ ...navHeightStyle, backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)", borderBottom: "1px solid var(--border)" }}
        aria-hidden="true"
      />

      {Children.map(children, (child, index) => {
        if (!isValidElement(child) || child.type !== StickyTabItem) {
          return null;
        }

        const itemElement = child as React.ReactElement<StickyTabItemProps>;
        const { title, id, children: itemContent } = itemElement.props;

        return (
          <StickySection
            key={id}
            title={title}
            stickyHeaderStyle={stickyHeaderStyle}
            sectionClassName={sectionClassName}
            stickyHeaderContainerClassName={stickyHeaderContainerClassName}
            headerContentWrapperClassName={headerContentWrapperClassName}
            headerContentLayoutClassName={headerContentLayoutClassName}
            titleClassName={titleClassName}
            contentLayoutClassName={contentLayoutClassName}
            index={index}
          >
            {itemContent}
          </StickySection>
        );
      })}
    </div>
  );
};

interface StickySectionProps {
  title: string;
  children: React.ReactNode;
  stickyHeaderStyle: React.CSSProperties;
  sectionClassName?: string;
  stickyHeaderContainerClassName?: string;
  headerContentWrapperClassName?: string;
  headerContentLayoutClassName?: string;
  titleClassName?: string;
  contentLayoutClassName?: string;
  index: number;
}

const StickySection: React.FC<StickySectionProps> = ({
  title,
  children,
  stickyHeaderStyle,
  sectionClassName,
  stickyHeaderContainerClassName,
  headerContentWrapperClassName,
  headerContentLayoutClassName,
  titleClassName,
  contentLayoutClassName,
  index
}) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Scrolling effects
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.3, 1, 1, 0.3]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.95, 1, 1, 0.95]);
  const titleX = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [-15, 0, 0, 15]);
  const progressWidth = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"]);

  return (
    <section
      ref={ref}
      className={clsx(
        "relative min-h-[70vh] overflow-visible pb-12",
        sectionClassName
      )}
    >
      <motion.div
        className={clsx(
          "sticky z-20 -mt-px flex flex-col",
          stickyHeaderContainerClassName
        )}
        style={{ ...stickyHeaderStyle }}
      >
        <div 
          className={clsx(headerContentWrapperClassName, "relative border-y")}
          style={{ 
            borderColor: "var(--border)", 
            backgroundColor: "color-mix(in srgb, var(--background) 90%, transparent)" 
          }}
        >
          {/* Section Progress Bar */}
          <motion.div 
            style={{ width: progressWidth, backgroundColor: "var(--theme-accent)" }}
            className="absolute bottom-0 left-0 h-[2px] z-30"
          />
          
          <div className={clsx(headerContentLayoutClassName)}>
            <div className="flex items-center justify-between">
              <motion.h2 
                style={{ x: titleX, color: "var(--text-heading)" }}
                className={clsx(titleClassName)}
              >
                <span className="mr-4 opacity-20 text-2xl font-mono align-middle" style={{ color: "var(--foreground)" }}>0{index + 1}</span>
                {title}
              </motion.h2>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        style={{ opacity, scale }}
        className={clsx("relative z-10", contentLayoutClassName)}
      >
        {children}
      </motion.div>
      
      {/* Decorative separator matching other sections' subtle dividers */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-[1px] opacity-30" 
        style={{ background: "linear-gradient(to right, transparent, var(--border), transparent)" }}
      />
    </section>
  );
};

StickyTabs.Item = StickyTabItem;

export default StickyTabs;
