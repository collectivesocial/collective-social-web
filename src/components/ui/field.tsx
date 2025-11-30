import { Box, HStack, Text } from '@chakra-ui/react';
import * as React from 'react';

export interface FieldProps {
  label?: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
  invalid?: boolean;
  errorText?: string;
}

export function Field({ label, required, children, error, invalid, errorText }: FieldProps) {
  const showError = error || (invalid && errorText);
  
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
      {showError && (
        <Text color="fg.error" fontSize="sm" mt={1}>
          {showError}
        </Text>
      )}
    </Box>
  );
}
