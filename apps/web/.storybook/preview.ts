import type { Preview } from "@storybook/react";
import '../src/tokens.css';

const preview: Preview = {
  parameters: {
    a11y: {
      test: "todo",
    },
    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: '#f4fafd' },
        { name: 'white', value: '#ffffff' },
        { name: 'dark', value: '#161d1f' },
      ],
    },
  },
};

export default preview;
