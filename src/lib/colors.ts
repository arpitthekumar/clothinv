export const tailwindColorMap: Record<
  string,
  { bg: string; text: string }
> = {
  
  white: { bg: "bg-white", text: "text-black" },
  black: { bg: "bg-black", text: "text-white" },

  slate: { bg: "bg-slate-500", text: "text-white" },
  gray: { bg: "bg-gray-500", text: "text-white" },
  zinc: { bg: "bg-zinc-500", text: "text-white" },
  neutral: { bg: "bg-neutral-500", text: "text-white" },
  stone: { bg: "bg-stone-500", text: "text-white" },

  red: { bg: "bg-red-500", text: "text-white" },
  orange: { bg: "bg-orange-500", text: "text-black" }, // bright
  amber: { bg: "bg-amber-500", text: "text-black" },   // bright
  yellow: { bg: "bg-yellow-500", text: "text-black" }, // bright
  lime: { bg: "bg-lime-500", text: "text-black" },     // bright

  green: { bg: "bg-green-500", text: "text-white" },
  emerald: { bg: "bg-emerald-500", text: "text-white" },
  teal: { bg: "bg-teal-500", text: "text-white" },
  cyan: { bg: "bg-cyan-500", text: "text-black" }, // brighter
  sky: { bg: "bg-sky-500", text: "text-black" },   // bright

  blue: { bg: "bg-blue-500", text: "text-white" },
  indigo: { bg: "bg-indigo-500", text: "text-white" },
  violet: { bg: "bg-violet-500", text: "text-white" },
  purple: { bg: "bg-purple-500", text: "text-white" },
  fuchsia: { bg: "bg-fuchsia-500", text: "text-white" },
  pink: { bg: "bg-pink-500", text: "text-black" }, // bright
  rose: { bg: "bg-rose-500", text: "text-white" },
};


export const tailwindColors = Object.keys(tailwindColorMap);
export const tailwindBorderMap: Record<string, string> = {
  white: "border-white",
  black: "border-black",
  slate: "border-slate-500",
  gray: "border-gray-500",
  zinc: "border-zinc-500",
  neutral: "border-neutral-500",
  stone: "border-stone-500",
  red: "border-red-500",
  orange: "border-orange-500",
  amber: "border-amber-500",
  yellow: "border-yellow-500",
  lime: "border-lime-500",
  green: "border-green-500",
  emerald: "border-emerald-500",
  teal: "border-teal-500",
  cyan: "border-cyan-500",
  sky: "border-sky-500",
  blue: "border-blue-500",
  indigo: "border-indigo-500",
  violet: "border-violet-500",
  purple: "border-purple-500",
  fuchsia: "border-fuchsia-500",
  pink: "border-pink-500",
  rose: "border-rose-500",
};
