"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { GroupItem } from "./types";
import { GroupListItem } from "./GroupListItem";

interface SuggestedGroupsProps {
  items: GroupItem[];
  onGroupClick?: (group: GroupItem) => void;
}

/**
 * "Suggested Group" card shown below the main group list.
 * Matches the frosted neutral card styling in the design mockup.
 */
export function SuggestedGroups({ items, onGroupClick }: SuggestedGroupsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.35, ease: "easeOut" }}
      className="bg-[#d4d4d8]/85 dark:bg-zinc-800/80 backdrop-blur-md rounded-2xl border border-zinc-400/20 dark:border-zinc-700/40 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 pt-3.5 pb-2">
        <h3 className="text-[14.5px] font-medium text-zinc-900 dark:text-zinc-100 tracking-tight border-b-2 border-zinc-900 dark:border-zinc-100 pb-0.5 inline-block">
          Suggested Group
        </h3>
      </div>

      {/* List */}
      <div className="px-1.5 pb-2">
        {items.length > 0 ? (
          items.map((group, index) => (
            <GroupListItem
              key={group.id}
              group={group}
              onClick={onGroupClick}
              showDivider={index < items.length - 1}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
            <div className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-2">
              <Sparkles className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <p className="text-[12.5px] font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
              No suggestions yet.<br />
              Join more groups to get recommendations.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

