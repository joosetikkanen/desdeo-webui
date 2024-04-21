
import ParallelCoordinatePlotWithSwap from "$lib/components/visual/visualization/props-linking/ParallelCoordinatePlotWithSwap.svelte";
import type { Meta, StoryObj } from "@storybook/svelte";



// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const meta = {
  title: "DESDEO Components/Parallel coordinate plot",
  component: ParallelCoordinatePlotWithSwap,
  tags: ["autodocs"],
} satisfies Meta<ParallelCoordinatePlotWithSwap>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Test: Story = {
  args: {
    values: [
        [1, 2, 3, 2],
        [4, 5, 6, 2],
        [7, 8, 9, 4],
        [7, 2, 9, 8],
      ],
        names: ["Objective1", "Objective2", "Objective3", "Objective4"],
        lowerIsBetter:[true, false, true, false],
        ranges: [
          { min: 0, max: 10 },
          { min: -2.324, max: 10 },
          { min: 0, max: 10 },
          { min: undefined, max: undefined },
        ],
        showIndicators: true,
        disableInteraction: false

  },
};
