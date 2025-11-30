import { Dialog as ChakraDialog } from '@chakra-ui/react';
import * as React from 'react';

export interface DialogRootProps extends ChakraDialog.RootProps {
  children: React.ReactNode;
}

export const DialogRoot = ChakraDialog.Root;
export const DialogTrigger = ChakraDialog.Trigger;
export const DialogContent = ChakraDialog.Content;
export const DialogHeader = ChakraDialog.Header;
export const DialogTitle = ChakraDialog.Title;
export const DialogDescription = ChakraDialog.Description;
export const DialogBody = ChakraDialog.Body;
export const DialogFooter = ChakraDialog.Footer;
export const DialogCloseTrigger = ChakraDialog.CloseTrigger;
export const DialogActionTrigger = ChakraDialog.ActionTrigger;
export const DialogBackdrop = ChakraDialog.Backdrop;
export const DialogPositioner = ChakraDialog.Positioner;
