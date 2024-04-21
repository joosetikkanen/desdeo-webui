
import ScoreBands from "$lib/components/visual/visualization/props-linking/SCOREBands.svelte";
import type { Meta, StoryObj } from "@storybook/svelte";



// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const meta = {
  title: "DESDEO Components/SCORE Bands",
  component: ScoreBands,
  tags: ["autodocs"],
} satisfies Meta<ScoreBands>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Test: Story = {
  args: {

  },
};
