
import HorizontalBarWithInputs from '$lib/components/visual/preference-interaction/HorizontalBarWithInputs.svelte';
import type { Meta, StoryObj } from '@storybook/svelte';



// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const meta = {
  title: 'DESDEO Components/Horizontal Bar',
  component: HorizontalBarWithInputs,
  tags: ['autodocs'],
} satisfies Meta<HorizontalBarWithInputs>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Test: Story = {
  args: {
    lowerBound: 0,
    higherBound: 1,
    barName: "Objective X",
    solutionValue: 1,
    selectedValue: 1,
    previousValue: 1,
    lowerIsBetter: true,
    barColor: "blue",
    arrowMode: false
  },
};

/* export const Secondary: Story = {
  args: {
    label: 'Button',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    label: 'Button',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    label: 'Button',
  },
}; */
