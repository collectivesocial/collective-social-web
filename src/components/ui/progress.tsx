import { Progress as ChakraProgress } from '@chakra-ui/react';
import * as React from 'react';

export interface ProgressRootProps extends ChakraProgress.RootProps {
  children?: React.ReactNode;
}

export const ProgressRoot = React.forwardRef<HTMLDivElement, ProgressRootProps>(
  function ProgressRoot(props, ref) {
    const { children, ...rest } = props;
    return (
      <ChakraProgress.Root ref={ref} {...rest}>
        {children}
      </ChakraProgress.Root>
    );
  }
);

export interface ProgressBarProps extends ChakraProgress.TrackProps {}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  function ProgressBar(props, ref) {
    return (
      <ChakraProgress.Track ref={ref} {...props}>
        <ChakraProgress.Range />
      </ChakraProgress.Track>
    );
  }
);
