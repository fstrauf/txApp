/* eslint-disable @typescript-eslint/no-explicit-any */

export const AvailableChartColors = [
  "blue",
  "orange",
  "emerald",
  "cyan",
  "amber",
  "red",
  "violet",
  "lime",
  "indigo",
  "pink",
  "teal",
  "fuchsia",
  "sky",
  "rose",
  "green",
  "yellow",
] as const

export type AvailableChartColorsKeys = (typeof AvailableChartColors)[number]

export const defaultColors: AvailableChartColorsKeys[] = [...AvailableChartColors]

export const constructCategoryColors = (
  categories: string[],
  colors: AvailableChartColorsKeys[],
): Map<string, AvailableChartColorsKeys> => {
  const categoryColors = new Map<string, AvailableChartColorsKeys>()
  categories.forEach((category, index) => {
    categoryColors.set(category, colors[index % colors.length])
  })
  return categoryColors
}

export const getColorClassName = (
  color: AvailableChartColorsKeys,
  type: "stroke" | "fill" | "bg",
): string => {
  const SvgClassNames: {
    [key in typeof type]: { [key in AvailableChartColorsKeys]: string }
  } = {
    stroke: {
      blue: "stroke-blue-500",
      orange: "stroke-orange-500",
      emerald: "stroke-emerald-500",
      cyan: "stroke-cyan-500",
      amber: "stroke-amber-500",
      red: "stroke-red-500",
      violet: "stroke-violet-500",
      lime: "stroke-lime-500",
      indigo: "stroke-indigo-500",
      pink: "stroke-pink-500",
      teal: "stroke-teal-500",
      fuchsia: "stroke-fuchsia-500",
      sky: "stroke-sky-500",
      rose: "stroke-rose-500",
      green: "stroke-green-500",
      yellow: "stroke-yellow-500",
    },
    fill: {
      blue: "fill-blue-500",
      orange: "fill-orange-500",
      emerald: "fill-emerald-500",
      cyan: "fill-cyan-500",
      amber: "fill-amber-500",
      red: "fill-red-500",
      violet: "fill-violet-500",
      lime: "fill-lime-500",
      indigo: "fill-indigo-500",
      pink: "fill-pink-500",
      teal: "fill-teal-500",
      fuchsia: "fill-fuchsia-500",
      sky: "fill-sky-500",
      rose: "fill-rose-500",
      green: "fill-green-500",
      yellow: "fill-yellow-500",
    },
    bg: {
      blue: "bg-blue-500",
      orange: "bg-orange-500",
      emerald: "bg-emerald-500",
      cyan: "bg-cyan-500",
      amber: "bg-amber-500",
      red: "bg-red-500",
      violet: "bg-violet-500",
      lime: "bg-lime-500",
      indigo: "bg-indigo-500",
      pink: "bg-pink-500",
      teal: "bg-teal-500",
      fuchsia: "bg-fuchsia-500",
      sky: "bg-sky-500",
      rose: "bg-rose-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
    },
  }
  return SvgClassNames[type][color]
}