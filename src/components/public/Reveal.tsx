"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

// DESIGN.md › Motion: spring entrances that play once when scrolled into view.
// Content renders visible by default under reduced motion (fade only).
const SPRING = { type: "spring", stiffness: 420, damping: 26 } as const;

const item: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRING },
};
const itemReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
};

type Props = { children: React.ReactNode; className?: string; as?: "div" | "ul" | "ol" };

/** A list whose children pop in one after another (60ms stagger). */
export function RevealList({ children, className, as = "div" }: Props) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {children}
    </Tag>
  );
}

/** One child of a RevealList (or a standalone reveal when used alone). */
export function RevealItem({
  children,
  className,
  style,
  as = "div",
}: { children: React.ReactNode; className?: string; style?: React.CSSProperties; as?: "div" | "li" }) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag className={className} style={style} variants={reduce ? itemReduced : item}>
      {children}
    </Tag>
  );
}
