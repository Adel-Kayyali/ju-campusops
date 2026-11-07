import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  headings: { fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  components: {
    Paper: { defaultProps: { shadow: 'xs' } },
    Modal: { defaultProps: { overlayProps: { backgroundOpacity: 0.4, blur: 2 } } },
  },
});
