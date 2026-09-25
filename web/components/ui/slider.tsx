import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "cn"

function Slider<Value extends number | readonly number[] = number[]>({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  onValueChange,
  ...props
}: SliderPrimitive.Root.Props<Value>) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max]

  // Base UI has two quirks every consumer here is written around, so both
  // are normalized in one place:
  //   1. Shape: for a single-thumb (non-`range`) slider it calls back with a
  //      bare number from pointer/drag interaction, even though our
  //      controlled `value` prop is always an array (e.g. `value={[K]}`) --
  //      every call site in this app does `onValueChange={(v) => setK(v[0])}`,
  //      so a bare number silently produced `v[0] === undefined` on every
  //      drag while keyboard interaction (which *does* report an array)
  //      kept working, masking this as a "mouse doesn't work" bug.
  //   2. Validity: it can report a non-finite value on edge cases (pointer
  //      leaving the track, a range collapsing to a single point).
  // Both are handled here so every consumer can assume `onValueChange`
  // always delivers a valid, finite-number array.
  type OnValueChange = NonNullable<typeof onValueChange>
  const handleValueChange = (newValue: unknown, ...rest: unknown[]) => {
    const arr = (Array.isArray(newValue) ? newValue : [newValue]) as number[]
    const isValid = arr.every((v) => typeof v === "number" && Number.isFinite(v))
    if (!isValid) return
    const callback = onValueChange as unknown as ((v: number[], ...r: unknown[]) => void) | undefined
    callback?.(arr, ...rest)
  }

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      onValueChange={handleValueChange as OnValueChange}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-muted select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
