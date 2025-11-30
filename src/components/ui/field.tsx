import { Box, HStack, Text } from '@chakra-ui/react';
import * as React from 'react';

export interface FieldProps {
  label?: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}

export function Field({ label, required, children, error }: FieldProps) {
  return (
    <Box>
      {label && (
        <HStack justify="space-between" mb={2}>
          <Text fontWeight="medium" fontSize="sm">
            {label}
            {required && (
              <Text as="span" color="fg.error" ml={1}>
                *
              </Text>
            )}
          </Text>
        </HStack>
      )}
      {children}
      {error && (
        <Text color="fg.error" fontSize="sm" mt={1}>
          {error}
        </Text>
      )}
    </Box>
  );
}
